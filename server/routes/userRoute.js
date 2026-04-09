import express from 'express';
import auth from '../middlewares/auth.js';
import adminAuth from '../middlewares/adminAuth.js';
import upload from '../middlewares/uploadImg.js';

import {register,login,logout, getUserProfile, updateUserProfile, getAllUsers, deleteUser, updateUser, createUser, uploadProfileImage, changePassword, deleteAccount, sendForgotPasswordOtp, verifyForgotPasswordOtp, resetPasswordWithOtp, submitContactMessage} from '../controllers/userController.js';


const userRouter= express.Router(); 

userRouter.post('/register',register);
userRouter.post('/login',login)
userRouter.post('/forgot-password/send-otp', sendForgotPasswordOtp);
userRouter.post('/forgot-password/verify-otp', verifyForgotPasswordOtp);
userRouter.post('/forgot-password/reset-password', resetPasswordWithOtp);
userRouter.post('/contact-us', submitContactMessage);
userRouter.post('/logout',auth, logout);
userRouter.get('/profile',auth, getUserProfile);
userRouter.put('/update-profile',auth, updateUserProfile);
userRouter.post('/upload-profile-image', auth, upload.single('image'), uploadProfileImage);
userRouter.put('/change-password',auth, changePassword);
userRouter.delete('/delete-account', auth, deleteAccount);

userRouter.get('/users',adminAuth, getAllUsers);
userRouter.delete('/delete-user/:id',adminAuth, deleteUser);
userRouter.put('/update-user/:id',adminAuth, updateUser);
userRouter.post('/create-user',adminAuth, createUser);
// userRouter.post('/forgot-password',auth, forgotPassword);
// userRouter.post('/reset-password/:token',auth, resetPassword);

export default userRouter;