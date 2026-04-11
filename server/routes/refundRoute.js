import express from 'express';
import adminAuth from '../middlewares/adminAuth.js';
import {
  decideAppointmentRefund,
  decideCodRefund,
  listAppointmentRefunds,
  listCodRefundOrders,
  requestCodRefund,
} from '../controllers/refundController.js';

const refundRouter = express.Router();

refundRouter.get('/admin/appointments', adminAuth, listAppointmentRefunds);
refundRouter.put('/admin/appointments/:id/decision', adminAuth, decideAppointmentRefund);

refundRouter.get('/admin/cod-orders', adminAuth, listCodRefundOrders);
refundRouter.post('/admin/cod-orders/:id/request', adminAuth, requestCodRefund);
refundRouter.put('/admin/cod-orders/:id/decision', adminAuth, decideCodRefund);

export default refundRouter;
