import mongoose from 'mongoose';

const connectDB = async () => {
    const mongoUri = process.env.MONGODB_URI;

    if (!mongoUri) {
        throw new Error('MONGODB_URI is missing in environment variables');
    }

    mongoose.set('bufferCommands', false);

    mongoose.connection.on('connected', () => {
        console.log('MongoDB connected successfully');
    });

    mongoose.connection.on('error', (err) => {
        console.error(`MongoDB connection error: ${err.message}`);
    });

    await mongoose.connect(mongoUri, {
        serverSelectionTimeoutMS: 15000,
    });
};

export default connectDB;