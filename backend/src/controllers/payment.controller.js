import crypto from "crypto";
import Razorpay from "razorpay";
import { AppError, asyncHandler } from "../middleware/error.middleware.js";
import Order from "../models/order.model.js";

const getRazorpay = () => {
  const keyId = process.env.RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;
  if (!keyId || !keySecret) throw new AppError(503, "Payment service is not configured");
  return new Razorpay({ key_id: keyId, key_secret: keySecret });
};

export const createOrder = asyncHandler(async (req, res) => {
  const amount = Number(req.body.amount);
  const currency = req.body.currency?.toUpperCase();
  const { receipt, notes } = req.body;

  if (!Number.isFinite(amount) || amount <= 0 || !currency || !receipt) {
    throw new AppError(400, "A positive amount, currency, and receipt are required");
  }

  const order = await getRazorpay().orders.create({
    amount: Math.round(amount * 100),
    currency,
    receipt,
    notes,
  });

  await Order.create({
    order_id: order.id,
    userID: req.user._id,
    amount: order.amount,
    currency: order.currency,
    receipt: order.receipt,
    status: "created",
  });

  res.status(201).json(order);
});

export const verifyPayment = asyncHandler(async (req, res) => {
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;
  if (![razorpay_order_id, razorpay_payment_id, razorpay_signature].every(Boolean)) {
    throw new AppError(400, "Payment verification data is incomplete");
  }

  const secret = process.env.RAZORPAY_KEY_SECRET;
  if (!secret) throw new AppError(503, "Payment service is not configured");

  const expected = crypto
    .createHmac("sha256", secret)
    .update(`${razorpay_order_id}|${razorpay_payment_id}`)
    .digest();
  const received = Buffer.from(razorpay_signature, "hex");

  if (received.length !== expected.length || !crypto.timingSafeEqual(received, expected)) {
    throw new AppError(400, "Payment verification failed");
  }

  const order = await Order.findOneAndUpdate(
    { order_id: razorpay_order_id, userID: req.user._id },
    { status: "paid", payment_id: razorpay_payment_id },
    { new: true },
  );
  if (!order) throw new AppError(404, "Payment order not found");

  res.status(200).json({ status: "ok", success: true });
});
