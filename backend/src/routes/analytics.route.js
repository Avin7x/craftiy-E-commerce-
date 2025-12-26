import express from "express"
import { isAuth } from "../middlewares/auth.middleware.js";
import { adminOnly } from "../middlewares/role.middleware.js";
import { getAnalytics } from "../controllers/analytics.controller.js";
const  router = express.Router();

router.get("/", isAuth, adminOnly, getAnalytics);
export default router;