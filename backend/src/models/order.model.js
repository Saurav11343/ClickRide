import mongoose from 'mongoose';

const orderSchema = new mongoose.Schema(
    {
        order_id: { type: String, required: true, unique: true },
        userID: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
        amount: { type: Number, required: true },
        currency: { type: String, required: true },
        receipt: { type: String, required: true },
        status: { type: String, enum: ["created", "paid"], required: true },
        payment_id: { type: String },
    },
    { timestamps: true }
);
const Order = mongoose.model("Orders", orderSchema);


export default Order;
