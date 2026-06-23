import mongoose from "mongoose";

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI);
    console.log(`MongoDB connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`MongoDB connection error: ${error.message}`);
    console.error("⚠️  Server will continue running but database features will not work.");
    console.error("⚠️  Check your MONGO_URI in the .env file.");
  }
};

export default connectDB;
