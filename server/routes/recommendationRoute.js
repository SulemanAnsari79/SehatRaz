import express from 'express';
import auth from '../middlewares/auth.js';
import doctorAuth from '../middlewares/doctorAuth.js';
import uploadImg from '../middlewares/uploadImg.js';
import { getProductRecommendations, getDoctorRecommendations, getRecommendationsByCategory, getAIRecommendations } from '../controllers/recommendationController.js';

const recommendationRouter = express.Router();

recommendationRouter.get('/products', auth, getProductRecommendations);
recommendationRouter.get('/doctors', auth, getDoctorRecommendations);
recommendationRouter.get('/category', doctorAuth, getRecommendationsByCategory);
recommendationRouter.post('/ai-recommend', auth, uploadImg.single('image'), getAIRecommendations);

export default recommendationRouter;