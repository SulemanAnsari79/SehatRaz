import express from 'express';
import auth from '../middlewares/auth.js';
import adminAuth from '../middlewares/adminAuth.js';

import {register,login,logout, getUserProfile, updateUserProfile, getAllUsers, deleteUser, updateUser, createUser} from '../controllers/userController.js';


const userRouter= express.Router(); 

userRouter.post('/register',register);
userRouter.post('/login',login)
userRouter.post('/logout',auth, logout);
userRouter.get('/profile',auth, getUserProfile);
userRouter.put('/update-profile',auth, updateUserProfile);

userRouter.get('/users',adminAuth, getAllUsers);
userRouter.delete('/delete-user/:id',adminAuth, deleteUser);
userRouter.put('/update-user/:id',adminAuth, updateUser);
userRouter.post('/create-user',adminAuth, createUser);
// userRouter.put('/change-password',auth, changePassword);
// userRouter.post('/forgot-password',auth, forgotPassword);
// userRouter.post('/reset-password/:token',auth, resetPassword);

export default userRouter;