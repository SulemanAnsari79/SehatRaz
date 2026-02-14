import express from "express";
import  upload  from "../middlewares/uploadImg.js";
import { createProduct, getAllProducts, getProductById, updateProduct, deleteProduct } from "../controllers/productController.js";
import { adminAuth } from "../middlewares/adminAuth.js";

const productRouter = express.Router();

productRouter.post('/create-product',adminAuth,upload.fields([{name:'image1',maxCount:1},{name:'image2',maxCount:1},{name:'image3',maxCount:1},{name:'image4',maxCount:1}]) ,createProduct);
productRouter.put('/update-product/:id',adminAuth, updateProduct);
productRouter.delete('/delete-product/:id',adminAuth, deleteProduct);

productRouter.get('/list', getAllProducts);
productRouter.get('/get/:id', getProductById);

export default productRouter; 