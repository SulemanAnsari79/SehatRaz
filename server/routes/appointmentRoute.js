import express from 'express';
import auth from '../middlewares/auth.js';
import { cancelAppointment, cancelAppointmentAsAdmin, createAppointment, createAppointmentAsAdmin, createAppointmentPaymentOrder, getAllAppointments, getAppointmentById, getDoctorAppointments, getDoctorAvailability, getMyAppointments, getMyBookedAppointments, updateAppointmentStatus, updateAppointmentStatusAsAdmin, verifyAppointmentPayment } from '../controllers/appointmentController.js';
import doctorAuth from '../middlewares/doctorAuth.js';
import adminAuth from '../middlewares/adminAuth.js';

const appointmentRouter = express.Router();

appointmentRouter.post('/book', auth, createAppointment);
appointmentRouter.post('/create-payment-order', auth, createAppointmentPaymentOrder);
appointmentRouter.post('/verify-payment', auth, verifyAppointmentPayment);
appointmentRouter.get('/availability', auth, getDoctorAvailability);
appointmentRouter.get('/myappointments', auth, getMyAppointments);
appointmentRouter.get('/my-booked', auth, getMyBookedAppointments);
appointmentRouter.get('/userAppointment/:id',auth,getAppointmentById);
appointmentRouter.delete('/cancel/:id', auth, cancelAppointment);
appointmentRouter.post('/updateAppointmentStatus/:id', doctorAuth, updateAppointmentStatus);
appointmentRouter.get('/doctor-appointments', doctorAuth, getDoctorAppointments);
appointmentRouter.get('/all', adminAuth, getAllAppointments);
appointmentRouter.post('/admin/create', adminAuth, createAppointmentAsAdmin);
appointmentRouter.delete('/admin/cancel/:id', adminAuth, cancelAppointmentAsAdmin);
appointmentRouter.put('/:id', adminAuth, updateAppointmentStatusAsAdmin);


export default appointmentRouter;