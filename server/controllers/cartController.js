import User from '../models/userModel.js';
import Product from '../models/productModel.js';

export const addToCart = async (req, res) => {
    try {
        const userId = req.user?.id;
        const { productId, quantity } = req.body;

        if (!userId) {
            return res.status(401).json({ success: false, message: 'Unauthorized' });
        }

        if (!productId || !quantity || quantity <= 0) {
            return res.status(400).json({ success: false, message: 'Valid product ID and quantity required' });
        }

        // Verify product exists
        const product = await Product.findById(productId);
        if (!product) {
            return res.status(404).json({ success: false, message: 'Product not found' });
        }

        // Check stock
        if (product.stock < quantity) {
            return res.status(400).json({ success: false, message: 'Insufficient stock' });
        }

        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        // Initialize cart if not exists
        if (!user.cart) {
            user.cart = [];
        }

        // Check if product already in cart
        const cartItem = user.cart.find(item => item.productId?.toString() === productId);

        if (cartItem) {
            cartItem.quantity += quantity;
        } else {
            user.cart.push({ productId, quantity });
        }

        await user.save();

        res.status(200).json({ success: true, message: 'Item added to cart', cart: user.cart });
    } catch (error) {
        console.error('Add to cart error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

export const getCart = async (req, res) => {
    try {
        const userId = req.user?.id;

        if (!userId) {
            return res.status(401).json({ success: false, message: 'Unauthorized' });
        }

        const user = await User.findById(userId).populate('cart.productId');

        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        res.status(200).json({ success: true, cart: user.cart || [] });
    } catch (error) {
        console.error('Get cart error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

export const updateCartItem = async (req, res) => {
    try {
        const userId = req.user?.id;
        const { productId, quantity } = req.body;

        if (!userId) {
            return res.status(401).json({ success: false, message: 'Unauthorized' });
        }

        if (!productId || quantity === undefined) {
            return res.status(400).json({ success: false, message: 'Product ID and quantity required' });
        }

        if (quantity <= 0) {
            return res.status(400).json({ success: false, message: 'Quantity must be greater than 0' });
        }

        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        const cartItem = user.cart.find(item => item.productId?.toString() === productId);

        if (!cartItem) {
            return res.status(404).json({ success: false, message: 'Item not in cart' });
        }

        // Verify stock
        const product = await Product.findById(productId);
        if (product && product.stock < quantity) {
            return res.status(400).json({ success: false, message: 'Insufficient stock' });
        }

        cartItem.quantity = quantity;
        await user.save();

        res.status(200).json({ success: true, message: 'Cart updated', cart: user.cart });
    } catch (error) {
        console.error('Update cart error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

export const removeFromCart = async (req, res) => {
    try {
        const userId = req.user?.id;
        const { productId } = req.body;

        if (!userId) {
            return res.status(401).json({ success: false, message: 'Unauthorized' });
        }

        if (!productId) {
            return res.status(400).json({ success: false, message: 'Product ID required' });
        }

        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        user.cart = user.cart.filter(item => item.productId?.toString() !== productId);
        await user.save();

        res.status(200).json({ success: true, message: 'Item removed from cart', cart: user.cart });
    } catch (error) {
        console.error('Remove from cart error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

export const clearCart = async (req, res) => {
    try {
        const userId = req.user?.id;

        if (!userId) {
            return res.status(401).json({ success: false, message: 'Unauthorized' });
        }

        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        user.cart = [];
        await user.save();

        res.status(200).json({ success: true, message: 'Cart cleared', cart: [] });
    } catch (error) {
        console.error('Clear cart error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};