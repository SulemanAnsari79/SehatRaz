import QuestionForm from '../models/questionFormModel.js';
import User from '../models/userModel.js';

export const submitQuestions = async (req, res) => {
    try {
        const userId = req.user?.id;
        const { questions } = req.body;

        if (!userId) {
            return res.status(401).json({ success: false, message: 'Unauthorized' });
        }

        if (!questions || typeof questions !== 'object' || Object.keys(questions).length === 0) {
            return res.status(400).json({ success: false, message: 'Questions are required' });
        }

        // Verify user exists
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        // Create question form
        const questionForm = new QuestionForm({
            user: userId,
            questions,
            submittedAt: new Date()
        });

        await questionForm.save();

        res.status(201).json({ success: true, message: 'Questions submitted successfully', questionForm });
    } catch (error) {
        console.error('Submit questions error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

export const getMyQuestions = async (req, res) => {
    try {
        const userId = req.user?.id;

        if (!userId) {
            return res.status(401).json({ success: false, message: 'Unauthorized' });
        }

        const questions = await QuestionForm.find({ user: userId })
            .populate('user', '-password')
            .sort({ createdAt: -1 });

        res.status(200).json({ success: true, questions });
    } catch (error) {
        console.error('Get questions error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

export const getQuestionById = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user?.id;

        if (!userId) {
            return res.status(401).json({ success: false, message: 'Unauthorized' });
        }

        const question = await QuestionForm.findById(id).populate('user', '-password');

        if (!question) {
            return res.status(404).json({ success: false, message: 'Question form not found' });
        }

        // Verify ownership
        if (question.user._id.toString() !== userId) {
            return res.status(403).json({ success: false, message: 'Unauthorized access' });
        }

        res.status(200).json({ success: true, question });
    } catch (error) {
        console.error('Get question error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};