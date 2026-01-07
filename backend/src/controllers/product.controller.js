import { redis } from "../lib/redis.js";
import  cloudinary  from "../lib/cloudinary.js";
import Product from "../models/product.model.js"
import fs from "fs";

export const getAllProducts = async (req, res) => {
    try {
        const products = await Product.find({});
        return res.status(200).json({products});
    } catch (error) {
        console.error("Error in getAllProducts controller", error);
        return res.status(500).json({message: "Internal server error"});
    }
}

export const getFeaturedProducts = async (req, res) => {
    try {
        //check if featured products available in redis
        let featuredProducts = await redis.get("featured_products");
        if(featuredProducts){
            return res.status(200).json({featuredProducts: JSON.parse(featuredProducts)});
        }
        // else fetch from mongo db
        featuredProducts = await Product.find({isFeatured: true}).lean();
        //lean---> returns a plain js object  instead of mongodb document 
        //improves performance
        if(featuredProducts.length === 0){
            return res.status(404).json({message: "No featured products found "})
        }
        //cache the featured products in redis
        await redis.set("featured_products", JSON.stringify(featuredProducts));
        return res.status(200).json({featuredProducts});
    } catch (error) {
        console.error("Error in getFeaturedProducts", error);
        return res.status(500).json({message: "Internal server error"});
    }
}

export const getRecommendedProducts = async  (req, res)=>{
    try {
        const products =  await Product.aggregate([
            {
                $sample: {size:  3}
            },
            {
                $project: {
                    _id:1,
                    name:1,
                    description:1,
                    image:1,
                    price:1
                }
            }
        ]);

        res.json(products);
    } catch (error) {
        console.error("Error in getRecommendedProducts controller", error);
        return res.status(500).json({message: "server error", error: error.message});
    }
}

export const getProductsBycategory = async(req, res)=>{
    try {
        const product = await Product.find({category: req.params.category});
        if(product.length === 0){
            return res.status(404).json({message: "Product not  found"});
        }

        return res.status(200).json(product);
    } catch (error) {
        console.error("Error in getProductsBycategory controller", error);
        return res.status(500).json({message: "server error", error: error.message});
    }
}

const updateFeaturedProductsCache = async () =>  {
    try {
        const featuredProducts = await Product.find({isFeatured:true}).lean();
        await redis.set("featured_products", JSON.stringify(featuredProducts));
    } catch (error) {
        console.error("Error in update cache function", error);
    }
}
export const toggleFeaturedProduct = async (req,res) => {
    try {
        const product = await Product.findById(req.params.productId);
        if(!product){
            return res.status(404).json({message:"product not found"});
        }
        product.isFeatured = !(product.isFeatured);
        const updatedProduct = await product.save();
        //update the redis cache for featured  products
        await updateFeaturedProductsCache();

        return res.status(200).json({
        message: `Product ${
            product.isFeatured ? "marked as featured" : "removed from featured"
            } successfully`,
        updatedProduct
        });
    } catch (error) {
        console.error("Error in toggleFeaturedProduct controller", error);
        return res.status(500).json({message: "server error", error: error.message});
    }
}

const  uploadOnCloudinary = async  (file) =>  {
    try {
        const res = await cloudinary.uploader.upload(file.tempFilePath, {
            resource_type: 'auto',
            folder: "products"
        });
        return res;
    } catch (error) {
        console.error("Error in uploadOnCloudinary", error);
        throw error;
    }
}

export const createProduct = async (req, res) => {
    let imageFile = req.files?.image || null;
    try {

        const { name, description, price, category} = req.body;
        
        let cloudinaryResponse = null;
        if(imageFile){
           cloudinaryResponse = await uploadOnCloudinary(imageFile);
           fs.unlinkSync(imageFile.tempFilePath);//remove file from disk
           imageFile = null;//prevents double deletion 
        }

        const product = await Product.create({
            name,
            description,
            price,
            image: cloudinaryResponse?.secure_url || "",
            category

        });

        return res.status(201).json(product);

    } catch (error) {
        if(imageFile){
            fs.unlinkSync(imageFile.tempFilePath);
        }
        console.error("Error in createProduct controller", error);
        return res.status(500).json({message: "server error", error: error.message});
    }
}


export const deleteProduct = async (req, res) => {
    try {
        const product = await Product.findById(req.params.productId);
        if(!product) {
            return res.status(404).json({message: "Product not found"});
        }
        if(product.image){
            try {
                const publicId = product.image.split("/upload/")[1].split("/").slice(1).join("/").split(".")[0];
                await cloudinary.uploader.destroy(`products/${publicId}`);
                console.log("Deleted image from cloudinary");
            } catch (error) {
                console.error("Error deleting image from cloudinary", error);
            }
        }

        await Product.findByIdAndDelete(req.params.productId);
        return res.status(200).json({message: "Product deleted successfully"});

    } catch (error) {
        console.error("Error in deleteProduct controller", error);
        return res.status(500).json({message: "server error", error: error.message});
    }
}