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
const { SourceTextModule } = require('vm');


var instance = new Razorpay({
    key_id: process.env.KEY_ID,
    key_secret: process.env.KEY_SECRET
});


function generateOrder() {
    let number = Math.floor(Math.random() * 10000);
    let order = number.toString().split('').join('-');
    return order;
}

const placeOrder = async (req, res) => {
    try {
        const userId = req.session.user_id;
        const { cartId, addressId, paymentOption, couponId } = req.body;

        const userCart = await cart.findById(cartId).populate('items.product');

        const orderNumber = generateOrder();

        const orderProduct = userCart.items.map((cartItem) => ({
            product: cartItem.product,
            size: cartItem.size,
            quantity: cartItem.quantity,
            price: cartItem.subTotal
        }))

        // console.log("orderProduct is",orderProduct);

        const updatePromises = orderProduct.map(async (order) => {

            const product = await Product.findById(order.product._id);

            if (product) {
                product.popularity++;
                return product.save();
            }
        });

        await Promise.all(updatePromises);

        const updateProduct = orderProduct.map(async(order)=>{

            const product = await Product.findById(order.product._id);
            const sizeObj = product.sizes.find(item => item.size === order.size);

            sizeObj.quantity -= order.quantity;
      

            product.save();
        }) 
        
        await Promise.all(updateProduct);

        const userAddress = await address.findById(addressId);

        const orderData = new orders({
            userId: userId,
            orderNumber: orderNumber,
            items: orderProduct,
            totalAmount: userCart.total,
            shippingAddress: userAddress,
            payment: paymentOption,
        })
        await orderData.save();

        const orderId = orderData._id;
        if (couponId) {
            const couponData = await Coupon.findOne({ couponId: couponId })
            const userData = await customer.findById({ _id: userId })
            userData.appliedCoupon.push(couponId);
            await userData.save();
            const recentOrder = await orders.findByIdAndUpdate({ _id: orderId }, {
                couponApplied: true,
                couponAmount: couponData.maximumDiscount
            });
            await recentOrder.save();
        }

        if (orderData) {
            res.status(200).json({ message: 'order placed successfully', orderId });
            userCart.items = [];
            userCart.total = 0;
            userCart.save();
        }

    } catch (error) {
        console.log(error.message);
    }
} 

const orderSuccess = async (req, res) => {
    try {
        const orderId = req.query.orderId;
        res.render('orderSuccess', { orderId });
    } catch (error) {
        console.log(error.message);
    }
}

const orderDetail = async (req, res) => {
    try {
        const id = req.query.id;

        const orderData = await orders.findById(id).populate({
            path: 'items.product',
            model: 'Product'
        })
        res.render('viewOrder', { orderDetails: orderData });
    } catch (error) {
        console.log(error.message);
    }
}

const orderCancelation = async (req, res) => {
    try {

        const userId = req.session.user_id;

        const orderId = req.params.orderId;

        const reason = req.body.reason;

        const nowOrder = await orders.findByIdAndUpdate({ _id: orderId }, {
            isCancelled: true,
            reasonForCancel: reason,
            status: 'canceled'
        })
        console.log("nowOrder is",nowOrder);


        const updateProduct =  nowOrder.items.map(async(order)=>{

            const product = await Product.findById(order.product._id);
            const sizeObj = product.sizes.find(item => item.size === order.size);
            sizeObj.quantity += order.quantity;
            product.save();
        });
        
        await Promise.all(updateProduct);


        const amount = nowOrder.totalAmount;
        const userWallet = await Wallet.findOne({ user: userId });
        userWallet.walletBalance += amount;
        const transactionData = {
            createdAt: Date.now(),
            paymentType: 'Refund',
            transactionMode: 'credited',
            transactionAmount: amount
        }
        userWallet.transactionHistory.push(transactionData);
        userWallet.totalRefund += amount;
        await nowOrder.save();
        await userWallet.save();

        if (nowOrder) {
            res.status(200).json({ success: true });
        }


    } catch (error) {

        console.log(error.message);

    }
}

const orderReturn = async (req, res) => {
    try {
        const { reason } = req.body;
        const orderId = req.params.orderId;

        const orderData = await orders.findByIdAndUpdate({ _id: orderId }, {
            status: 'Return pending',
            reasonForReturn: reason
        })

        await orderData.save();
        if (orderData) {
            res.status(200).json({ success: true })
        }

    } catch (error) {
        res.status(500).json({ success: false })
    }
}

const onlinePayment = async (req, res) => {

    try {

        const { cartId, addressId, paymentOption } = req.body;

        const userCart = await cart.findById(cartId).populate('items.product');

        const orderNumber = generateOrder();


        var options = {
            amount: userCart.total * 100,
            currency: "INR",
            receipt: "" + orderNumber
        };

        instance.orders.create(options, function (err, order) {
            if (!err) {
                res.json({ status: true, order: order, addressId: addressId })
            }
        });

    } catch (error) {

        console.log(error.message);

    }
}

const verifyPayment = async (req, res) => {
    try {
        const userId = req.session.user_id;
        const { response, addressId, paymentOption, couponCode } = req.body;

        let hmac = crypto.createHmac('sha256', 'kuTpuvH0alcJCKencU1E4L8N')
        hmac.update(response.razorpay_order_id + "|" + response.razorpay_payment_id)
        hmac = hmac.digest('hex');
        if (hmac == response.razorpay_signature) {


            const cartData = await cart.findOne({ userId: userId }).populate('items.product')
            const userAddress = await address.findById({ _id: addressId });
            const orderNumber = generateOrder();
            const cartProduct = cartData.items.map((cartItem) => ({
                product: cartItem.product,
                size: cartItem.size,
                quantity: cartItem.quantity,
                price: cartItem.subTotal
            }))

            const updatePromises = cartProduct.map(async (order) => {

                const product = await Product.findById(order.product._id);

                if (product) {
                    product.popularity++;
                    return product.save();
                }
            });

            await Promise.all(updatePromises);

            const updateProduct = cartProduct.map(async(order)=>{

                const product = await Product.findById(order.product._id);
                const sizeObj = product.sizes.find(item => item.size === order.size);
    
                sizeObj.quantity -= order.quantity;
          
    
                product.save();
            }) 
            
            await Promise.all(updateProduct);

            const orderData = new orders({
                userId: userId,
                orderNumber: orderNumber,
                items: cartProduct,
                totalAmount: cartData.total,
                shippingAddress: userAddress,
                payment: paymentOption
            })

            await orderData.save();
            const orderId = orderData._id;

            if (couponCode) {
                const couponData = await Coupon.findOne({ couponId: couponCode })
                const amount = couponData.maximumDiscount
                const userData = await customer.findById({ _id: userId })
                userData.appliedCoupon = couponCode;
                await userData.save();
                const recentOrder = await orders.findByIdAndUpdate({ _id: orderId }, {
                    couponApplied: true,
                    couponAmount: amount
                });
                await recentOrder.save();
            }
            if (orderData) {
                res.status(200).json({ message: 'order placed successfully', orderId });
                cartData.items = [];
                cartData.total = 0;
                cartData.save();
            }
        }

    } catch (error) {

        console.log(error.message);

    }
}

const failedPayment = async (req, res) => {
    try {
        const userId = req.session.user_id;
        const { addressId, paymentOption, couponCode } = req.body;

        const cartData = await cart.findOne({ userId: userId }).populate('items.product');

        const userAddress = await address.findById({ _id: addressId });

        const orderNumber = generateOrder();

        const cartProduct = cartData.items.map((cartItem) => ({
            product: cartItem.product,
            size: cartItem.size,
            quantity: cartItem.quantity,
            price: cartItem.subTotal
        }))

        const orderData = new orders({
            userId: userId,
            orderNumber: orderNumber,
            items: cartProduct,
            totalAmount: cartData.total,
            shippingAddress: userAddress,
            payment: paymentOption,
            status: 'failed'
        })

        await orderData.save();

        const orderId = orderData._id;

        if (couponCode) {
            const couponData = await Coupon.findOne({ couponId: couponCode })
            const amount = couponData.maximumDiscount
            const userData = await customer.findById({ _id: userId })
            userData.appliedCoupon = couponCode;
            await userData.save();
            const recentOrder = await orders.findByIdAndUpdate({ _id: orderId }, {
                couponApplied: true,
                couponAmount: amount
            });
            await recentOrder.save();
        }
        if (orderData) {
            res.status(200).json({ message: 'order created', orderId });
            cartData.items = [];
            cartData.total = 0;
            cartData.save();
        }

    } catch (error) {
        console.log(error);
    }
}

const orderFailedPage = async (req, res) => {
    try {
        const orderId = req.query.orderId;
        res.render('orderFailed', { orderId });

    } catch (error) {
        console.log(error);
    }
}

const retryPayment = async (req, res) => {
    try {

        const { orderId } = req.body;

        const orderDetail = await orders.findById({ _id: orderId })

        var options = {
            amount: orderDetail.totalAmount * 100,
            currency: "INR",
            receipt: "" + orderDetail.orderNumber
        };

        instance.orders.create(options, function (err, order) {
            if (!err) {
                res.status(200).json({ status: true, order: order, userOrderId: orderId })
            }
        });

    } catch (error) {

        console.log(error);

    }
}

const verifyRetryPay = async (req, res) => {
    try {

        const { userOrderId, response } = req.body;

        let hmac = crypto.createHmac('sha256', 'kuTpuvH0alcJCKencU1E4L8N')
        hmac.update(response.razorpay_order_id + "|" + response.razorpay_payment_id)
        hmac = hmac.digest('hex');
        if (hmac == response.razorpay_signature) {
            const orderData = await orders.findByIdAndUpdate({ _id: userOrderId }, { status: 'pending' })
            await orderData.save();
            res.status(200).json({ message: 'payment successful' });
        } else {
            res.status(500).json({ success: false });
        }

    } catch (error) {
        console.log(error);
    }
    
}


module.exports = {
    placeOrder,
    orderSuccess,
    orderDetail,
    orderCancelation,
    orderReturn,
    onlinePayment,
    verifyPayment,
    failedPayment,
    orderFailedPage,
    retryPayment,
    verifyRetryPay,
}