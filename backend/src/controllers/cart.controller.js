import Product from "../models/product.model.js"
import User from "../models/user.model.js";
import product from "../models/product.model.js"

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
      await user.populate("cartItems.product");

      return res.status(200).json(
         user.cartItems
      );
    } catch (error) {
        console.error("Error in addToCart controller",  error);
        return  res.status(500).json({message: "server error",  error: error.message});
    }
}


export const removeAllFromCart = async (req, res) => {
  try {
    const {productId} = req.body;
    const user = req.user;
    
    if (!productId) {
      // remove all
      user.cartItems = [];
    }
    else {
      console.log(productId);
      user.cartItems = user.cartItems.filter((item) => item.product.toString() !== productId);
      user.cartItems.forEach((item) => {
        console.log(item);
      });
      // await user.save();
    }
      await user.save();
      await user.populate("cartItems.product")
      return res.json(user.cartItems);
    
  } catch (error) {
    console.error("Error in removeAllFromCart controller", error);
    return res.status(500).json({ message: "Server error", error: error.message });
  }
};


export const updateQuantity = async (req, res) => {
  try {
    const productId = req.params.id;
    const { quantity } = req.body;
    const user = req.user;
    console.log("request for updating quantity:", productId);
    const existingItem = user.cartItems.find(
      item => item.product.toString() === productId
    );

    if (!existingItem) {
      return res.status(404).json({ message: "Product not found" });
    }
    


    //  if quantity goes to 0 → remove item
    if (quantity <= 0) {
      console.log("call to update quantity")
      user.cartItems = user.cartItems.filter(
        item => item.product.toString() !== productId
      );

    }
    else {
       // otherwise update quantity
      existingItem.quantity = quantity;
      
    }
    await user.save();
    await user.populate("cartItems.product")
    return res.json(user.cartItems);

  } catch (error) {
    console.error("Error in updateQuantity controller", error);
    return res.status(500).json({ message: "Server error", error: error.message });
  }
};



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