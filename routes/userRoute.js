const express = require('express');
const userRoute = express();

const bodyParser = require('body-parser');

const userController = require('../controllers/userController');
const addressController = require('../controllers/addressController');
const cartController = require('../controllers/cartController');
const orderController = require('../controllers/orderController');
const auth = require('../middleware/userAuth');

userRoute.set('view engine', 'ejs');

userRoute.set('views','./views/user');

userRoute.use(bodyParser.json());

userRoute.use(bodyParser.urlencoded({ extended: true }));

userRoute.get('/',auth.isLogout,userController.landingPage)

userRoute.get('/landingShop',auth.isLogout,userController.landingShopPage);

userRoute.get('/landingProduct',auth.isLogout,userController.landingProductPage);

userRoute.get('/signup',auth.isLogout,userController.signup);

userRoute.get('/otp',userController.loadOTP);

userRoute.post('/otp',userController.insertUser);

userRoute.post('/verify',userController.verifyOTP);

userRoute.post('/resend',userController.Resend);

userRoute.get('/login',auth.isLogout,userController.loadLogin);

userRoute.post('/googleSignIn',auth.isLogout,userController.googleSignIn);

userRoute.get('/logout',auth.isLogin,userController.userlogout);

userRoute.post('/loginverify',userController.verifyLogin);

userRoute.get('/home',auth.isLogin,userController.loadHome);

userRoute.get('/productPage',auth.isLogin,userController.productpage);

userRoute.get('/userProfile',auth.isLogin,userController.userProfile);

userRoute.get('/forgotpassword',userController.forgot);

userRoute.post('/sendotp',userController.sendEmail);

userRoute.get('/newPassword',userController.newPassword);

userRoute.post('/resetPassword',userController.updatePassword);

userRoute.get('/userProfile',auth.isLogin,userController.userProfile);

userRoute.get('/editUser',auth.isLogin,userController.editUserpage);

userRoute.post('/updateUser',auth.isLogin,auth.isLogin,userController.updateUser);

userRoute.get('/passwordPage',auth.isLogin,userController.passwordPage);

userRoute.post('/changePassword',auth.isLogin,userController.changePassword);

userRoute.get('/orders',auth.isLogin,userController.orderPage);

userRoute.get('/addressList',auth.isLogin,addressController.addressPage);

userRoute.get('/addAddress',auth.isLogin,addressController.addAddresspage);

userRoute.post('/insertAddress',auth.isLogin,addressController.insertAddress);

userRoute.get('/editAddress',auth.isLogin,addressController.editAddresspage);

userRoute.post('/updateAddress',auth.isLogin,addressController.updateAddress);

userRoute.post('/deleteAddress',auth.isLogin,addressController.deleteAddress);

userRoute.get('/shopPage',auth.isLogin,userController.ShopPage);

userRoute.post('/api/filterproducts',auth.isLogin,userController.filterProducts);

userRoute.get('/cartPage',auth.isLogin,cartController.cartPage);

userRoute.get('/addCart/:productId',auth.isLogin,cartController.addTocart);

userRoute.post('/remove-cart',auth.isLogin,cartController.removeCart)

userRoute.patch('/updateQuantity/:productId',cartController.quantityUpdate);

userRoute.get('/checkoutPage',auth.isLogin,cartController.checkoutPage);

userRoute.post('/addCoupon',auth.isLogin,userController.addCoupon);

userRoute.post('/removeCoupon',auth.isLogin,userController.removeCoupon)

userRoute.post('/placeOrder',auth.isLogin,orderController.placeOrder);

userRoute.get('/orderSuccess',auth.isLogin,orderController.orderSuccess);

userRoute.get('/viewOrder',auth.isLogin,orderController.orderDetail);

userRoute.put('/cancelOrder/:orderId',auth.isLogin,orderController.orderCancelation);

userRoute.put('/returnOrder/:orderId',auth.isLogin,orderController.orderReturn);

userRoute.post('/onlinePay',auth.isLogin,orderController.onlinePayment)

userRoute.post('/orderVerify',auth.isLogin,orderController.verifyPayment);

userRoute.post('/paymentFailure',auth.isLogin,orderController.failedPayment);

userRoute.get('/orderFailed',auth.isLogin,orderController.orderFailedPage);

userRoute.post('/retryPayment',auth.isLogin,orderController.retryPayment)

userRoute.post('/verifyRetryPayment',auth.isLogin,orderController.verifyRetryPay);

userRoute.get('/wishList',auth.isLogin,userController.wishListPage);

userRoute.post('/addwishList',auth.isLogin,userController.addTowishList);

userRoute.post('/removeWishList',auth.isLogin,userController.removeWishList);

userRoute.get('/wallet',auth.isLogin,userController.walletPage);

userRoute.post('/addToWallet',auth.isLogin,userController.addWalletAmount);

userRoute.post('/verifyAddAmount',auth.isLogin,userController.verifyWalletAmount);

userRoute.post('/walletPayment',auth.isLogin,orderController.walletPayment);

module.exports = userRoute;