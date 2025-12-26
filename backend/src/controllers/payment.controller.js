import { stripe } from "../lib/stripe.js";
import Coupon from "../models/coupon.model.js";
import Order from "../models/order.model.js";

export const createCheckoutSession = async(req, res) => {
    try {
        const {products, couponCode} = req.body;
        if(!Array.isArray(products)|| products.length === 0) {
            return res.status(400).json({message: "Invalid or empty products array"});
        }

        let totalAmount = 0;
        let lineItems = products.map((product) => {
            let amount = Math.round(product.price * 100)//stripe requires amount in cents and 1$ -> 100cents
            totalAmount += amount*product.quantity

            return {
                price_data: {
                    currency: "usd",
                    product_data: {
                        name: product.name,
                        images: [product.image]
                    },
                    unit_amount: amount
                },
                quantity:product.quantity
            }
        });

        let coupon = null;
        if(couponCode){
            coupon = await Coupon.findOne({code: couponCode, userId: req.user._id, isActive: true, usedAt: null});

        }

        const session = await stripe.checkout.sessions.create({
            payment_method_types: ["card",],
            line_items: lineItems,
            success_url: `${process.env.CLIENT_URL}/purchase-success?session_id={CHECKOUT_SESSION_ID}`,
            cancel_url: `${process.env.CLIENT_URL}/purchase-cancel`,
            discounts: coupon
              ? [
                    {
                        coupon: coupon.stripeCouponId
                    },
                ]
              : [],
            metadata: {
                userId: req.user.id.toString(),
                couponCode: couponCode || "",
                products: JSON.stringify(products.map(p=>({
                    id: p._id,
                    quantity: p.quantity,
                    price: p.price,
                })))
            }

        });

        //create a coupon for the user for next purchase if total amount in cents exceeds 20000 i.e, $200
        if(totalAmount >= 20000){
            await createNewcoupon(req.user._id);
        }


     const fullSession = await stripe.checkout.sessions.retrieve(session.id);

        return res.status(200).json({
            id: session.id,
            totalAmount: fullSession.amount_total / 100,
        });

        

    } catch (error) {
        console.error("Error in createCheckoutSession controller", error);
        return res.status(500).json({message:"server error", error: "Internal server error"});
    }
}

async function createStripeCoupon(discountPercentage){
    
    const coupon = await stripe.coupons.create({
        percent_off: discountPercentage,
        duration: "once",

    });

    return coupon.id;
}

async function createNewcoupon(userId){
    const stripeCouponId = await createStripeCoupon(10);
    const newCoupon = new Coupon({
        //toString(36)->creates a base 36 string consisting of a-z and 0-9
        code: "GIFT" + Math.random().toString(36).substring(2, 8).toUpperCase(),
        discountPercentage: 10,
        expirationDate:  new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),//30 days from now
        userId: userId,
        stripeCouponId: stripeCouponId 
    });

    await newCoupon.save();
    return newCoupon;
}




export const checkoutSucess = async(req, res) => {
    try {
        const {sessionId }=req.body;
        if(!sessionId){
            return res.status(400).json({ message: "Missing Stripe session ID in request body" });
        }

        const session = await stripe.checkout.sessions.retrieve(sessionId);
        //check if payment was completed
        if(session.payment_status === "paid"){
            //update coupon
            if(session.metadata.coupon){
                await Coupon.findOneAndUpdate(
                    {
                        code: session.metadata.couponCode,
                        userId: mongoose.Types.ObjectId(session.metadata.userId)
                    },
                    {
                        isActive: false,
                        usedAt:  new Date(session.created * 1000) // Stripe session creation time
                    }
                )
            }

            //create a new order
            const products = JSON.parse(session.metadata.products);
            const newOrder = new Order({
                userId: session.metadata.userId,
                products: products.map(p => ({
                    product: p.id,
                    quantity: p.quantity,
                    price: p.price
                })),
                totalAmount: session.amount_total/100,
                stripeSessionId: sessionId
            });

           await newOrder.save();
           return res.status(200).json({sucess: true, message: "Payment successfull, order placed", orderId: newOrder._id});
        }

        return res.status(400).json({message: "Payment uncessfull"});
    } catch (error) {
        console.error("Error in checkoutSuccess controller",error);
        return res.status(500).json({message: "Error processing sucessfull checkout"});
    }
}