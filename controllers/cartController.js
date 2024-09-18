const customer = require('../models/userModel');
const Product = require('../models/productModel');
const address = require('../models/addressModel');
const cart = require('../models/cartModel');
const category = require('../models/categorymodel');
const orders = require('../models/orderModel');
const Coupon = require('../models/couponModel');
const nodemailer = require('nodemailer');
const bcrypt = require('bcrypt');
const { subscribe } = require('../routes/userRoute');
const { acceptsEncodings } = require('express/lib/request');
const Razorpay = require('razorpay');
const crypto = require('crypto');
const wishList = require('../models/wishListModel');
const Wallet = require('../models/walletModel');

const cartPage = async (req, res) => {
    try {
        const userId = req.session.user_id;

        const productData = await cart.findOne({ userId: userId }).populate('items.product');

        const data = productData.items;

        res.render('cart', { cartList: data });
    } catch (error) {
        console.log(error.message);
    }
}

const addTocart = async (req, res) => {
    try {
        const productId = req.params.productId;
        const Size = req.query.size;
        const userId = req.session.user_id;

        const findCart = await cart.findOne({ userId: userId });

        const product = await Product.findById({ _id: productId });
        const { offerPrice, price } = product;

        let Price = offerPrice !== undefined ? offerPrice : price;

     
        const existingProduct = findCart.items.find(
            item => item.product.toString() === productId && item.size === Size
        );

        if (existingProduct) {
         
            existingProduct.quantity += 1;
            existingProduct.subTotal += Price;
            findCart.total += Price;
        } else {
      
            const productData = {
                product: productId,
                size: Size,
                subTotal: Price,
                quantity: 1
            };
            findCart.items.push(productData);
            findCart.total += Price;
        }

        await findCart.save();
        res.status(200).json({ message: "Your product added successfully" });

    } catch (error) {
        res.status(500).json({ message: error.message });
        console.log(error.message);
    }
};


const quantityUpdate = async (req, res) => {

    const productId = req.params.productId;
    const action = req.body.action;
    const userId = req.session.user_id;

    try {

        const cartList = await cart.findOne({ userId: userId });
        if (!cartList) {
            return res.status(404).json({ error: 'Cart not found' });
        }

        const productIndex = cartList.items.findIndex(item => item.product.toString() === productId);
        if (productIndex === -1) {
            return res.status(404).json({ error: 'Product not in cart' });
        }

        const cartProduct = cartList.items[productIndex];

  
        const product = await Product.findById(productId);
        if (!product) {
            return res.status(404).json({ error: 'Product not found' });
        }

        const chosenSize = cartProduct.size;
        const sizeObj = product.sizes.find(size => size.size === chosenSize);
        if (!sizeObj) {
            return res.status(404).json({ error: 'Size not found for the product' });
        }

        if (action === 'increment') {
            if (sizeObj.quantity > cartList.items[productIndex].quantity) {
                cartList.items[productIndex].quantity++;
                
            } else {
                return res.status(400).json({ error: 'Cannot exceed available stock' });
            }
        } else if (action === 'decrement') {
            if (cartProduct.quantity > 1) {
                cartList.items[productIndex].quantity--;
                
            } else {
                return res.status(400).json({ error: 'Minimum quantity reached' });
            }
        }
        
        const price = product.offerPrice || product.price;
        const newSubtotal = cartList.items[productIndex].quantity * price;
        cartList.items[productIndex].subTotal = newSubtotal;

        const newTotal = cartList.items.reduce((acc, item) => acc + item.subTotal, 0);
        cartList.total = newTotal;

        await cartList.save();

        res.status(200).json({ items: cartList.items, total: cartList.total,productId,newSubtotal});

    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

const removeCart = async (req, res) => {
    try {
        const { id } = req.body; 
        const userId = req.session.user_id;

        const userCart = await cart.findOne({ userId: userId });
        if (!userCart) {
            return res.status(404).json({ success: false, message: 'Cart not found' });
        }

        const itemIndex = userCart.items.findIndex(item => item.product.toString() === id);
        if (itemIndex === -1) {
            return res.status(404).json({ success: false, message: 'Item not found in cart' });
        }

        const removedItem = userCart.items[itemIndex];

        const product = await Product.findById(id);
        if (!product) {
            return res.status(404).json({ success: false, message: 'Product not found' });
        }

        const sizeObj = product.sizes.find(size => size.size === removedItem.size);
        if (!sizeObj) {
            return res.status(404).json({ success: false, message: 'Size not found for the product' });
        }

        userCart.items.splice(itemIndex, 1);

        userCart.total -= removedItem.subTotal;
        
        if (userCart.items.length == 0) {
            userCart.total = 0;
        }

        await userCart.save();

        res.status(200).json({ success: true });
    } catch (error) {
        console.error('Error removing item from cart:', error);
        res.status(500).json({ success: false, message: 'Error removing item from cart' });
    }
};


const checkoutPage = async (req, res) => {
    try {
        const userId = req.session.user_id;

        const userData = await customer.findOne({ _id: userId });

        const userAddress = await address.find({ user: userId });

        const cartProduct = await cart.findOne({ userId: userId }).populate('items.product');
        const cartTotal = cartProduct.total
        const coupons = await Coupon.find({
            $and: [
                { minimumAmount: { $lte: cartTotal } },
                { maximumAmount: { $gte: cartTotal } },
                { expireDate: { $gt: Date.now() } }
            ]
        });

        res.render('checkout', {
            userAddress: userAddress,
            cartProduct: cartProduct,
            userData,
            coupons
        });

    } catch (error) {
        console.log(error.message);
    }
}

module.exports = {
    cartPage,
    addTocart,
    removeCart,
    quantityUpdate,
    checkoutPage,
}