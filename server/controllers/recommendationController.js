import Product from '../models/productModel.js';
import Doctor from '../models/doctorModel.js';
import Order from '../models/orderModel.js';

export const getProductRecommendations = async (req, res) => {
    try {
        const userId = req.user?.id;

        if (!userId) {
            return res.status(401).json({ success: false, message: 'Unauthorized' });
        }

        // Get user's previous orders to determine categories
        const userOrders = await Order.find({ user: userId });
        const purchasedCategories = new Set();

        userOrders.forEach(order => {
            order.items?.forEach(item => {
                if (item.category) purchasedCategories.add(item.category);
            });
        });

        let query = {};
        if (purchasedCategories.size > 0) {
            query.category = { $in: Array.from(purchasedCategories) };
        }

        // Get recommended products
        const recommendations = await Product.find(query)
            .limit(10)
            .sort({ createdAt: -1 });

        res.status(200).json({ success: true, recommendations });
    } catch (error) {
        console.error('Get recommendations error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

export const getDoctorRecommendations = async (req, res) => {
    try {
        const { specialization } = req.query;

        let query = { verified: true };

        if (specialization) {
            query.specialization = specialization;
        }

        const recommendations = await Doctor.find(query)
            .select('-password')
            .limit(10)
            .sort({ experience: -1 });

        res.status(200).json({ success: true, recommendations });
    } catch (error) {
        console.error('Get doctor recommendations error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

export const getRecommendationsByCategory = async (req, res) => {
    try {
        const { category } = req.query;

        if (!category) {
            return res.status(400).json({ success: false, message: 'Category is required' });
        }

        const products = await Product.find({ category })
            .limit(15)
            .sort({ createdAt: -1 });

        res.status(200).json({ success: true, products });
    } catch (error) {
        console.error('Get category recommendations error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};