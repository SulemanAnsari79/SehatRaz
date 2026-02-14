import express from "express";
import auth from "../middlewares/auth.js";
import { addToCart, getCart, removeFromCart, updateCartItem, clearCart } from "../controllers/cartController.js";

const cartRouter = express.Router();

cartRouter.post('/getUserCart', auth, getCart);
cartRouter.post('/add',auth, addToCart);
cartRouter.get('/update', auth, updateCartItem);
cartRouter.post('/remove', auth, removeFromCart);
cartRouter.post('/clear', auth,clearCart);

// cartRouter.get('/items', auth, getCart);

export default cartRouter