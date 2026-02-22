import express from 'express';
import auth from '../middlewares/auth.js';
import { cancelAppointment, createAppointment, getAppointmentById, getMyAppointments, updateAppointmentStatus, getAllAppointments, getDoctorAppointments } from '../controllers/appointmentController.js';
import doctorAuth from '../middlewares/doctorAuth.js';
import adminAuth from '../middlewares/adminAuth.js';

const appointmentRouter = express.Router();

appointmentRouter.post('/book', auth, createAppointment);
appointmentRouter.get('/myappointments', auth, getMyAppointments);
appointmentRouter.get('/userAppointment/:id',auth,getAppointmentById);
appointmentRouter.delete('/cancel/:id', auth, cancelAppointment);
appointmentRouter.post('/updateAppointmentStatus/:id', doctorAuth, updateAppointmentStatus);
appointmentRouter.get('/doctor-appointments', doctorAuth, getDoctorAppointments);
appointmentRouter.get('/all', adminAuth, getAllAppointments);


export default appointmentRouter;