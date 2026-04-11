import crypto from 'crypto';
import Order from '../models/orderModel.js';
import User from '../models/userModel.js';
import Product from '../models/productModel.js';
import DeliveryLocationRule from '../models/deliveryLocationRuleModel.js';
import nodemailer from 'nodemailer';
import { getRazorpayInstance, getRazorpayKeyId } from '../config/razorpay.js';

const DELIVERY_FEE = Number(process.env.DELIVERY_FEE || 50);

const normalizeText = (value) => String(value || "").trim().toLowerCase();

const normalizePincode = (value) => String(value || "").replace(/\D/g, "").trim();

const validateShippingDetails = async (shippingDetails) => {
    if (!shippingDetails) return 'Shipping details are required';

    const { fullName, email, phone, address, city, state, country, zip } = shippingDetails;

    if (!fullName || !email || !phone || !address || !city || !state || !country || !zip) {
        return 'All shipping details are required';
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        return 'Invalid email address';
    }

    if (!/^\d{10}$/.test(String(phone).replace(/\D/g, ''))) {
        return 'Phone number must be 10 digits';
    }

    const normalizedZip = normalizePincode(zip);
    if (!/^\d{5,6}$/.test(normalizedZip)) {
        return 'ZIP Code must be 5-6 digits';
    }

    const rules = await DeliveryLocationRule.findOne({ singletonKey: 'global' });
    if (!rules || !rules.isEnabled) return null;

    const cityAllowed = new Set((rules.allowedCities || []).map(normalizeText));
    const stateAllowed = new Set((rules.allowedStates || []).map(normalizeText));
    const countryAllowed = new Set((rules.allowedCountries || []).map(normalizeText));
    const pincodeAllowed = new Set((rules.allowedPincodes || []).map(normalizePincode));

    const normalizedCity = normalizeText(city);
    const normalizedState = normalizeText(state);
    const normalizedCountry = normalizeText(country);

    if (cityAllowed.size > 0 && !cityAllowed.has(normalizedCity)) {
        return 'Delivery is not available for this city';
    }

    if (stateAllowed.size > 0 && !stateAllowed.has(normalizedState)) {
        return 'Delivery is not available for this state';
    }

    if (countryAllowed.size > 0 && !countryAllowed.has(normalizedCountry)) {
        return 'Delivery is not available for this country';
    }

    if (pincodeAllowed.size > 0 && !pincodeAllowed.has(normalizedZip)) {
        return 'Delivery is not available for this pincode';
    }

    return null;
};

const buildSecureOrder = async (items) => {
    if (!items || !Array.isArray(items) || items.length === 0) {
        throw new Error('Items are required');
    }

    const secureItems = [];
    let computedTotal = 0;

    for (const item of items) {
        const productId = item.productId;
        const quantity = Number(item.quantity || 0);
        const size = item.size || '';

        if (!productId || quantity <= 0) {
            throw new Error('Invalid item in order');
        }

        const product = await Product.findById(productId).select('name price stock images category isActive');
        if (!product) {
            throw new Error(`Product not found: ${productId}`);
        }

        if (product.isActive === false) {
            throw new Error(`Product is inactive: ${product.name}`);
        }

        if (product.stock < quantity) {
            throw new Error(`Insufficient stock for ${product.name}`);
        }

        const safePrice = Number(product.price);
        const lineTotal = safePrice * quantity;

        secureItems.push({
            productId: product._id,
            name: product.name,
            price: safePrice,
            quantity,
            size,
            image: Array.isArray(product.images) ? product.images[0] : product.images,
            category: product.category,
        });

        computedTotal += lineTotal;
    }

    const totalAmount = computedTotal + DELIVERY_FEE;

    return { secureItems, totalAmount };
};

const adjustProductStock = async (items, direction) => {
    const delta = Number(direction || 0);
    if (!delta || !Array.isArray(items) || items.length === 0) {
        return;
    }

    for (const item of items) {
        await Product.updateOne(
            { _id: item.productId },
            { $inc: { stock: delta * Number(item.quantity || 0) } }
        );
    }
};

const sanitizeOrderText = (value, max = 500) => String(value || '').replace(/\s+/g, ' ').trim().slice(0, max);

const isOnlinePaidOrder = (order) => String(order?.paymentMethod || '').toLowerCase() === 'razorpay';

const processOnlineOrderRefund = async (order, adminNotes = '') => {
        if (!order?.razorpayPaymentId) {
                order.paymentStatus = 'Refund Failed';
                order.cancelRequest = {
                        ...(order.cancelRequest || {}),
                        adminNotes: adminNotes || 'Refund failed: missing Razorpay payment reference',
                };
                return { ok: false, message: 'Missing Razorpay payment reference' };
        }

        try {
            const razorpay = getRazorpayInstance();
            const refundResponse = await razorpay.payments.refund(order.razorpayPaymentId, {
                amount: Math.round(Number(order.totalAmount || 0) * 100),
                notes: {
                    orderId: String(order._id),
                    reason: String(order.cancelRequest?.reason || 'Cancellation approved'),
                },
            });

            order.paymentStatus = 'Refunded';
            order.cancelRequest = {
                ...(order.cancelRequest || {}),
                adminNotes: adminNotes || order.cancelRequest?.adminNotes || '',
                decidedBy: order.cancelRequest?.decidedBy || '',
            };

            return { ok: true, refundId: String(refundResponse?.id || '') };
        } catch (error) {
            order.paymentStatus = 'Refund Failed';
            return { ok: false, message: error?.error?.description || error?.message || 'Refund failed' };
        }
};

const createEmailTransporter = () =>
    process.env.EMAIL_HOST
        ? nodemailer.createTransport({
            host: process.env.EMAIL_HOST,
            port: Number(process.env.EMAIL_PORT) || 587,
            secure: process.env.EMAIL_SECURE === 'true',
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS,
            },
        })
        : nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS,
            },
        });

const sendRequestDecisionEmail = async ({
    order,
    requestType,
    decision,
    adminNotes,
    previousStatus,
}) => {
    const recipientEmail = order?.shippingDetails?.email;
    if (!recipientEmail) return;

    const customerName = order?.shippingDetails?.fullName || 'Customer';
    const isApproved = decision === 'Approved';
    const currentStatus = order?.status;

    const transporter = createEmailTransporter();
    await transporter.sendMail({
        from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
        to: recipientEmail,
        subject: `${requestType} Request ${decision} - SehatRazz`,
        html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9fafb; border-radius: 10px;">
                <div style="background-color: #4f46e5; padding: 20px; border-radius: 10px 10px 0 0; text-align: center;">
                    <h1 style="color: white; margin: 0;">SehatRazz</h1>
                </div>
                <div style="background-color: white; padding: 30px; border-radius: 0 0 10px 10px;">
                    <h2 style="color: #111827; margin-top: 0;">${requestType} Request ${decision}</h2>
                    <p style="color: #4b5563; font-size: 16px;">Dear ${customerName},</p>
                    <p style="color: #4b5563; font-size: 16px;">Your ${requestType.toLowerCase()} request for order <strong>${order._id}</strong> has been <strong>${decision.toLowerCase()}</strong>.</p>
                    <div style="background-color: #f3f4f6; padding: 16px; border-radius: 8px; margin: 20px 0;">
                        <p style="margin: 6px 0; color: #374151;"><strong>Previous Status:</strong> ${previousStatus}</p>
                        <p style="margin: 6px 0; color: #374151;"><strong>Current Status:</strong> ${currentStatus}</p>
                        ${isApproved
                            ? `<p style="margin: 6px 0; color: #374151;">Your order status has been updated to <strong>Processing</strong>.</p>`
                            : `<p style="margin: 6px 0; color: #374151;">Your order status remains unchanged.</p>`}
                    </div>
                    ${adminNotes
                        ? `<div style="background-color: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; margin: 20px 0;"><p style="margin: 0; color: #92400e; font-weight: bold;">Admin Note:</p><p style="margin: 10px 0 0 0; color: #78350f;">${adminNotes}</p></div>`
                        : ''}
                    <p style="color: #4b5563; font-size: 16px; margin-top: 20px;">If you need help, please contact SehatRazz support.</p>
                </div>
            </div>
        `,
    });
};

export const createOrder = async (req, res) => {
    try {
        const userId = req.user?._id;
        const { items, paymentMethod, shippingDetails } = req.body;

        if (!userId) {
            return res.status(401).json({ success: false, message: 'Unauthorized' });
        }

        if (!paymentMethod) {
            return res.status(400).json({ success: false, message: 'Payment method is required' });
        }

        const shippingValidationError = await validateShippingDetails(shippingDetails);
        if (shippingValidationError) {
            return res.status(400).json({ success: false, message: shippingValidationError });
        }

        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        const { secureItems, totalAmount } = await buildSecureOrder(items);

        const order = new Order({
            user: userId,
            items: secureItems,
            totalAmount,
            paymentMethod,
            paymentStatus: 'Pending',
            shippingDetails,
            status: 'Pending',
        });

        await order.save();

        try {
            await adjustProductStock(secureItems, -1);
        } catch (stockError) {
            await Order.findByIdAndDelete(order._id);
            throw stockError;
        }

        user.cart = [];
        await user.save();

        res.status(201).json({ success: true, message: 'Order created successfully', order });
    } catch (error) {
        console.error('Create order error:', error);
        res.status(500).json({ success: false, message: error.message || 'Server error' });
    }
};

export const createOnlineOrder = async (req, res) => {
    try {
        const userId = req.user?._id;
        const { items, shippingDetails } = req.body;

        if (!userId) {
            return res.status(401).json({ success: false, message: 'Unauthorized' });
        }

        const shippingValidationError = await validateShippingDetails(shippingDetails);
        if (shippingValidationError) {
            return res.status(400).json({ success: false, message: shippingValidationError });
        }

        const user = await User.findById(userId).select('name email');
        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        const { secureItems, totalAmount } = await buildSecureOrder(items);

        const razorpay = getRazorpayInstance();
        const razorpayOrder = await razorpay.orders.create({
            amount: Math.round(totalAmount * 100),
            currency: 'INR',
            receipt: `receipt_${Date.now()}`,
            notes: { userId: String(userId) },
        });

        const order = new Order({
            user: userId,
            items: secureItems,
            totalAmount,
            paymentMethod: 'Razorpay',
            paymentStatus: 'Pending',
            shippingDetails,
            status: 'Pending',
            razorpayOrderId: razorpayOrder.id,
        });

        await order.save();

        try {
            await adjustProductStock(secureItems, -1);
        } catch (stockError) {
            await Order.findByIdAndDelete(order._id);
            throw stockError;
        }

        return res.status(201).json({
            success: true,
            message: 'Online payment order created',
            orderId: order._id,
            keyId: getRazorpayKeyId(),
            razorpayOrderId: razorpayOrder.id,
            amount: razorpayOrder.amount,
            currency: razorpayOrder.currency,
            customer: {
                name: shippingDetails.fullName || user.name,
                email: shippingDetails.email || user.email,
                contact: shippingDetails.phone,
            },
        });
    } catch (error) {
        console.error('Create online order error:', error);
        res.status(500).json({ success: false, message: error.message || 'Server error' });
    }
};

export const verifyOnlinePayment = async (req, res) => {
    try {
        const userId = req.user?._id;
        const { orderId, razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

        if (!userId) {
            return res.status(401).json({ success: false, message: 'Unauthorized' });
        }

        if (!orderId || !razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
            return res.status(400).json({ success: false, message: 'Missing payment verification fields' });
        }

        const order = await Order.findById(orderId);
        if (!order) {
            return res.status(404).json({ success: false, message: 'Order not found' });
        }

        if (String(order.user) !== String(userId)) {
            return res.status(403).json({ success: false, message: 'Unauthorized access' });
        }

        if (!order.razorpayOrderId || order.razorpayOrderId !== razorpay_order_id) {
            return res.status(400).json({ success: false, message: 'Invalid Razorpay order ID' });
        }

        if (!process.env.RAZORPAY_KEY_SECRET) {
            return res.status(500).json({ success: false, message: 'Razorpay secret not configured' });
        }

        const body = `${razorpay_order_id}|${razorpay_payment_id}`;
        const expectedSignature = crypto
            .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
            .update(body)
            .digest('hex');

        const receivedBuffer = Buffer.from(String(razorpay_signature));
        const expectedBuffer = Buffer.from(String(expectedSignature));

        const isValidSignature =
            receivedBuffer.length === expectedBuffer.length &&
            crypto.timingSafeEqual(receivedBuffer, expectedBuffer);

        if (!isValidSignature) {
            order.paymentStatus = 'Failed';
            await order.save();
            return res.status(400).json({ success: false, message: 'Payment signature verification failed' });
        }

        order.paymentStatus = 'Paid';
        order.status = 'Processing';
        order.razorpayPaymentId = razorpay_payment_id;
        order.razorpaySignature = razorpay_signature;
        order.paidAt = new Date();
        await order.save();

        await User.findByIdAndUpdate(userId, { cart: [] });

        return res.status(200).json({ success: true, message: 'Payment verified successfully', order });
    } catch (error) {
        console.error('Verify online payment error:', error);
        return res.status(500).json({ success: false, message: error.message || 'Server error' });
    }
};

export const getMyOrders = async (req, res) => {
    try {
        const userId = req.user?._id;

        if (!userId) {
            return res.status(401).json({ success: false, message: 'Unauthorized' });
        }

        const orders = await Order.find({ user: userId })
            .populate('user', '-password')
            .sort({ createdAt: -1 });

        res.status(200).json({ success: true, orders });
    } catch (error) {
        console.error('Get orders error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

export const getOrderById = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user?._id;

        if (!userId) {
            return res.status(401).json({ success: false, message: 'Unauthorized' });
        }

        const order = await Order.findById(id).populate('user', '-password');

        if (!order) {
            return res.status(404).json({ success: false, message: 'Order not found' });
        }

        if (order.user._id.toString() !== userId.toString()) {
            return res.status(403).json({ success: false, message: 'Unauthorized access' });
        }

        res.status(200).json({ success: true, order });
    } catch (error) {
        console.error('Get order error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

export const updateOrderStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status, paymentStatus, notes } = req.body;

        const existingOrder = await Order.findById(id);
        if (!existingOrder) {
            return res.status(404).json({ success: false, message: 'Order not found' });
        }

        const updateData = {};
        let sendEmail = false;

        if (status) {
            if (!['Pending', 'Processing', 'Shipped', 'Out for Delivery', 'Delivered', 'Cancelled'].includes(status)) {
                return res.status(400).json({ success: false, message: 'Invalid order status' });
            }
            updateData.status = status;
            if (status === 'Delivered') {
                const deliveredAt = new Date();
                updateData.deliveredAt = deliveredAt;
                updateData.returnDeadlineDate = new Date(deliveredAt.getTime() + 7 * 24 * 60 * 60 * 1000);
            }
            sendEmail = true;
        }

        if (paymentStatus) {
            if (!['Pending', 'Paid', 'Failed', 'Refund Pending', 'Refunded', 'Refund Rejected', 'Refund Failed'].includes(paymentStatus)) {
                return res.status(400).json({ success: false, message: 'Invalid payment status' });
            }
            updateData.paymentStatus = paymentStatus;
        }

        if (notes !== undefined) {
            updateData.notes = notes;
        }

        const order = await Order.findByIdAndUpdate(
            id,
            updateData,
            { new: true }
        ).populate('user', '-password');

        if (updateData.status === 'Cancelled' && existingOrder.status !== 'Cancelled') {
            await adjustProductStock(existingOrder.items, 1);
        }

        if (sendEmail && order.shippingDetails && order.shippingDetails.email) {
            try {
                const transporter = process.env.EMAIL_HOST
                    ? nodemailer.createTransport({
                        host: process.env.EMAIL_HOST,
                        port: Number(process.env.EMAIL_PORT) || 587,
                        secure: process.env.EMAIL_SECURE === 'true',
                        auth: {
                            user: process.env.EMAIL_USER,
                            pass: process.env.EMAIL_PASS,
                        },
                    })
                    : nodemailer.createTransport({
                        service: 'gmail',
                        auth: {
                            user: process.env.EMAIL_USER,
                            pass: process.env.EMAIL_PASS,
                        },
                    });

                const statusColors = {
                    Pending: '#f97316',
                    Processing: '#eab308',
                    Shipped: '#3b82f6',
                    Delivered: '#22c55e',
                    Cancelled: '#ef4444',
                };

                await transporter.sendMail({
                    from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
                    to: order.shippingDetails.email,
                    subject: 'Order Status Update - SehatRazz',
                    html: `
                        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9fafb; border-radius: 10px;">
                            <div style="background-color: #4f46e5; padding: 20px; border-radius: 10px 10px 0 0; text-align: center;">
                                <h1 style="color: white; margin: 0;">SehatRazz</h1>
                            </div>
                            <div style="background-color: white; padding: 30px; border-radius: 0 0 10px 10px;">
                                <h2 style="color: #111827; margin-top: 0;">Order Status Update</h2>
                                <p style="color: #4b5563; font-size: 16px;">Dear ${order.shippingDetails.fullName},</p>
                                <p style="color: #4b5563; font-size: 16px;">Your order has been updated:</p>
                                <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
                                    <p style="margin: 5px 0; color: #6b7280;"><strong>Order ID:</strong> ${order._id}</p>
                                    <p style="margin: 5px 0; color: #6b7280;"><strong>Total Amount:</strong> ₹${order.totalAmount}</p>
                                    <p style="margin: 5px 0; color: #6b7280;">
                                        <strong>Status:</strong>
                                        <span style="background-color: ${statusColors[status] || '#6b7280'}; color: white; padding: 4px 12px; border-radius: 20px; font-weight: bold;">
                                            ${status}
                                        </span>
                                    </p>
                                </div>
                                ${notes ? `
                                    <div style="background-color: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; margin: 20px 0;">
                                        <p style="margin: 0; color: #92400e; font-weight: bold;">Note from SehatRazz:</p>
                                        <p style="margin: 10px 0 0 0; color: #78350f;">${notes}</p>
                                    </div>
                                ` : ''}
                                <p style="color: #4b5563; font-size: 16px; margin-top: 20px;">Thank you for shopping with us!</p>
                                <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb; text-align: center;">
                                    <p style="color: #9ca3af; font-size: 14px; margin: 0;">© 2026 SehatRazz. All rights reserved.</p>
                                </div>
                            </div>
                        </div>
                    `,
                });
            } catch (emailError) {
                console.error('Failed to send email notification:', emailError);
            }
        }

        return res.status(200).json({ success: true, message: 'Order updated successfully', order });
    } catch (error) {
        console.error('Update order error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

export const cancelOrder = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user?._id;
        const { reason } = req.body;

        if (!userId) {
            return res.status(401).json({ success: false, message: 'Unauthorized' });
        }

        const order = await Order.findById(id);

        if (!order) {
            return res.status(404).json({ success: false, message: 'Order not found' });
        }

        if (String(order.user) !== String(userId)) {
            return res.status(403).json({ success: false, message: 'Unauthorized access' });
        }

        if (!['Pending', 'Processing'].includes(order.status)) {
            return res.status(400).json({ success: false, message: `Cannot request cancellation for order with status: ${order.status}` });
        }

        const cancelRequestStatus = String(order.cancelRequest?.status || 'None');
        if (cancelRequestStatus === 'Requested') {
            return res.status(409).json({ success: false, message: 'Cancellation request is already pending' });
        }

        order.cancelRequest = {
            ...(order.cancelRequest || {}),
            status: 'Requested',
            reason: sanitizeOrderText(reason || 'User requested cancellation', 300),
            requestDate: new Date(),
            decisionDate: null,
            adminNotes: '',
            decidedBy: '',
        };
        await order.save();

        return res.status(200).json({
            success: true,
            message: 'Cancellation request submitted for admin approval',
            order,
        });
    } catch (error) {
        console.error('Cancel order error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

export const listCancelRequests = async (req, res) => {
    try {
        const status = String(req.query.status || 'Requested').trim();
        const query = {
            'cancelRequest.status': status === 'all' ? { $ne: 'None' } : status,
        };

        const orders = await Order.find(query)
            .populate('user', 'name email')
            .sort({ updatedAt: -1, createdAt: -1 });

        return res.status(200).json({ success: true, orders, count: orders.length });
    } catch (error) {
        console.error('List cancel requests error:', error);
        return res.status(500).json({ success: false, message: 'Failed to fetch cancel requests' });
    }
};

export const approveCancelRequest = async (req, res) => {
    try {
        const { id } = req.params;
        const adminNotes = sanitizeOrderText(req.body?.adminNotes, 500);

        const order = await Order.findById(id);
        if (!order) {
            return res.status(404).json({ success: false, message: 'Order not found' });
        }

        if (String(order.cancelRequest?.status || 'None') !== 'Requested') {
            return res.status(400).json({ success: false, message: 'No pending cancellation request' });
        }

        const previousStatus = order.status;

        order.cancelRequest = {
            ...(order.cancelRequest || {}),
            status: 'Approved',
            decisionDate: new Date(),
            adminNotes,
            decidedBy: String(req.admin?.id || 'admin'),
        };
        order.status = 'Cancelled';
        order.cancelReason = order.cancelRequest.reason || 'Admin approved cancellation';

        await adjustProductStock(order.items, 1);

        if (isOnlinePaidOrder(order) && String(order.paymentStatus || '') === 'Paid') {
            order.paymentStatus = 'Refund Pending';
            await order.save();

            const refundResult = await processOnlineOrderRefund(order, adminNotes);
            if (!refundResult.ok) {
                await order.save();
                return res.status(502).json({
                    success: false,
                    message: refundResult.message || 'Failed to process online refund',
                    order,
                });
            }
        }

        if (!isOnlinePaidOrder(order) && String(order.paymentStatus || '') === 'Paid') {
            order.codRefund = {
                ...(order.codRefund || {}),
                status: 'Requested',
                amount: Number(order.totalAmount || 0),
                reason: order.cancelRequest.reason || 'Approved cancellation for COD order',
                requestedAt: new Date(),
                adminNotes: adminNotes || '',
                failureReason: '',
                payoutMethod: '',
                payoutReference: '',
            };
            order.paymentStatus = 'Refund Pending';
        }

        await order.save();

        return res.status(200).json({
            success: true,
            message: 'Cancellation approved',
            order,
            previousStatus,
        });
    } catch (error) {
        console.error('Approve cancel request error:', error);
        return res.status(500).json({ success: false, message: 'Failed to approve cancellation request' });
    }
};

export const rejectCancelRequest = async (req, res) => {
    try {
        const { id } = req.params;
        const adminNotes = sanitizeOrderText(req.body?.adminNotes, 500);

        const order = await Order.findById(id);
        if (!order) {
            return res.status(404).json({ success: false, message: 'Order not found' });
        }

        if (String(order.cancelRequest?.status || 'None') !== 'Requested') {
            return res.status(400).json({ success: false, message: 'No pending cancellation request' });
        }

        order.cancelRequest = {
            ...(order.cancelRequest || {}),
            status: 'Rejected',
            decisionDate: new Date(),
            adminNotes,
            decidedBy: String(req.admin?.id || 'admin'),
        };

        await order.save();

        return res.status(200).json({ success: true, message: 'Cancellation rejected', order });
    } catch (error) {
        console.error('Reject cancel request error:', error);
        return res.status(500).json({ success: false, message: 'Failed to reject cancellation request' });
    }
};

export const getAllOrders = async (req, res) => {
    const orders = await Order.find().populate('user').populate('assignedTo', 'name email phone').sort({ createdAt: 1 });
    return res.json({ success: true, orders });
};

export const requestReturn = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user?._id;
        const { reason } = req.body;

        if (!userId) {
            return res.status(401).json({ success: false, message: 'Unauthorized' });
        }

        if (!reason || reason.trim() === '') {
            return res.status(400).json({ success: false, message: 'Return reason is required' });
        }

        const order = await Order.findById(id);

        if (!order) {
            return res.status(404).json({ success: false, message: 'Order not found' });
        }

        if (String(order.user) !== String(userId)) {
            return res.status(403).json({ success: false, message: 'Unauthorized access' });
        }

        if (order.status !== 'Delivered') {
            return res.status(400).json({ success: false, message: 'Only delivered orders can be returned' });
        }

        const returnDeadline = order.returnDeadlineDate || new Date(order.deliveredAt?.getTime() + 7 * 24 * 60 * 60 * 1000);
        if (new Date() > returnDeadline) {
            return res.status(400).json({ success: false, message: 'Return window has expired (7 days from delivery)' });
        }

        order.returnRequest = {
            status: 'Requested',
            reason: reason,
            requestDate: new Date()
        };
        await order.save();

        return res.status(200).json({ success: true, message: 'Return request submitted', order });
    } catch (error) {
        console.error('Request return error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

export const requestReplace = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user?._id;
        const { reason } = req.body;

        if (!userId) {
            return res.status(401).json({ success: false, message: 'Unauthorized' });
        }

        if (!reason || reason.trim() === '') {
            return res.status(400).json({ success: false, message: 'Replacement reason is required' });
        }

        const order = await Order.findById(id);

        if (!order) {
            return res.status(404).json({ success: false, message: 'Order not found' });
        }

        if (String(order.user) !== String(userId)) {
            return res.status(403).json({ success: false, message: 'Unauthorized access' });
        }

        if (order.status !== 'Delivered') {
            return res.status(400).json({ success: false, message: 'Only delivered orders can be replaced' });
        }

        const replaceDeadline = order.returnDeadlineDate || new Date(order.deliveredAt?.getTime() + 7 * 24 * 60 * 60 * 1000);
        if (new Date() > replaceDeadline) {
            return res.status(400).json({ success: false, message: 'Replacement window has expired (7 days from delivery)' });
        }

        order.replaceRequest = {
            status: 'Requested',
            reason: reason,
            requestDate: new Date()
        };
        await order.save();

        return res.status(200).json({ success: true, message: 'Replacement request submitted', order });
    } catch (error) {
        console.error('Request replace error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

export const approveReturn = async (req, res) => {
    try {
        const { id } = req.params;
        const { adminNotes } = req.body;

        const order = await Order.findById(id);

        if (!order) {
            return res.status(404).json({ success: false, message: 'Order not found' });
        }

        if (!order.returnRequest || order.returnRequest.status !== 'Requested') {
            return res.status(400).json({ success: false, message: 'No pending return request' });
        }

        const previousStatus = order.status;

        order.returnRequest = {
            ...order.returnRequest,
            status: 'Approved',
            approvalDate: new Date(),
            adminNotes: adminNotes || ''
        };

        const isCodOrder = String(order.paymentMethod || '').toLowerCase() !== 'razorpay';
        if (isCodOrder && String(order.paymentStatus || '') === 'Paid') {
            order.codRefund = {
                ...(order.codRefund || {}),
                status: 'Requested',
                amount: Number(order.totalAmount || 0),
                reason: order.returnRequest?.reason || 'Approved return for COD order',
                requestedAt: new Date(),
                adminNotes: adminNotes || '',
                failureReason: '',
            };
            order.paymentStatus = 'Refund Pending';
        }

        order.status = 'Processing';
        await order.save();

        try {
            await sendRequestDecisionEmail({
                order,
                requestType: 'Return',
                decision: 'Approved',
                adminNotes: adminNotes || '',
                previousStatus,
            });
        } catch (emailError) {
            console.error('Failed to send return approval email:', emailError);
        }

        return res.status(200).json({ success: true, message: 'Return request approved and order moved to Processing', order });
    } catch (error) {
        console.error('Approve return error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

export const rejectReturn = async (req, res) => {
    try {
        const { id } = req.params;
        const { adminNotes } = req.body;

        const order = await Order.findById(id);

        if (!order) {
            return res.status(404).json({ success: false, message: 'Order not found' });
        }

        if (!order.returnRequest || order.returnRequest.status !== 'Requested') {
            return res.status(400).json({ success: false, message: 'No pending return request' });
        }

        const previousStatus = order.status;

        order.returnRequest = {
            ...order.returnRequest,
            status: 'Rejected',
            approvalDate: new Date(),
            adminNotes: adminNotes || ''
        };
        await order.save();

        try {
            await sendRequestDecisionEmail({
                order,
                requestType: 'Return',
                decision: 'Rejected',
                adminNotes: adminNotes || '',
                previousStatus,
            });
        } catch (emailError) {
            console.error('Failed to send return rejection email:', emailError);
        }

        return res.status(200).json({ success: true, message: 'Return request rejected', order });
    } catch (error) {
        console.error('Reject return error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

export const approveReplace = async (req, res) => {
    try {
        const { id } = req.params;
        const { adminNotes } = req.body;

        const order = await Order.findById(id);

        if (!order) {
            return res.status(404).json({ success: false, message: 'Order not found' });
        }

        if (!order.replaceRequest || order.replaceRequest.status !== 'Requested') {
            return res.status(400).json({ success: false, message: 'No pending replacement request' });
        }

        const previousStatus = order.status;

        order.replaceRequest = {
            ...order.replaceRequest,
            status: 'Approved',
            approvalDate: new Date(),
            adminNotes: adminNotes || ''
        };
        order.status = 'Processing';
        await order.save();

        try {
            await sendRequestDecisionEmail({
                order,
                requestType: 'Exchange',
                decision: 'Approved',
                adminNotes: adminNotes || '',
                previousStatus,
            });
        } catch (emailError) {
            console.error('Failed to send exchange approval email:', emailError);
        }

        return res.status(200).json({ success: true, message: 'Replacement request approved and order moved to Processing', order });
    } catch (error) {
        console.error('Approve replace error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

export const rejectReplace = async (req, res) => {
    try {
        const { id } = req.params;
        const { adminNotes } = req.body;

        const order = await Order.findById(id);

        if (!order) {
            return res.status(404).json({ success: false, message: 'Order not found' });
        }

        if (!order.replaceRequest || order.replaceRequest.status !== 'Requested') {
            return res.status(400).json({ success: false, message: 'No pending replacement request' });
        }

        const previousStatus = order.status;

        order.replaceRequest = {
            ...order.replaceRequest,
            status: 'Rejected',
            approvalDate: new Date(),
            adminNotes: adminNotes || ''
        };
        await order.save();

        try {
            await sendRequestDecisionEmail({
                order,
                requestType: 'Exchange',
                decision: 'Rejected',
                adminNotes: adminNotes || '',
                previousStatus,
            });
        } catch (emailError) {
            console.error('Failed to send exchange rejection email:', emailError);
        }

        return res.status(200).json({ success: true, message: 'Replacement request rejected', order });
    } catch (error) {
        console.error('Reject replace error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};