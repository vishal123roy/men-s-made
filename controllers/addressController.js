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

const addressPage = async (req, res) => {
    try {

        const allAddress = await address.find({ user: req.session.user_id });

        res.render('myAddress', { addresses: allAddress });

    } catch (error) {
        console.log(error.message);
    }
};

const addAddresspage = async (req, res) => {
    try {
        const source = req.query.source;
        res.render('addAddress',{source});
    } catch (error) {
        console.log(error.message);
    }
}

const insertAddress = async (req, res) => {
    try {

        const { name, pincode, locality, addressArea, district, state, landmark, mobile, locationType,source } = req.body;
        const userId = req.session.user_id;
        const addressData = new address({
            user: userId,
            name: name,
            pincode: pincode,
            locality: locality,
            address: addressArea,
            district: district,
            state: state,
            landmark: landmark,
            alternativeNumber: mobile,
            locationType: locationType
        });

        await addressData.save();

        if (addressData) {

    
            if(source ==='checkout'){
            res.redirect('/checkoutPage');
            }else{
            res.redirect('/addressList');
            }

        } else {
            res.render('addAddress', { message: 'address error' })
        }
    } catch (error) {
        console.log(error.message);
    }
}

const editAddresspage = async (req, res) => {
    try {
        const id = req.query.id;
        const source = req.query.source;
        
        const addressData = await address.findById({ _id: id })
        
        res.render('editAddress', { Address: addressData,source });
    } catch (error) {
        console.log(error.message);
    }
}

const updateAddress = async (req, res) => {
    try {
        const id = req.query.id;

        const { name, pincode, locality, addressArea, district, state, landmark, mobile, locationType,source } = req.body;

        const addressData = await address.findByIdAndUpdate({ _id: id }, {
            name: name,
            pincode: pincode,
            locality: locality,
            address: addressArea,
            district: district,
            state: state,
            landmark: landmark,
            alternativeNumber: mobile,
            locationType: locationType
        });

        await addressData.save();
   
        if (addressData) {
   
            if(source === 'checkout'){
                res.redirect('/checkoutPage')
            }else{
                res.redirect('/addressList');
            }
        }

    } catch (error) {
        console.log(error.message);
    }
}

const deleteAddress = async (req, res) => {
    try {
        const id = req.query.id;

        const addressData = await address.findByIdAndDelete({ _id: id })

        if (addressData) {
            res.redirect('/addressList');
        } 
    } catch (error) {
        console.log(error.message);
    }
}


module.exports = {
    addressPage,
    addAddresspage,
    insertAddress,
    editAddresspage,
    updateAddress,
    deleteAddress
}