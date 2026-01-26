import Product from "../models/product.model.js"

 export const addTocart = async (req, res) => {
    try {
        const {productId} = req.body;
        const user = req.user;
        let existingItem = user.cartItems.find(item => item.product.toString() === productId);
        if(existingItem){
            //if product already exists in cart increase its  quantity
            existingItem.quantity+=1;
        }
        else{
            // add new product to cart
            user.cartItems.push({
                quantity:1,
                product: productId
            });
        }

        await user.save();
        return  res.status(200).json({message: "Product added to cart successfully"});
    } catch (error) {
        console.error("Error in addToCart controller",  error);
        return  res.status(500).json({message: "server error",  error: error.message});
    }
}




export const removeAllFromCart = async (req, res) => {
  try {
    const { productId } = req.body;
    const user = req.user;

    if (!productId) {
      // remove all
      user.cartItems = [];
      await user.save();
      return res.status(200).json({ message: "All products removed from cart successfully" });
    }

    if (!mongoose.Types.ObjectId.isValid(productId)) {
      return res.status(400).json({ message: "Invalid productId" });
    }

    const exists = user.cartItems.some(item => item.product.equals(productId));
    if (!exists) {
      return res.status(404).json({ message: "Product not found in cart" });
    }

    user.cartItems = user.cartItems.filter(item => !item.product.equals(productId));
    await user.save();

    return res.status(200).json({ message: "Product removed from cart successfully" });
  } catch (error) {
    console.error("Error in removeAllFromCart controller", error);
    return res.status(500).json({ message: "Server error", error: error.message });
  }
};


export const updateQuantity = async (req, res)=>{
    try {
        const productId =req.params.productId;
        const user = req.user;
        const {quantity}=req.body;

        let existingItem =  user.cartItems.find(item => item.product.equals(productId));
        
        if(existingItem){
            if(existingItem.quantity ===  0){
                user.cartItems = user.cartItems.filter(item =>  item.product.equals(productId));
                await user.save();
                return res.status(200).json(user.cartItems);
            }
           existingItem.quantity = quantity;
           await user.save();
           return res.status(200).json(user.cartItems);
        }
        else{
          return res.status(404).json({message: "Product not found"});
        }

    } catch (error) {
        console.error("Error in updateQuantity controller", error);
    return res.status(500).json({ message: "Server error", error: error.message });
    }
}

export const getCartProducts = async(req, res) => {
  try {
    if(req.user.cartItems.length === 0){
      //cart is empty
      return res.status(200).json([]);
    }
    //get all the product ids
    const productIds = req.user.cartItems.map(item => item.product);
    
    // fetch all the products from  mongodb using the product ids
    const products  = await Product.find({_id: {$in: productIds }}).lean();

    //store all the products in map for constant o(1) lookup
    const productMap = new Map();
    products.forEach(p => {
      productMap.set(p._id.toString(), p);
    });

    const cartItems = req.user.cartItems.map(item => ({
      product : productMap.get(item.product.toString()),
      quantity: item.quantity
      
    })).filter(item => item.product); //filter out the deleted products

    
    return res.status(200).json(cartItems);
    


  } catch (error) {
    console.error("Error in getCartProducts controller", error);
    return res.status(500).json({message: "server error", error: error.message});
  }
}