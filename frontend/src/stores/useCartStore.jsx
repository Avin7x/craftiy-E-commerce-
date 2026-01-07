import { create } from "zustand";
import axios from "../lib/axios.js"
const useCartStore = create((set) => ({
    addToCart: async(productId) => {
        try {
            const res = await axios.post("/cart", )
        } catch (error) {
            
        }
    }

}));

export default useCartStore;