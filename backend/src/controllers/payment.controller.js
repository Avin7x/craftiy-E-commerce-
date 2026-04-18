import mongoose from "mongoose";
import { stripe } from "../lib/stripe.js";
import Coupon from "../models/coupon.model.js";
import Order from "../models/order.model.js";

export const createCheckoutSession = async(req, res) => {
    try {
        const {products, couponCode} = req.body;
        if(!Array.isArray(products)|| products.length === 0) {
            return res.status(400).json({message: "Invalid or empty products array"});
        }
        console.log(products);

        let totalAmount = 0;
        let lineItems = products.map((item) => {
            const product = item.product;
            const qty = Number(item.quantity);

            let amount = Math.round(product.price * 100)//stripe requires amount in cents and 1$ -> 100cents
            totalAmount += amount*qty;

            return {
                price_data: {
                    currency: "usd",
                    product_data: {
                        name: product.name,
                        images: product.image? [product.image] : []
                    },
                    unit_amount: amount
                },
                quantity: qty|| 1
            }
        });

        let coupon = null;
        if(couponCode){
            coupon = await Coupon.findOne({code: couponCode, userId: req.user._id, isActive: true, usedAt: null});

        }

        const session = await stripe.checkout.sessions.create({
            mode: "payment",
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
                userId: req.user._id.toString(),
                couponCode: couponCode || "",
                products: JSON.stringify(products.map(item=>{
                    const p = item.product;
                    
                    return {
                        id: p._id,
                        quantity: item.quantity,
                        price: p.price,
                    }
                }))
            }

        });

        console.log(session.total_details);

        //create a coupon for the user for next purchase if total amount in cents exceeds 20000 i.e, $200
        if(totalAmount >= 20000){
            await createNewcoupon(req.user._id);
        }


        //  const fullSession = await stripe.checkout.sessions.retrieve(session.id);

        return res.status(200).json({
            id: session.id,
            url: session.url,
            totalAmount: session.amount_total / 100,
        });

        

    } catch (error) {
        console.error("Error in createCheckoutSession controller", error);
        return res.status(500).json({message:"server error", error: error.message});
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
            return res.status(404).json({ message: "Missing Stripe session ID in request body" });
        }

        const session = await stripe.checkout.sessions.retrieve(sessionId);

        if(session.payment_status !== 'paid'){
            return res.status(400).json({
                message: "payment unsuccessful"
            });
        }

        //prevent duplicate order
        const orderExists = await Order.findOne({stripeSessionId: sessionId});
        if(orderExists) {
            return res.status(200).json({
                message: "Order already processed",
                orderId: orderExists._id
            });
        }
       
        //update coupon
        if(session.metadata.couponCode){
            await Coupon.findOneAndUpdate(
                {
                     code: session.metadata.couponCode,
                    userId: new mongoose.Types.ObjectId(session.metadata.userId)
                },
                {
                    isActive: false,
                    usedAt:  new Date(session.created * 1000) // Stripesession creation time
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
        
    } catch (error) {
        console.error("Error in checkoutSuccess controller",error);
        return res.status(500).json({message: "Error processing sucessfull checkout"});
    }
}