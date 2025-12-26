import { Router } from "express";
import { isAuth } from "../middlewares/auth.middleware.js";
import { getCoupon, validateCoupon } from "../controllers/coupon.controller.js";

const router = Router();
router.get("/", isAuth, getCoupon);
router.get("/validate", isAuth, validateCoupon);
export default router;