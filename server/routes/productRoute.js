import express from "express";
import { adminAuth } from "../middlewares/adminAuth.js";
import {addProduct} from '../controllers/productController.js';
import { upload } from "../middlewares/uploadImg.js";

const productRouter = express.Router();

// productRouter.post('/add',adminAuth,upload.fields([{name:'image1',maxCount:1},{name:'image2',maxCount:1},{name:'image3',maxCount:1},{name:'image4',maxCount:1}]) ,addProduct);
// productRouter.get('/get', getProducts);
// productRouter.get('/get/:id', getProductById);
// productRouter.put('/update/:id', updateProduct);
// productRouter.delete('/delete/:id', deleteProduct);

export default productRouter;