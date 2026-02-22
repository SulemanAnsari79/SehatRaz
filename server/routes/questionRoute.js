import express from 'express';
import auth from '../middlewares/auth.js';
import doctorAuth from '../middlewares/doctorAuth.js';
import { submitQuestions, getMyQuestions, getQuestionById, getAllQuestions } from '../controllers/questionController.js';

const questionRouter = express.Router();

questionRouter.post('/submit', auth, submitQuestions);
questionRouter.get('/my-questions', auth, getMyQuestions);
questionRouter.get('/:id', auth, getQuestionById);
questionRouter.get('/doctor/all', doctorAuth, getAllQuestions);

export default questionRouter;