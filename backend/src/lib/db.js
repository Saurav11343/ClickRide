import mongoose from "mongoose";
import { env } from "../config/env.js";

export const connectDB = async () => {
    return mongoose.connect(env.mongoUri, {
        serverSelectionTimeoutMS: 15000,
    });
};

export const disconnectDB = () => mongoose.disconnect();
