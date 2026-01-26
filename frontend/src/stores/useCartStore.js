import { create } from "zustand";
import axios from "../lib/axios.js"
import toast from "react-hot-toast";
const useCartStore = create((set, get) => ({
    cart: [],
    isLoading: false,
    total:0,
    subtotat:0,
    coupon:null,

    addToCart: async(product) => {
        set({isLoading: true});
        try {
            await axios.post("/cart", {productId: product._id});
            toast.success("Product added to cart successfully");
            set((prevstate) => {
                const existingItem = prevstate.cart?.find((item) => item._id === product._id);

                const newCart= existingItem? prevstate.cart.map((item) => (item._id === product._id ? {...item, quantity: item.quantity+1}: item))
                : [...prevstate.cart, {...product, quantity: 1}];
                return {cart: newCart, isLoading: false};
            });
            get().calculateTotals();
            
        } catch (error) {
            set({isLoading: false});
            toast.error("Unable to add item to cart. Please try again.");
        }
    },

    getCartProducts: async() => {
         set({cart: [], loading: true});
         try {
            const response = await axios.get("/cart");
            set({
                cart: response.data,
                isLoading: false
            });
            get().calculateTotals();
         } catch (error) {
            set({cart: [], loading: false});
            toast.error(error.response.data.message || "oops something went wrong, please try again");
         }
    },

    calculateTotals: ()=> {
        const {cart, coupon} = get();
        const subtotal = cart?.reduce((sum, item) => sum + item.price * item.quantity, 0);
        let total = subtotal;

        if(coupon) {
            const discount = subtotal * (coupon.discountPercentage)/100;
            total = subtotal - discount;
        }
        set({subtotal, total});

    }


}));

export default useCartStore;