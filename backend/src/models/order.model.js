import mongoose from "mongoose";

const orderSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
    },
    products: [
        {
            product: {
                type: mongoose.Schema.Types.ObjectId,
                ref: "Product",
                required: true,
            },
            quantity: {
                type: Number,
                min: 1,
                required: true
            },
            price: {
                type: Number,
                required: true,
                min: 0,
            }

        }
    ],
    totalAmount: {
        type: Number,
        required: true,
        min: 0,
    },
    stripeSessionId: {
        type: String,
        unique: true,
    }
}, {timestamps:true});

const Order = mongoose.model("Order", orderSchema);
export default Order;