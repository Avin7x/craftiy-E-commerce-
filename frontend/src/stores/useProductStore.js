import { create } from "zustand";
import axios from "../lib/axios";
import {toast} from "react-hot-toast";

const useproductStore = create((set, get) => ({
    products:[],
    loading:false,
    fetchAllProducts: async() => {
        set({loading:true});
        try {
            const res = await axios.get("/products");
            set({
                products: res.data.products,
                loading: false
            })
        } catch (error) {
            set({loading: false});
            toast.error(error.response.data.message || "Failed to fetch products")
        }

    },
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
            set((prevState) => ({
                products: [...prevState.products, res.data],
                loading:false
            }))
           
            toast.success("Product created successfully");
            
        } catch (error) {
            set({loading: false});
            toast.error(error.response?.data?.message || "Failed to create product, please try again");
        }
    },

    toggleFeaturedProduct: async(productId)=>{
        set({loading:true});
        try {
            const res = await axios.patch(`/products/${productId}`);
            console.log(res);
            set((prevState) => ({products: prevState.products.map((product) => product._id === productId ? {...product, isFeatured: res.data.updatedProduct.isFeatured} : product), loading:false}));
            toast.success(res.data.message);
        } catch (error) {
            set({loading:false});
            toast.error(error.response?.data?.message || "server error, please try again later");
        }
    },
    deleteProduct:async(productId) => {
        set({loading:true});
        try {
            const res = await axios.post(`/products/${productId}`);
            set((prevState) => ({
                products: prevState.products.filter(product => product._id !== productId),
                loading: false
            }));
            toast.success(res.data.message);
        } catch (error) {
            set({loading:false});
            toast.error(error.response?.data?.message || "server error, please try again later");
        }
    }
}));

export default useproductStore;