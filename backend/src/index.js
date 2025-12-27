import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import cookieParser from "cookie-parser";
import path from "path";
import fileUpload from "express-fileupload";
import {connectDb} from "./lib/db.js"
import authRoutes from "./routes/auth.route.js";
import productRoutes from "./routes/product.route.js"
import cartRoutes from "./routes/cart.route.js"
import couponRoutes from "./routes/coupon.route.js"
import paymentRoutes from "./routes/payment.route.js"
import analyticsRoutes from "./routes/analytics.route.js"




dotenv.config();

const port = process.env.PORT || 8000;

const app = express();

app.use(cors({
    origin: "http://localhost:5173",
    credentials: true
}));

app.use(express.json());
app.use(cookieParser());

const __dirname = path.resolve();//return the  abs path of CWD
app.use(fileUpload({
    useTempFiles: true,
    tempFileDir: path.join(__dirname, "/tmp"),
    createParentPath: true,
    limits: 5*1024*1024//5mb
}))


app.use("/api/auth", authRoutes);
app.use("/api/products", productRoutes);
app.use("/api/cart", cartRoutes);
app.use("/api/coupons", couponRoutes);
app.use("/api/payments", paymentRoutes);
app.use("/api/analytics", analyticsRoutes);


connectDb().then(()=> {
    app.listen(port, ()=> {
    console.log("server started at port:", port);
    })
}).catch(err => {
    console.log("Error connecting Mongodb",err);
    process.exit(1);//stop the server
});
    
