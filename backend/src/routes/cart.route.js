import { Router } from "express";
import { isAuth } from "../middlewares/auth.middleware.js";
import { addTocart, getCartProducts, removeAllFromCart, updateQuantity } from "../controllers/cart.controller.js";

const router = Router();

router.get("/", isAuth, getCartProducts);
router.post("/", isAuth, addTocart);
router.delete("/", isAuth, removeAllFromCart);
router.put("/:id", isAuth, updateQuantity);

export default router;