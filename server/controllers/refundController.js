import mongoose from 'mongoose';
import Appointment from '../models/appointmentModel.js';
import Order from '../models/orderModel.js';
import { getRazorpayInstance } from '../config/razorpay.js';

const sanitizeText = (value, max = 500) => String(value || '').replace(/\s+/g, ' ').trim().slice(0, max);

const isObjectId = (id) => mongoose.Types.ObjectId.isValid(String(id || ''));

const getActor = (req) => String(req.admin?.id || req.user?.id || 'admin');

const isCodOrder = (order) => String(order?.paymentMethod || '').toLowerCase() !== 'razorpay';

const isEligibleForCodRefundRequest = (order) => {
  if (!order) return false;
  if (!isCodOrder(order)) return false;
  if (String(order.paymentStatus || '') !== 'Paid' && String(order.paymentStatus || '') !== 'Refund Failed') {
    return false;
  }

  const status = String(order.status || '');
  const hasApprovedReturn = String(order.returnRequest?.status || '') === 'Approved';
  return status === 'Cancelled' || hasApprovedReturn;
};

export const listAppointmentRefunds = async (req, res) => {
  try {
    const status = sanitizeText(req.query.status, 40);

    const query = {
      status: 'Cancelled',
      'refundControl.status': { $ne: 'None' },
    };

    if (status) {
      query['refundControl.status'] = status;
    }

    const appointments = await Appointment.find(query)
      .populate('user', 'name email')
      .populate('doctor', 'name email')
      .sort({ cancelledAt: -1, updatedAt: -1 })
      .limit(300);

    return res.status(200).json({
      success: true,
      appointments,
      count: appointments.length,
    });
  } catch (error) {
    console.error('List appointment refunds error:', error);
    return res.status(500).json({ success: false, message: 'Failed to fetch appointment refunds' });
  }
};

export const decideAppointmentRefund = async (req, res) => {
  try {
    const { id } = req.params;
    const { action } = req.query;
    const adminNotes = sanitizeText(req.body?.adminNotes, 500);

    if (!isObjectId(id)) {
      return res.status(400).json({ success: false, message: 'Invalid appointment id' });
    }

    if (!['approve', 'reject'].includes(String(action || ''))) {
      return res.status(400).json({ success: false, message: 'Invalid refund action' });
    }

    const appointment = await Appointment.findById(id);
    if (!appointment) {
      return res.status(404).json({ success: false, message: 'Appointment not found' });
    }

    if (String(appointment.status || '') !== 'Cancelled') {
      return res.status(400).json({ success: false, message: 'Only cancelled appointments can be refunded' });
    }

    const currentStatus = String(appointment.refundControl?.status || 'None');
    if (currentStatus === 'Refunded') {
      return res.status(409).json({ success: false, message: 'Refund already completed' });
    }

    if (!['PendingApproval', 'Failed'].includes(currentStatus)) {
      return res.status(400).json({ success: false, message: `Refund is not actionable in status: ${currentStatus}` });
    }

    if (action === 'reject') {
      appointment.refundControl = {
        ...(appointment.refundControl || {}),
        status: 'Rejected',
        adminNotes: adminNotes || 'Refund request rejected by admin',
        decisionAt: new Date(),
        decidedBy: getActor(req),
        failureReason: '',
      };
      appointment.paymentStatus = 'Refund Rejected';
      await appointment.save();

      return res.status(200).json({
        success: true,
        message: 'Appointment refund rejected',
        appointment,
      });
    }

    const refundAmount = Number(appointment.refundControl?.amount || 0);
    if (refundAmount <= 0) {
      return res.status(400).json({ success: false, message: 'Invalid refund amount' });
    }

    if (!appointment.razorpayPaymentId) {
      appointment.refundControl = {
        ...(appointment.refundControl || {}),
        status: 'Failed',
        failureReason: 'Missing Razorpay payment reference',
        adminNotes: adminNotes || 'Refund failed: missing payment reference',
        decisionAt: new Date(),
        decidedBy: getActor(req),
      };
      appointment.paymentStatus = 'Refund Failed';
      await appointment.save();
      return res.status(400).json({ success: false, message: 'Missing payment reference for gateway refund' });
    }

    appointment.refundControl = {
      ...(appointment.refundControl || {}),
      status: 'Processing',
      decisionAt: new Date(),
      decidedBy: getActor(req),
      adminNotes: adminNotes || 'Refund approved',
      gateway: 'Razorpay',
      failureReason: '',
    };
    appointment.paymentStatus = 'Refund Pending';
    await appointment.save();

    try {
      const razorpay = getRazorpayInstance();
      const refundResponse = await razorpay.payments.refund(appointment.razorpayPaymentId, {
        amount: Math.round(refundAmount * 100),
        notes: {
          appointmentId: String(appointment._id),
          actor: getActor(req),
          policyTier: String(appointment.refundControl?.policyTier || 'none'),
        },
      });

      appointment.refundControl = {
        ...(appointment.refundControl || {}),
        status: 'Refunded',
        refundedAt: new Date(),
        gatewayRefundId: String(refundResponse?.id || ''),
        failureReason: '',
      };
      appointment.paymentStatus = 'Refunded';
      await appointment.save();

      return res.status(200).json({
        success: true,
        message: 'Appointment refund processed successfully',
        appointment,
      });
    } catch (gatewayError) {
      appointment.refundControl = {
        ...(appointment.refundControl || {}),
        status: 'Failed',
        failureReason: sanitizeText(gatewayError?.error?.description || gatewayError?.message || 'Gateway refund failed', 300),
      };
      appointment.paymentStatus = 'Refund Failed';
      await appointment.save();

      return res.status(502).json({
        success: false,
        message: 'Gateway refund failed',
        error: appointment.refundControl.failureReason,
      });
    }
  } catch (error) {
    console.error('Decide appointment refund error:', error);
    return res.status(500).json({ success: false, message: 'Failed to process appointment refund' });
  }
};

export const listCodRefundOrders = async (req, res) => {
  try {
    const status = sanitizeText(req.query.status, 40);

    const query = {
      paymentMethod: { $ne: 'Razorpay' },
      $or: [
        { 'codRefund.status': { $in: ['Requested', 'Approved', 'Rejected', 'Refunded', 'Failed'] } },
        {
          paymentStatus: { $in: ['Paid', 'Refund Pending', 'Refund Failed'] },
          $or: [
            { status: 'Cancelled' },
            { 'returnRequest.status': 'Approved' },
          ],
        },
      ],
    };

    if (status) {
      query['codRefund.status'] = status;
    }

    const orders = await Order.find(query)
      .populate('user', 'name email')
      .sort({ updatedAt: -1, createdAt: -1 })
      .limit(300);

    return res.status(200).json({ success: true, orders, count: orders.length });
  } catch (error) {
    console.error('List COD refunds error:', error);
    return res.status(500).json({ success: false, message: 'Failed to fetch COD refund orders' });
  }
};

export const requestCodRefund = async (req, res) => {
  try {
    const { id } = req.params;
    const reason = sanitizeText(req.body?.reason, 300);
    const requestedAmount = Number(req.body?.amount || 0);

    if (!isObjectId(id)) {
      return res.status(400).json({ success: false, message: 'Invalid order id' });
    }

    const order = await Order.findById(id);
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    if (!isEligibleForCodRefundRequest(order)) {
      return res.status(400).json({ success: false, message: 'Order is not eligible for COD refund request' });
    }

    const currentStatus = String(order.codRefund?.status || 'None');
    if (['Requested', 'Approved', 'Refunded'].includes(currentStatus)) {
      return res.status(409).json({ success: false, message: `COD refund already in progress (${currentStatus})` });
    }

    const maxRefundAmount = Number(order.totalAmount || 0);
    const finalAmount = requestedAmount > 0 ? requestedAmount : maxRefundAmount;

    if (finalAmount <= 0 || finalAmount > maxRefundAmount) {
      return res.status(400).json({ success: false, message: 'Invalid COD refund amount' });
    }

    order.codRefund = {
      ...(order.codRefund || {}),
      status: 'Requested',
      amount: Math.round(finalAmount * 100) / 100,
      reason: reason || 'Admin initiated COD refund request',
      requestedAt: new Date(),
      adminNotes: reason || '',
      failureReason: '',
      payoutMethod: '',
      payoutReference: '',
      decisionAt: null,
      refundedAt: null,
    };
    order.paymentStatus = 'Refund Pending';
    await order.save();

    return res.status(200).json({ success: true, message: 'COD refund requested', order });
  } catch (error) {
    console.error('Request COD refund error:', error);
    return res.status(500).json({ success: false, message: 'Failed to request COD refund' });
  }
};

export const decideCodRefund = async (req, res) => {
  try {
    const { id } = req.params;
    const { action } = req.query;
    const adminNotes = sanitizeText(req.body?.adminNotes, 500);
    const payoutMethod = sanitizeText(req.body?.payoutMethod, 20);
    const payoutReference = sanitizeText(req.body?.payoutReference, 120);

    if (!isObjectId(id)) {
      return res.status(400).json({ success: false, message: 'Invalid order id' });
    }

    if (!['approve', 'reject'].includes(String(action || ''))) {
      return res.status(400).json({ success: false, message: 'Invalid COD refund action' });
    }

    const order = await Order.findById(id);
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    if (!isCodOrder(order)) {
      return res.status(400).json({ success: false, message: 'COD refund action is only available for non-Razorpay orders' });
    }

    const currentStatus = String(order.codRefund?.status || 'None');
    if (currentStatus === 'Refunded') {
      return res.status(409).json({ success: false, message: 'COD refund already completed' });
    }

    if (!['Requested', 'Approved', 'Failed'].includes(currentStatus)) {
      return res.status(400).json({ success: false, message: `COD refund is not actionable in status: ${currentStatus}` });
    }

    if (action === 'reject') {
      order.codRefund = {
        ...(order.codRefund || {}),
        status: 'Rejected',
        adminNotes: adminNotes || 'COD refund rejected by admin',
        decidedBy: getActor(req),
        decisionAt: new Date(),
        failureReason: '',
      };
      order.paymentStatus = 'Refund Rejected';
      await order.save();
      return res.status(200).json({ success: true, message: 'COD refund rejected', order });
    }

    if (!['UPI', 'Bank', 'Cash', 'Wallet'].includes(payoutMethod)) {
      return res.status(400).json({ success: false, message: 'Valid payout method is required' });
    }

    if (!payoutReference || payoutReference.length < 3) {
      return res.status(400).json({ success: false, message: 'Payout reference is required' });
    }

    const amount = Number(order.codRefund?.amount || 0);
    if (amount <= 0 || amount > Number(order.totalAmount || 0)) {
      return res.status(400).json({ success: false, message: 'Invalid COD refund amount' });
    }

    order.codRefund = {
      ...(order.codRefund || {}),
      status: 'Refunded',
      decidedBy: getActor(req),
      decisionAt: new Date(),
      refundedAt: new Date(),
      payoutMethod,
      payoutReference,
      adminNotes: adminNotes || 'COD refund marked as completed',
      failureReason: '',
    };
    order.paymentStatus = 'Refunded';
    await order.save();

    return res.status(200).json({ success: true, message: 'COD refund marked as refunded', order });
  } catch (error) {
    console.error('Decide COD refund error:', error);
    return res.status(500).json({ success: false, message: 'Failed to process COD refund action' });
  }
};
