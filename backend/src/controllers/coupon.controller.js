import Coupon from "../models/coupon.model.js";

export const getCoupon = async (req, res) => {
    try {
        const coupon = await Coupon.findOne({ userId: req.user._id, isActive: true});

        return res.status(200).json(coupon || null);
    } catch (error) {
        console.error("Error in getCoupon controller", error);
        return res.status(500).json({message: "server error", error: error.message});
    }
}

export const validateCoupon = async(req, res)=>{
    try {
        const {code} = req.body;
        const coupon = await Coupon.findOne({code, userId: req.user._id, isActive: true});
        if(!coupon){
            return res.status(404).json({message: "Coupon not found"});
        }
        if(coupon.expirationDate < new Date()){
            coupon.isActive = false;
            await coupon.save();
            return res.status(404).json({message: "coupon is expired",
                

            })
        }

        return res.status(200).json({
            message: "coupon is valid",
            code: coupon.code,
            discountPercentage: coupon.discountPercentage,

        });

    } catch (error) {
        console.error("Error in validateCoupon controller", error);
        return res.status(500).json({message: "server error", error: error.message});
    }
}