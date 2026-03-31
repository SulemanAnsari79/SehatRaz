import  express from 'express';
import doctorAuth from '../middlewares/doctorAuth.js';
import {doctorRegister,doctorLogin,doctorLogout, getDoctorProfile, updateDoctorProfile, getVerifiedDoctors, createLeaveRequest, getMyLeaveRequests } from '../controllers/doctorController.js';


const doctorRouter= express.Router();

doctorRouter.post('/register',doctorRegister);
doctorRouter.post('/login',doctorLogin);
doctorRouter.post('/logout',doctorAuth, doctorLogout);
doctorRouter.get('/profile',doctorAuth, getDoctorProfile);
doctorRouter.post('/updateprofile',doctorAuth, updateDoctorProfile);
doctorRouter.post('/leave-request', doctorAuth, createLeaveRequest);
doctorRouter.get('/leave-requests', doctorAuth, getMyLeaveRequests);
doctorRouter.get('/list', getVerifiedDoctors);

export default doctorRouter;