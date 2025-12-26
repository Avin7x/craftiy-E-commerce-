import express from "express"
import { isAuth } from "../middlewares/auth.middleware.js";
import { checkoutSucess, createCheckoutSession } from "../controllers/payment.controller.js";
const router = express.Router();

router.post("/create-checkout-session", isAuth, createCheckoutSession );
router.post("/checkout-success", isAuth, checkoutSucess);


export default router;
