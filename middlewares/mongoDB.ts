import mongoose from "mongoose";
import { environment } from "../env/environment";

const connectMongoDB = async () => {
  try {
    const conn = await mongoose.connect(environment.MONGODB_URL || "");
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error: any) {
    console.error(`Error: ${error.message}`);
    process.exit(1);
  }
};

export default connectMongoDB;