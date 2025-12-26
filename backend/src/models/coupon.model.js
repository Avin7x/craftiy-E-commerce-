import mongoose from "mongoose";

const couponSchema = new mongoose.Schema({
    code: {
        type: String,
        unique: true,
        required: true,
    },
    discountPercentage: {
        type: Number,
        required: true,
        min: 0,
        max: 100
    },
    expirationDate: {
        type: Date,
        required: true

    },
    isActive: {
        type: Boolean,
        default: true
    },
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
        
    },
    usedAt: {
        type: Date,
        default: null
    },
    stripeCouponId: {
        type: String,
        required: true
    }
}, {timestamps:true});

const Coupon = mongoose.model("Coupon", couponSchema);
export default Coupon;