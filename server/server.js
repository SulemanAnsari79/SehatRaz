import express from 'express';
import 'dotenv/config';

import cors from 'cors';
import connectDB from './config/db.js';
import connectCloudinry from './config/cloudinary.js';

import helmet from "helmet";
// import limiter from './middlewares/rateLimiter.js';
import cookieParser from 'cookie-parser';

import userRouter from './routes/userRoute.js';
import doctorRouter from './routes/doctorRoute.js';
import adminRouter from './routes/adminRoute.js';
import cartRouter from './routes/cartRoute.js';
import productRouter from './routes/productRoute.js';
import orderRouter from './routes/orderRoute.js';
import appointmentRouter from './routes/appointmentRoute.js';
import recommendationRouter from './routes/recommendationRoute.js';


// dotenv.config();
const app= express();
const PORT = process.env.PORT || 4001;


connectDB();
connectCloudinry();

app.use(express.json());
app.use(cors({origin: "http://localhost:5173", credentials: true}));//, limiter:true
// app.use(limiter);
app.use(helmet());
app.use(cookieParser());

// Serve static files from uploads directory (for backward compatibility)
// app.use('/uploads', express.static('uploads'));

app.get('/', (req, res) => {
    res.send('Server is running successfully');
});


app.use('/api/user',userRouter);
app.use('/api/doctor',doctorRouter);
app.use('/api/admin',adminRouter);
app.use('/api/cart',cartRouter);
app.use('/api/product',productRouter);
app.use('/api/order',orderRouter);
app.use('/api/appointment',appointmentRouter);
app.use('/api/recommendation',recommendationRouter);


app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});