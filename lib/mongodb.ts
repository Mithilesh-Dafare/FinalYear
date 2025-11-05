import mongoose from "mongoose";

const MONGO_URI = process.env.MONGODB_URI;

if (!MONGO_URI) {
  throw new Error("Missing MONGODB_URI environment variable");
}

export const connectDB = async () => {
  try {
    if (mongoose.connection.readyState >= 1) {
      console.log("MongoDB connection already established");
      return;
    }

    await mongoose.connect(MONGO_URI, {
      dbName: "interview-ai",
    });

    console.log("mongodb connected successfully");
  } catch (error) {
    console.error("mongodb connection error:", error);
    // Re-throw the error so callers can handle it; do not exit the process
    throw error;
  }
};
