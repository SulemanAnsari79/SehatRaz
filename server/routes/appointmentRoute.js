import express from 'express';
import auth from '../middleware/auth.js';
import { cancelAppointment, createAppointment, getAppointmentById, getMyAppointments, updateAppointmentStatus } from '../controllers/appointmentController';
import doctorAuth from '../middleware/doctorAuth.js';

const appointmentRouter = express.Router();

appointmentRouter.post('/book', auth, createAppointment);
appointmentRouter.get('/myappointments', auth, getMyAppointments);
appointmentRouter.get('/userAppointment/:id',auth,getAppointmentById);
appointmentRouter.delete('/cancel/:id', auth, cancelAppointment);
appointmentRouter.post('/updateAppointmentStatus', doctorAuth, updateAppointmentStatus);
appointmentRouter.post('/getAllAppointments', adminAuth, getAllAppointments);


export default appointmentRouter;