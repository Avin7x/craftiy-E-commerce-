import { create } from "zustand";
import axios from "../lib/axios";
import {toast} from "react-hot-toast";

const useproductStore = create((set) => ({
    //product:[],
    loading:false,
    createProduct: async(product)=>{
        set({loading:true});
        try {
            const formData = new FormData();
            
            formData.append("name", product.name);
            formData.append("description", product.description);
            formData.append("price", product.price);
            formData.append("category", product.category);
            formData.append("image", product.image);

            const res = await axios.post("/products", formData);
            toast.success("Product created successfully");
            set({loading: false});
        } catch (error) {
            set({loading: false});
            toast.error(error.response?.data?.message || "Failed to create product, please try again");
        }
    },

    toggleFeaturedProduct: async(productId)=>{
        set({loading:true});
        try {
            const res = await axios.post("/products/productId");
            set({loading:false});
            toast.success(res.data.message);
        } catch (error) {
            set({loading:false});
            toast.error(error.response?.data?.message || "server error, please try again later");
        }
    },
    deleteProduct:async(productId) => {
        set({loading:true});
        try {
            const res = await axios.post("/products/productId");
            set({loading:false});
            toast.success(res.data.message);
        } catch (error) {
            set({loading:false});
            toast.error(error.response?.data?.message || "server error, please try again later");
        }
    }
}));

export default useproductStore;