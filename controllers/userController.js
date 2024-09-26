
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
require('dotenv').config();


var instance = new Razorpay({
    key_id: process.env.KEY_ID,
    key_secret: process.env.KEY_SECRET
});


const landingPage = async (req, res) => {

    try {

        const productdata = await Product.find({ is_listed: true });

        res.render('landingHomePage', { products: productdata });

    } catch (error) {

        res.render('404')

    }
}

const landingShopPage = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const productsPerPage = 8;
        const skip = (page - 1) * productsPerPage;

        const selectedBrand = req.query.brand;
        const selectedCategory = req.query.category;
        const selectedSort = req.query.sort;
        const searchQuery = req.query.search;

        let filter = {};

        if (selectedCategory) {
            filter.productcategory = selectedCategory;
        }

        if (selectedBrand) {
            filter.brand = selectedBrand;
        }

        if (searchQuery) {
            filter.$and = [

                { productcategory: selectedCategory || { $exists: true } },
                {
                    $or: [
                        { productname: { $regex: searchQuery, $options: 'i' } },
                        { description: { $regex: searchQuery, $options: 'i' } }
                    ]
                }
            ];
        }

        let sort = {};
        if (selectedSort === 'price_asc') sort.price = 1;
        else if (selectedSort === 'price_desc') sort.price = -1;

        const [totalProducts, productList, categories, brands] = await Promise.all([
            Product.countDocuments(filter),
            Product.find(filter).skip(skip).limit(productsPerPage).sort(sort).lean(),
            category.find().lean(),
            Product.distinct('brand')
        ]);

        const totalPages = Math.ceil(totalProducts / productsPerPage);

        if (req.xhr || req.headers.accept.indexOf('json') > -1) {
            res.render('partials/productList', {
                product: productList,
                currentPage: page,
                totalPages,
                selectedBrand,
                selectedCategory,
                selectedSort,
                searchQuery
            });
        } else {
            res.render('landingShopPage', {
                product: productList,
                categories,
                brands,
                currentPage: page,
                totalPages,
                selectedBrand,
                selectedCategory,
                selectedSort,
                searchQuery
            });
        }
    } catch (error) {
        console.error('Error in ShopPage:', error);
        res.status(500).send('Server Error');
    }
};

const landingProductPage = async (req, res) => {
    try {

        const Id = req.query.id;

        const data = await Product.findById({ _id: Id });

        const prodata = await Product.find();

        res.render('landingProductPage', { productData: data, product: prodata });


    } catch (error) {

        res.render('404')

    }
}

const generateOTP = () => {
    return Math.random().toString().slice(2, 8);
};

const otpExpiryTime = () => {
    const now = new Date();
    now.setMinutes(now.getMinutes() + 1);
    return now;
};

function generateOrder() {
    let number = Math.floor(Math.random() * 10000);
    let order = number.toString().split('').join('-');
    return order;
}

function generateReferralCode(length = 8) {
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let referralCode = '';
    for (let i = 0; i < length; i++) {
        const randomIndex = Math.floor(Math.random() * characters.length);
        referralCode += characters[randomIndex];
    }
    return referralCode;
}

const sendOTP = async (email, otp) => {
    try {
        const transporter = nodemailer.createTransport({
            service: 'gmail',
            host: 'smtp.gmail.com',
            port: 587,
            secure: false,
            requireTLS: true,
            auth: {
                user: process.env.USER_EMAIL,
                pass: process.env.MAIL_PASSWORD,
            }
        })
        const mailOptions = {
            from: {
                name: "men's made",
                address: process.env.USER_EMAIL
            },
            to: email,
            subject: 'Sending email',
            text: 'hello world',
            html: `<p>Your OTP for email verification is <strong>${otp}</strong>this OTP is valid for 10 minutes</p>`
        }

        await transporter.sendMail(mailOptions);
    }
    catch (error) {
        console.log(error.message);
    }
}

const securePassword = async (password) => {
    try {
        const hashpassword = await bcrypt.hash(password, 10);
        return hashpassword;
    } catch (error) {
        console.log(error.message)
    }
}

const signup = async (req, res) => {
    try {
        res.render('signup');
    } catch (error) {
        res.render('404')
    }
}

const insertUser = async (req, res) => {
    try {

        const { username, useremail, mobilenumber, password, referralCode } = req.body;

        const secretpassword = await securePassword(password);

        const otp = generateOTP();

        const user = { username, useremail, mobilenumber, secretpassword, referralCode, otp }
        req.session.Data = user;

        req.session.save();

        if (user) {

            await sendOTP(useremail, otp);
            req.session.Data['otpexpiry'] = otpExpiryTime();
            req.session.save();
        }
        res.redirect('/otp')
    } catch (error) {
        console.log(error.message);
    }
}

const loadOTP = async (req, res) => {
    try {
        res.render('otp');
    } catch (error) {
        console.log(error.message);
    }
}


const verifyOTP = async (req, res) => {
    try {
        const otptimer = new Date(req.session.Data.otpexpiry);
        const now = new Date();
        const OTP = req.query.OTP;
        const newReferralCode = generateReferralCode();


        if (req.session.Data.otp == OTP && otptimer > now) {

            const user = new customer({
                name: req.session.Data.username,
                email: req.session.Data.useremail,
                phoneNumber: req.session.Data.mobilenumber,
                password: req.session.Data.secretpassword,
                is_verified: 0,
                referralCode: newReferralCode
            })
            await user.save();


            const userWishList = new wishList({
                user: user._id
            })
            const userCart = new cart({
                userId: user._id
            })

            await userCart.save();
            await userWishList.save();

            if (req.session.Data.referralCode) {
                const referral = req.session.Data.referralCode.toUpperCase();
                const otherUser = await customer.findOne({ referralCode: referral });

                const userWallet = new Wallet({
                    user: user._id,
                    walletBalance: 100,
                    transactionHistory: [{
                        createdAt: Date.now(),
                        paymentType: "Referral",
                        transactionMode: "credited",
                        transactionAmount: 100
                    }],
                    totalRefund: 0
                });
                await userWallet.save();

                const referredUserWallet = await Wallet.findOne({ user: otherUser._id });

                const transactionDetail = {
                    createdAt: Date.now(),
                    paymentType: "Referral",
                    transactionMode: 'credited',
                    transactionAmount: 100
                }
                referredUserWallet.transactionHistory.push(transactionDetail);
                referredUserWallet.walletBalance += 100;

                await referredUserWallet.save()

            } else {
                const userWallet = new Wallet({
                    user: user._id,
                });
                await userWallet.save();
            }
            res.status(200).json({ success: true, message: 'successfully registered' });
        }
        else {
            res.status(400).json({ success: false, message: 'Incorrect OTP. Please try again.' });
        }
    } catch (error) {
        console.log(error.message);
    }
}


const Resend = async (req, res) => {
    try {
        const newotp = generateOTP();
        const { useremail } = req.session.Data;
        sendOTP(useremail, newotp);
        const newotpexpiry = otpExpiryTime();
        req.session.Data.otp = newotp;
        req.session.Data.otpexpiry = newotpexpiry;
        await req.session.save();
        res.status(200).json({ success: true, message: 'otp sent successfully' });

    } catch (error) {
        console.log(error.message);
    }
}

const loadLogin = async (req, res) => {
    try {
        res.render('login');
    } catch (error) {
        res.render('404');
    }
};

const verifyLogin = async (req, res) => {
    try {

        const Email = req.body.Customeremail;

        const password = req.body.Customerpassword;

        const userData = await customer.findOne({ email: Email });
        if (userData != null) {


            const samepassword = await bcrypt.compare(password, userData.password);
            if (samepassword) {
                if (userData.is_blocked === false) {
                    req.session.user_id = userData._id;
                    res.redirect('home');
                }
                else {
                    res.render('login', { message: 'user is blocked' });
                }
            } else {
                res.render('login', { message: 'Wrong Password' })
            }
        }
        else {

            res.render('login', { message: 'user not exsist' })
        }


    } catch (error) {
        res.render('404');
    }
}

const googleSignIn = async (req, res) => {
    try {
        const { displayName, email } = req.body.userData;

        const existingUser = await customer.findOne({ email: email });
        if (existingUser != null) {
            if (existingUser.is_blocked == false) {
                req.session.user_id = existingUser._id;
                res.status(200).send('User data received successfully');
            }
        } else {
            const newReferralCode = generateReferralCode();
            const newUser = new customer({
                name: displayName,
                email: email,
                referralCode: newReferralCode
            });
            await newUser.save();
            if (newUser) {
                const userWallet = new Wallet({
                    user: newUser._id,
                });
                const userWishList = new wishList({
                    user: newUser._id
                })
                const userCart = new cart({
                    userId: newUser._id
                })

                await userWallet.save();
                await userWishList.save();
                await userCart.save();

                req.session.user_id = newUser._id;
                res.status(200).send('User data received successfully');
            }
        }

    } catch (error) {
        console.error('Error in googleSignIn:', error);
        res.status(500).send('Server error');
    }
};


const userlogout = async (req, res) => {
    try {
        req.session.destroy((err) => {
            if (err) {
                console.error("Error destroying session", err);
            }
            res.redirect("/login");
        })
    } catch (error) {
        console.log(error.message);
    }
}


const forgot = async (req, res) => {
    try {
        res.render('forgotpassword');
    } catch (error) {
        console.log(error.message);
    }
}

const sendEmail = async (req, res) => {
    try {
        const { email } = req.body;
        if (email) {
            const otp = generateOTP();
            const otpexpiry = otpExpiryTime();
            await sendOTP(email, otp);
            console.log("otp is ",otp);
            const otpdata = { email, otp, otpexpiry }
            req.session.Data = otpdata;
            res.redirect('newPassword');
        }
        
    } catch (error) {
        console.log(error.message);
    }
}

const newPassword = async (req, res) => {
    try {
        res.render('newPassword');
    } catch (error) {
        console.log(error.message);
    }
}

const updatePassword = async (req, res) => {
    try {
        const { otp, newPassword } = req.body;
        console.log("otp is ",otp,"new password is",newPassword );

        const expiryTime = new Date(req.session.Data.otpexpiry);
        const now = new Date();
        const Email = req.session.Data.email;


        if (otp === req.session.Data.otp && expiryTime > now) {

            const recentPassword = await securePassword(newPassword);

            const data = await customer.findOne({ email: Email });

            const userData = await customer.findByIdAndUpdate({ _id: data._id }, {
                password: recentPassword
            })

            if (userData) {
                res.redirect('login');
            }
        }else{
            res.render('newPassword',{message:"OTP invalid"});
        }

    } catch (error) {
        console.log(error.message);
    }
}


const loadHome = async (req, res) => {
    try {
        const productdata = await Product.find({ is_listed: true });

        res.render('home', { products: productdata });

    } catch (error) {
        console.log(error.message);
    }
}

const ShopPage = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const productsPerPage = 8;
        const skip = (page - 1) * productsPerPage;

        const { brand: selectedBrand, category: selectedCategory, sort: selectedSort, search: searchQuery } = req.query;

        let filter = {is_listed:true};

        if (selectedCategory) {
            filter.productcategory = selectedCategory;
        }

        if (selectedBrand) {
            filter.brand = selectedBrand;
        }

        if (searchQuery && searchQuery.trim() !== '') {
            filter.$or = [
                { productName: { $regex: searchQuery, $options: 'i' } },
                { brand: { $regex: searchQuery, $options: 'i' } }
            ];
        }

        let sort = {};
        switch (selectedSort) {
            case 'price_asc':
                sort.price = 1;
                break;
            case 'price_desc':
                sort.price = -1;
                break;
            case 'A to Z':
                sort.productname = 1;
                break;
            case 'Z to A':
                sort.productname = -1;
                break;
            default:
                break; 
        }

        const [totalProducts, productList, categories, brands] = await Promise.all([
            Product.countDocuments(filter),
            Product.find(filter).skip(skip).limit(productsPerPage).sort(sort).lean(),
            category.find().lean(),
            Product.distinct('brand')
        ]);

        const totalPages = Math.ceil(totalProducts / productsPerPage);


        if (req.xhr || req.headers.accept.indexOf('json') > -1) {
            res.render('partials/productList', {
                product: productList,
                currentPage: page,
                totalPages,
                selectedBrand,
                selectedCategory,
                selectedSort,
                searchQuery
            });
        } else {
            res.render('shopPage', {
                product: productList,
                categories,
                brands,
                currentPage: page,
                totalPages,
                selectedBrand,
                selectedCategory,
                selectedSort,
                searchQuery
            });
        }
    } catch (error) {
        console.error('Error in ShopPage:', error);
        res.status(500).send('Server Error: ' + error.message);
    }
};

const filterProducts = async (req, res) => {
    try {
        const { brand = [], category, sort, search, page = 1 } = req.body;
        const productsPerPage = 8;

        let filter = {is_listed:true};


        if (category) {
            filter.productcategory = category;
        }
    
        if (brand.length > 0) {
            filter.brand = { $in: brand }; 
        }

        if (search && search.trim() !== '') {
            filter.$or = [
                { productname: { $regex: search, $options: 'i' } },
                { productcategory: { $regex: search, $options: 'i' } }
            ];
        }


        let sortCriteria = {};
        switch (sort) {
            case 'price_asc':
                sortCriteria = { offerPrice: 1 };
                break;
            case 'price_desc':
                sortCriteria = { offerPrice: -1 };
                break;
            case 'A to Z':
                sortCriteria = { productname: 1 };
                break;
            case 'Z to A':
                sortCriteria = { productname: -1 };
                break;
            default:
                break;
        }


        const productList = await Product.find(filter)
            .collation({ locale: 'en', strength: 2 })
            .sort(sortCriteria)
            .skip((page - 1) * productsPerPage)
            .limit(productsPerPage)
            .lean();

        const totalProducts = await Product.countDocuments(filter); 
        const totalPages = Math.ceil(totalProducts / productsPerPage);

        res.json({ productList, totalPages, currentPage: page });

    } catch (error) {
        console.error('Error in filterProducts:', error);
        res.status(500).json({ message: 'Server Error: ' + error.message });
    }
};



const productpage = async (req, res) => {
    try {

        const Id = req.query.id;

        const data = await Product.findById({ _id: Id });

        const prodata = await Product.find();

        res.render('productPage', { productData: data, product: prodata });

    } catch (error) {
        console.log(error.message);
    }
}
const wishListPage = async (req, res) => {
    try {
        const userId = req.session.user_id;
        const wishListData = await wishList.findOne({ user: userId }).populate('products.product');
        res.render('wishList', { productData: wishListData })

    } catch (error) {

        console.log(error)

    }
}

const addTowishList = async (req, res) => {
    try {
        const userId = req.session.user_id;
        const productId = req.body.id;

        const wishListDetail = await wishList.findOne({ user: userId });

        if (wishListDetail === null) {

            const wishListData = new wishList({
                user: userId,
                products: [{ product: productId }]
            });

            await wishListData.save();

            res.status(200).json({ success: true });
        } else {
            const productExists = wishListDetail.products.find(item => item.product.toString() === productId);

            if (!productExists) {
                wishListDetail.products.push({ product: productId });
                await wishListDetail.save();
                res.status(200).json({ success: true });
            } else {
                res.status(400).json({ success: false, message: 'Product already in wishlist' });
            }
        }
    } catch (error) {
        console.log(error.message);
        res.status(500).json({ success: false, message: error.message });
    }
}

const userProfile = async (req, res) => {
    try {
        const id = req.session.user_id;
        const userData = await customer.findById({ _id: id });
        res.render('userProfile', { user: userData });
    } catch (error) {
        console.log(error.message);
    }
}

const orderPage = async (req, res) => {
    try {
        userId = req.session.user_id;
        const orderData = await orders.find({ userId: userId });
        res.render('orders', { orderData: orderData });
    } catch (error) {
        console.log(error.message);
    }
}


const editUserpage = async (req, res) => {
    try {
        const id = req.query.id;
        const userData = await customer.findById({ _id: id })
        res.render('editUser', { user: userData });
    } catch (error) {
        console.log(error.message);
    }
}

const updateUser = async (req, res) => {
    try {
        const { userName, phoneNo } = req.body;
        const id = req.session.user_id;
        const userData = await customer.findByIdAndUpdate({ _id: id }, {
            name: userName,
            phoneNumber: phoneNo
        })
        if (userData) {
            res.redirect('userProfile');
        }
    } catch (error) {
        console.log(error.message);
    }
}

const passwordPage = async (req, res) => {
    try {
        res.render('passwordPage');
    } catch (error) {
        console.log(error.message);
    }
}

const changePassword = async (req, res) => {
    try {
        const { currentPassword, newPassword, confirmPassword } = req.body;
        const id = req.session.user_id;
        const data = await customer.findById({ _id: id });
        const { password } = data;

        const check = await bcrypt.compare(currentPassword, password);

        if (check === true && newPassword === confirmPassword) {

            const final = await securePassword(confirmPassword);

            const userData = await customer.findByIdAndUpdate({ _id: id }, {

                password: final
            })

            if (userData) {

                res.redirect('/userProfile');
            }

        } else {
            res.render('passwordPage', { message: 'password is wrong' });
        }
    } catch (error) {
        console.log(error.message);
    }
}


const addCoupon = async (req, res) => {

    try {
        const userId = req.session.user_id;

        const { couponId, cartId } = req.body

        const cartData = await cart.findById({ _id: cartId });

        const couponData = await Coupon.findOne({ couponId: couponId });

        if(couponData != null){
            let couponAmount = null;
        if (couponData.expireDate > Date.now()) {
            cartData.total -= couponData.maximumDiscount;
            
            const total = cartData.total;

            couponAmount = couponData.maximumDiscount;

            await cartData.save();

            res.status(200).json({ success: true, total: total ,couponAmount});
        }
        else {
            res.status(400).json({ success: false, text: 'coupon is expired'});
        }
        }else{
            res.status(400).json({ success:false ,text:"coupon is invalid" });
        }

        

    } catch (error) {

        console.log(error);

    }
}

const removeCoupon = async (req, res) => {
    try {

        const { couponId, cartId } = req.body;

        const cartData = await cart.findById({ _id: cartId });
        const couponData = await Coupon.findOne({ couponId: couponId });

        cartData.total += couponData.maximumDiscount;
        const total = cartData.total

        await cartData.save();

        res.status(200).json({ success: true, total: total });

    } catch (error) {

        console.log(error);

    }
}


const removeWishList = async (req, res) => {
    try {

        const { id } = req.body;

        const userId = req.session.user_id;

        const userWishList = await wishList.findOne({ user: userId });

        const itemIndex = userWishList.products.findIndex(item => item.product.toString() === id);

        userWishList.products.splice(itemIndex, 1);

        await userWishList.save();

        res.status(200).json({ succes: true });


    } catch (error) {

        console.log(error);
    }
}

const walletPage = async (req, res) => {
    try {
        const userId = req.session.user_id;
        const userWallet = await Wallet.findOne({ user: userId });
        res.render('wallet', { walletData: userWallet });
    } catch (error) {

    }
}

const addWalletAmount = async (req, res) => {
    try {
        const { amount } = req.body;

        var options = {
            amount: amount * 100,
            currency: "INR",
            receipt: "order_rcptid_" + Date.now()
        };

        instance.orders.create(options, function (err, order) {
            if (err) {
                console.error('Error creating order:', err);
                return res.status(500).json({ success: false, error: 'Failed to create order' });
            }
            res.status(200).json({ success: true, order: order });
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, error: 'Internal server error' });
    }
}

const verifyWalletAmount = async (req, res) => {
    try {
        const { amount, response } = req.body;
        const userId = req.session.user_id;
        let hmac = crypto.createHmac('sha256', 'kuTpuvH0alcJCKencU1E4L8N')
        hmac.update(response.razorpay_order_id + "|" + response.razorpay_payment_id)
        hmac = hmac.digest('hex');
        if (hmac == response.razorpay_signature) {
            const userWallet = await Wallet.findOne({ user: userId });
            if (!userWallet) {
                return res.status(404).json({ message: 'User wallet not found' });
            }
            userWallet.walletBalance += parseFloat(amount);
            const history = {
                createdAt: Date.now(),
                paymentType: 'Added',
                transactionMode: 'Credited',
                transactionAmount: parseFloat(amount)
            }

            userWallet.transactionHistory.push(history);

            await userWallet.save();
            res.status(200).json({ message: 'Amount added to wallet successfully' });
        } else {
            res.status(400).json({ message: 'Invalid signature' });
        }

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Internal server error' });
    }
}

const walletPayment = async (req, res) => {

    try {
        const userId = req.session.user_id;
        const { cartId, addressId, paymentOption, couponId } = req.body;

        const userCart = await cart.findById(cartId).populate('items.product');
        const orderNumber = generateOrder();
        const userWallet = await Wallet.findOne({ user: userId });
        if (userWallet.walletBalance >= userCart.total) {
            userWallet.walletBalance -= userCart.total;
            const paymentData = {
                createdAt: Date.now(),
                paymentType: 'Purchased',
                transactionMode: 'Debited',
                transactionAmount: userCart.total
            }
            userWallet.transactionHistory.push(paymentData);
            await userWallet.save();

            const orderProduct = userCart.items.map((cartItem) => ({
                product: cartItem.product,
                size: cartItem.size,
                quantity: cartItem.quantity,
                price: cartItem.subTotal
            }))

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
                payment: paymentOption
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
                res.status(200).json({ message: 'order placed successfully',orderId });
                userCart.items = [];
                userCart.total = 0;
                userCart.save();
            }
        } else {
            res.status(500).json({ message: 'Insufficient balance' });
        }
    } catch (error) {

        console.log(error);

    }
}

module.exports = {
    landingPage,
    landingShopPage,
    landingProductPage,
    signup,
    insertUser,
    loadOTP,
    verifyOTP,
    loadLogin,
    loadHome,
    verifyLogin,
    Resend,
    googleSignIn,
    userlogout,
    productpage,
    userProfile,
    forgot,
    sendEmail,
    newPassword,
    updatePassword,
    userProfile,
    orderPage,
    editUserpage,
    updateUser,
    passwordPage,
    changePassword,
    ShopPage,
    filterProducts,
    addCoupon,
    removeCoupon,
    wishListPage,
    addTowishList,
    removeWishList,
    walletPage,
    addWalletAmount,
    verifyWalletAmount,
    walletPayment
};

