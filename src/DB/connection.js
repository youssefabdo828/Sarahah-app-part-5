import mongoose from "mongoose";
import { dbConfig } from "../Config/db.config.js";




const connectDB = async () => {
  try {
    await mongoose.connect(dbConfig);
    console.log("Connected to MongoDB");
  } catch (error) {
    console.error("Error connecting to MongoDB:", error);
  }
};

export default  connectDB ;