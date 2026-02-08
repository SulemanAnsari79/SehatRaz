import mongoose from 'mongoose';
// import connect

const connectDB = async () => {
    try {
        await mongoose.connection.on('connected', () => {
            console.log('MongoDB connected successfully');
        });

        await mongoose.connect(process.env.MONGODB_URI);
    } catch (error) {
        console.error(`Error: ${error.message}`);
    }
};

export default connectDB;