import { Router } from "express";
import { createProduct, deleteProduct, getAllProducts, getFeaturedProducts, getProductsBycategory, getRecommendedProducts, toggleFeaturedProduct } from "../controllers/product.controller.js";
import {  isAuth } from "../middlewares/auth.middleware.js";
import { adminOnly } from "../middlewares/role.middleware.js";

const router = Router();

router.get('/', isAuth, adminOnly, getAllProducts);
router.get('/featured', getFeaturedProducts);
router.get('/recommendations', getRecommendedProducts);
router.get('/category/:category', getProductsBycategory);
router.post('/', isAuth, adminOnly, createProduct);
router.patch('/:productId', isAuth, adminOnly, toggleFeaturedProduct);
router.post('/:productId', isAuth, adminOnly, deleteProduct);

export default router;