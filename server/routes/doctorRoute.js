import  express from 'express';
import doctorAuth from '../middlewares/doctorAuth.js';
import {doctorRegister,doctorLogin,doctorLogout, getDoctorProfile, updateDoctorProfile } from '../controllers/doctorController.js';


const doctorRouter= express.Router();

doctorRouter.post('/register',doctorRegister);
doctorRouter.post('/login',doctorLogin);
doctorRouter.post('/logout',doctorAuth, doctorLogout);
doctorRouter.get('/profile',doctorAuth, getDoctorProfile);
doctorRouter.post('/updateprofile',doctorAuth, updateDoctorProfile);

export default doctorRouter;