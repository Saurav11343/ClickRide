import express from "express";
import authRoutes from "./routes/auth.routes.js";
import vehicleRoutes from "./routes/vehicle.routes.js";
import partnerRoutes from "./routes/partner.routes.js";
import analyticsRoutes from "./routes/analytics.routes.js";
import reviewRoutes from "./routes/review.routes.js";
import bookRoutes from "./routes/book.routes.js";
import requestRoutes from "./routes/request.routes.js";
import paymentRoutes from "./routes/payment.routes.js";
import cookieParser from "cookie-parser";
import cors from "cors";
import { connectDB } from "./lib/db.js";
import dotenv from "dotenv";
import path from "path";
import "./lib/updateVehicleStatus.Cron.js";

dotenv.config();

const app = express();

const PORT = process.env.PORT;
const __dirname = path.resolve();
// Middleware to parse JSON bodies
app.use(express.json({ limit: "50mb" }));
app.use(cookieParser());
app.use(
  cors({
    origin: process.env.CLIENT_URL,
    credentials: true,
  }),
);
// Use the authentication routes
app.use("/api/auth", authRoutes);
app.use("/api/vehicle", vehicleRoutes);
app.use("/api/partner", partnerRoutes);
app.use("/api/analytics", analyticsRoutes);
app.use("/api/review", reviewRoutes);
app.use("/api/book", bookRoutes);
app.use("/api/request", requestRoutes);
app.use("/api/payment", paymentRoutes);

// Start the server

if (process.env.NODE_ENV === "production") {
  app.use(express.static(path.join(__dirname, "../frontend/dist")));

  app.get("*", (req, res) => {
    res.sendFile(path.join(__dirname, "../frontend", "dist", "index.html"));
  });
}

app.listen(PORT, () => {
  console.log("Server is running on port: " + PORT);
  connectDB(); // Ensure the database is connected
});
