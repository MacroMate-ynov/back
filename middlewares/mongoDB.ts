import mongoose from "mongoose";
import { environment } from "../env/environment";

const connectMongoDB = async () => {
  try {
    const conn = await mongoose.connect(environment.MONGODB_URL + '?authSource=admin');
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error: any) {
    console.error(`Error: ${error.message}`);
    console.error(`And: ${environment.MONGODB_URL}`);
    return 0;
  }
};

export default connectMongoDB;
