import express from 'express';
import 'dotenv/config';
import { createServer } from 'http';
import { Server } from 'socket.io';

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
import deliveryRouter from './routes/deliveryRoute.js';
import consultationRouter from './routes/consultationRoute.js';
import { startAppointmentReminderJob } from './utils/appointmentNotifications.js';
import { initConsultationSocket } from './socket/consultationSocket.js';


// dotenv.config();
const app= express();
const httpServer = createServer(app);
const PORT = process.env.PORT || 4001;

const getAllowedOrigins = () => {
    const configuredOrigins = [
        process.env.CORS_ORIGIN,
        process.env.CLIENT_URL,
        process.env.FRONTEND_URL,
    ]
        .filter(Boolean)
        .flatMap((value) => value.split(','))
        .map((value) => value.trim())
        .filter(Boolean);

    if (process.env.NODE_ENV !== 'production') {
        configuredOrigins.push(
            'http://localhost:5173',
            'http://localhost:4173',
            'http://localhost:3000',
            'http://localhost:10000',
            'http://127.0.0.1:5173',
            'http://127.0.0.1:3000'
        );
    }

    return [...new Set(configuredOrigins)];
};

const allowedOrigins = getAllowedOrigins();
const corsOrigin = allowedOrigins.length > 0 ? allowedOrigins : true;

const io = new Server(httpServer, {
    cors: {
        origin: corsOrigin,
        methods: ["GET", "POST"],
    },
});

initConsultationSocket(io);

connectCloudinry();

app.use(express.json());
app.use(cors({ origin: corsOrigin, credentials: true }));//, limiter:true
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
app.use('/api/consultation',consultationRouter);
app.use('/api/recommendation',recommendationRouter);
app.use('/api/delivery',deliveryRouter);


const startServer = async () => {
    try {
        await connectDB();

        httpServer.listen(PORT, () => {
            console.log(`Server is running on http://localhost:${PORT}`);
        });

        startAppointmentReminderJob();
    } catch (error) {
        console.error(`Startup failed: ${error.message}`);
        process.exit(1);
    }
};

startServer();