import mongoose from "mongoose";

const connectDB = async () => {
  try {
    await mongoose.connect("mongodb+srv://ishan22fz:3Seenuupadhyay1@cluster0.s0wt9vh.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0");
    console.log(" MongoDB Connected");
  } catch (error) {
    console.error(" MongoDB Error:", error.message);
    process.exit(1);
  }
};

export default connectDB;
