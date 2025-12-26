import { Router } from "express";
import { logOut, signIn, signUP, refreshToken, getProfile } from "../controllers/auth.controller.js";
import { isAuth } from "../middlewares/auth.middleware.js";

const router = Router();

router.post("/sign-up", signUP)
router.post("/sign-in", signIn);
router.post("/refresh-token", refreshToken);
router.post("/logout", logOut);
router.get("/profile", isAuth, getProfile);

export default router;

