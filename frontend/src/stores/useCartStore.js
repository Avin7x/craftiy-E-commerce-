import { create } from "zustand";
import axios from "../lib/axios.js"
import toast from "react-hot-toast";
const useCartStore = create((set, get) => ({
    cart: [],
    isLoading: false,
    total:0, //price of products b4 any charges
    subtotal:0, //total amount after applying copuns or any discount
    coupon:null, 
    isCouponApplied: false,

    addToCart: async(product) => {
        set({isLoading: true});
        try {
            const response = await axios.post("/cart", {productId: product._id});
            set({isLoading: false, cart: response.data});
            toast.success("Product added to cart successfully");
            get().calculateTotals();
            
        } catch (error) {
            set({isLoading: false});
            toast.error("Unable to add item to cart. Please try again.");
        }
    },

    getCartProducts: async() => {
         set({ isLoading: true});
         try {
            const response = await axios.get("/cart");
            set({
                cart: response.data,
                isLoading: false
            });
            get().calculateTotals();
         } catch (error) {
            set({cart: [], isLoading: false});
            toast.error(error.response.data.message || "oops something went wrong, please try again");
         }
    },
    removeFromCart: async (productId) => {
         console.log("DELETE request productId:", productId);
        set({isLoading: true});
        try {
            const response = await axios.delete(`/cart`, { data: { productId } });
            set({isLoading:false, cart: response.data});
            get().calculateTotals();
            toast.success( "Product removed from cart successfully");
            
            
        } catch (error) {
             set({isLoading:false});
             toast.error(error.response.data.message || "oops something went wrong");
        }
    },
    updateQuantity: async(product, quantity) => {
        console.log(quantity);
        console.log(product);
        if(quantity === 0){
            await get().removeFromCart(product);
            return;
        }
        set({isLoading:true});
        try {
            //note: data wrapper is only meeded for delete method
            const response = await axios.put(`/cart/${product}`, {quantity});
           set({isLoading: false, cart: response.data})
            get().calculateTotals();

        } catch (error) {
            toast.error(error.response?.data?.message || "oops something went wrong!");
        } finally {
            set({isLoading:false});
        }
    },

    calculateTotals: ()=> {
        const {cart, coupon} = get();
        const subtotal = cart?.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
        let total = subtotal;

        if(coupon) {
            const discount = subtotal * (coupon.discountPercentage)/100;
            total = subtotal - discount;
        }
        set({subtotal, total});

    }


}));

export default useCartStore;