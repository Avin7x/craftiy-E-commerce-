import { ShoppingCart } from "lucide-react";
import {toast} from "react-hot-toast"
import useCartStore from "../stores/useCartStore";
import useUserStore from "../stores/useUserStore";


const ProductCard = ({product}) => {
  const { addToCart } = useCartStore();
  const { user } = useUserStore();
  const handleAddToCart = async () => {
    if(!user) {
      toast.error("Please login or signup before adding items to cart");
      return;
    }
    addToCart(product);
  };
  return (
    <div className='w-full relative flex flex-col overflow-hidden rounded-lg border border-gray-700 shadow-lg'>
      <div className='relative mx-3 mt-3 h-60 flex overflow-hidden rounded-xl'>
        <img className='object-cover w-full' src={product.image} alt={product.name} />
        <div className='absolute inset-0 bg-black/5'/>
      </div>

      <div className='mt-4 px-5 pb-5'>
        <h5 className='text-xl text-white font-semibold tracking-tight'>{product.name}</h5>
        <div className='mt-2 mb-5 flex items-center justify-between'>
          <p>
            <span className='text-3xl font-bold text-emerald-400'>${product.price}</span>
          </p>
        </div>
        <button
          className='flex items-center justify-center rounded-lg bg-emerald-600 px-5 py-2.5 text-center text-sm font-medium text-white hover:bg-emerald-700 focus:outline-none focus:ring-4 focus:ring-emerald-300'
          onClick={handleAddToCart}
        >
          <ShoppingCart size={22} className='mr-2' />
          Add to cart
        </button>
      </div>
    </div>
  )
}

export default ProductCard