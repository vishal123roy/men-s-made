const express = require('express');
const userRoute = express();

const bodyParser = require('body-parser');

const userController = require('../controllers/userController');

const auth = require('../middleware/userAuth');

userRoute.set('view engine', 'ejs');

userRoute.set('views','./views/user');

userRoute.use(bodyParser.json());

userRoute.use(bodyParser.urlencoded({ extended: true }));

userRoute.get('/',userController.loadLogin);

userRoute.get('/signup',userController.signup);

userRoute.get('/otp',userController.loadOTP);

userRoute.post('/otp',userController.insertUser);

userRoute.post('/verify',userController.verifyOTP);

userRoute.post('/resend',userController.Resend);

userRoute.get('/login',userController.loadLogin);

userRoute.post('/loginverify',userController.verifyLogin);

userRoute.get('/home',userController.loadHome);

userRoute.get('/productPage',userController.productpage);

userRoute.get('/userProfile',userController.userProfile);

userRoute.get('/forgotpassword',userController.forgot);

userRoute.post('/sendotp',userController.sendEmail);

userRoute.get('/newPassword',userController.newPassword);

userRoute.post('/newPassword',userController.updatePassword);

userRoute.get('/userProfile',userController.userProfile);

userRoute.get('/orders',userController.orderpage);

userRoute.get('/trackOrders',userController.trackOrderpage);

userRoute.get('/address',userController.addressPage);



module.exports = userRoute;