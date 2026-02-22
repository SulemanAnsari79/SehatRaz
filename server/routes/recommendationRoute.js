import express from 'express';
import auth from '../middlewares/auth.js';
import doctorAuth from '../middlewares/doctorAuth.js';
import { getProductRecommendations, getDoctorRecommendations, getRecommendationsByCategory } from '../controllers/recommendationController.js';

const recommendationRouter = express.Router();

recommendationRouter.get('/products', auth, getProductRecommendations);
recommendationRouter.get('/doctors', auth, getDoctorRecommendations);
recommendationRouter.get('/category', doctorAuth, getRecommendationsByCategory);

export default recommendationRouter;