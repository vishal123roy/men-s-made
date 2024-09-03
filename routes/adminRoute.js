const express = require('express');
const admin_Route = express();

const auth = require('../middleware/adminAuth');

const bodyParser = require('body-parser');

const adminController = require('../controllers/adminController');


const multer = require('multer');
const path = require('path');

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
      cb(null, 'public/product_Assets/') 
    },
    filename: function (req, file, cb) {
        const name=Date.now() + '-' + file.originalname
      cb(null, name) 
    }
  })
const upload = multer({ storage: storage });

admin_Route.set('view engine','ejs');

admin_Route.set('views','./views/admin');

admin_Route.use(bodyParser.json());

admin_Route.use(bodyParser.urlencoded({extended:true}));

admin_Route.get('/login',auth.isLogout,adminController.adminlogin);

admin_Route.post('/adminverify',adminController.adminverify);

admin_Route.get('/logout',auth.isLogin,adminController.adminLogout);

admin_Route.get('/home',auth.isLogin,adminController.adminhome);

admin_Route.post('/filterChart',auth.isLogin,adminController.filterChart);

admin_Route.get('/productlist',auth.isLogin,adminController.productlistpage);

admin_Route.get('/addproduct',auth.isLogin,adminController.addproductpage);

admin_Route.post('/insert',upload.array('image',3),adminController.insertproduct);

admin_Route.get('/updateproduct',auth.isLogin,adminController.editproductpage);

admin_Route.post('/productImageRemove',auth.isLogin,adminController.removeImage)

admin_Route.get('/block',adminController.blockproduct);

admin_Route.post('/update',upload.array('images',3),adminController.updateproduct);

admin_Route.get('/Category',auth.isLogin,adminController.categorypage);

admin_Route.post('/add',auth.isLogin,adminController.addCategory)

admin_Route.get('/editcategory',auth.isLogin,adminController.editcategorypage);

admin_Route.post('/edit',adminController.editcategory);

admin_Route.post('/enable',adminController.enableDisable);

admin_Route.get('/userlist',auth.isLogin,adminController.userlistpage);

admin_Route.get('/blockuser',auth.isLogin,adminController.blockUnblock);

admin_Route.get('/orderList',auth.isLogin,adminController.orderPage);

admin_Route.get('/orderDetails',auth.isLogin,adminController.orderDetails);

admin_Route.put('/changeStatus/:orderId',auth.isLogin,adminController.changeStatus);

admin_Route.get('/CouponList',auth.isLogin,adminController.couponListPage);

admin_Route.get('/addCoupon',auth.isLogin,adminController.addCouponPage);

admin_Route.post('/createCoupon',auth.isLogin,adminController.createCoupon);

admin_Route.post('/deleteCoupon',auth.isLogin,adminController.deleteCoupon);

admin_Route.get('/editCoupon',auth.isLogin,adminController.editCouponPage);

admin_Route.get('/offerPage',auth.isLogin,adminController.offerPage);

admin_Route.post('/addOfferPrice',auth.isLogin,adminController.addOfferPrice);

admin_Route.post('/editOfferPrice',auth.isLogin,adminController.editOfferPrice);

admin_Route.post('/applyDiscount/:categoryId',auth.isLogin,adminController.addDiscountCategory);

admin_Route.get('/salesReport',auth.isLogin,adminController.salesReportPage);

admin_Route.post('/filterReport',auth.isLogin,adminController.filterReport);

admin_Route.post('/customfilterReport',auth.isLogin,adminController.customFilterReport);


module.exports = admin_Route;
