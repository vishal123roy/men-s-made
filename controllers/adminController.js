const User = require('../models/userModel');
const Product = require('../models/productModel');
const Category = require('../models/categorymodel');
const orders = require('../models/orderModel');
const bcrypt = require("bcrypt");
const Coupon = require('../models/couponModel');
const { orderDetail } = require('./userController');
const Wallet = require('../models/walletModel');


const adminlogin = async (req, res) => {
    try {
        res.render('adminlogin');
    }
    catch (error) {
        console.log(error.message);
    }
}

const adminverify = async (req, res) => {
    try {
        const { email, password } = req.body;
        const userData = await User.findOne({ email: email });


        if (userData != null) {
            req.session.admin_id = userData._id;

            const checkpassword = await bcrypt.compare(password, userData.password);

            if (checkpassword == true && userData.is_verified === 1) {
                res.redirect('/admin/home');
            }
            else {
                res.render('adminlogin', { message: 'wrong password' });
            }
        } else {
            res.render('adminlogin', { message: 'admin not exist' });
        }

    }
    catch (error) {
        console.log(error.message);
    }
}

const adminLogout = async (req, res) => {
    try {
        req.session.destroy((err) => {
            if (err) {
                console.error("error destroying session").err;
            }
            res.redirect("/admin/login");
        })

    } catch (error) {

        console.log(error)

    }
}


const adminhome = async (req, res) => {
    try {

        const userData = await User.findById(req.session.user_id);

        const currentDate = new Date();
        const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
        firstDayOfMonth.setUTCHours(0, 0, 0, 0);

        const lastDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
        lastDayOfMonth.setUTCHours(23, 59, 59, 999);

        const ordersInMonth = await orders.find({
            status: { $in: ['pending', 'delivered', 'canceled', 'returned', 'Return pending'] },
            orderDate: { $gte: firstDayOfMonth, $lte: lastDayOfMonth }
        });

        const daysInMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate();
        const yValues = Array(daysInMonth).fill(0);

        ordersInMonth.forEach(order => {
            const day = new Date(order.orderDate).getDate();
            yValues[day - 1] += order.totalAmount || 0;
        });

        const monthlySale = yValues.reduce((total, value) => total + value, 0);

        const allOrders = await orders.find();
        const yValue = [0, 0, 0, 0, 0, 0, 0];

        allOrders.forEach(order => {
            const statusMap = {
                'pending': 0,
                'delivered': 1,
                'canceled': 2,
                'returned': 3,
                'Return pending': 4
            };
            yValue[statusMap[order.status]] += 1;
        });

        const totalOrderCount = await orders.countDocuments({
            status: { $nin: ['failed'] }
        });
        const totalProductCount = await Product.countDocuments();
        const totalCategoryCount = await Category.countDocuments();

        const topSellingProducts = await Product.find()
            .sort({ popularity: -1 })
            .limit(10);

        const topSellingCategories = await Product.aggregate([
            { $sort: { popularity: -1 } },
            { $group: { _id: "$productcategory", totalPopularity: { $sum: "$popularity" } } },
            { $sort: { totalPopularity: -1 } },
            { $limit: 10 }
        ]);

        const categories = await Category.find({ is_active: true }).exec();

        const topSellingMap = new Map(topSellingCategories.map(category => [category._id, category.totalPopularity]));

        const sortedCategories = categories.map(category => ({
            name: category.name,
            description: category.description,
            is_active: category.is_active,
            totalPopularity: topSellingMap.get(category.name) || 0
        }));

        sortedCategories.sort((a, b) => b.totalPopularity - a.totalPopularity);



        res.render('adminhome', {
            admin: userData,
            yValues,
            yValue,
            totalProductCount,
            totalCategoryCount,
            totalOrderCount,
            topSellingProducts,
            sortedCategories
        });
    } catch (error) {
        console.log(error.message);
        res.status(500).send("Internal Server Error");
    }
};


const filterChart = async (req, res) => {
    try {

        const choice = req.body.chooseValue;
        const currentDate = new Date();

        if (choice === 'currentMonth') {
            const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
            firstDayOfMonth.setUTCHours(0, 0, 0, 0);

            const lastDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
            lastDayOfMonth.setUTCHours(23, 59, 59, 999);

            const orders = await getOrdersWithinDateRange(firstDayOfMonth, lastDayOfMonth);

            const daysInMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate();
            const yValues = Array(daysInMonth).fill(0);

            orders.forEach(item => {
                const dayOfMonth = new Date(item.orderDate).getDate();
                yValues[dayOfMonth - 1] += item.totalAmount;
            });

            const Data = createChartData(yValues, daysInMonth);
            res.status(200).json({ success: Data });

        } else if (choice === 'monthly') {
            const financialYearStart = new Date(currentDate.getFullYear(), 3, 1);
            const financialYearEnd = new Date(currentDate.getFullYear() + 1, 2, 31);

            const orders = await getOrdersWithinDateRange(financialYearStart, financialYearEnd);

            const monthlySales = Array(12).fill(0);

            orders.forEach(item => {
                let month = new Date(item.orderDate).getMonth();
                month = (month + 9) % 12;
                monthlySales[month] += item.totalAmount;
            });

            const Data = createChartData(monthlySales, 12, true);
            res.status(200).json({ success: Data });

        } else if (choice === 'weekly') {
            const startOfWeek = new Date(currentDate);
            startOfWeek.setDate(currentDate.getDate() - currentDate.getDay());
            startOfWeek.setUTCHours(0, 0, 0, 0);

            const endOfWeek = new Date(startOfWeek);
            endOfWeek.setDate(startOfWeek.getDate() + 6);
            endOfWeek.setUTCHours(23, 59, 59, 999);

            const orders = await getOrdersWithinDateRange(startOfWeek, endOfWeek);

            const yValues = Array(7).fill(0);

            orders.forEach(item => {
                const dayOfWeek = new Date(item.orderDate).getDay();
                yValues[dayOfWeek] += item.totalAmount;
            });

            const Data = createChartData(yValues, 7, false, true);
            res.status(200).json({ success: Data });
        }

    } catch (error) {
        console.log(error.message);
        res.status(500).json({ message: 'Internal Server Error' });
    }
};

async function getOrdersWithinDateRange(startDate, endDate) {
    return await orders.aggregate([
        {
            $match: {
                status: { $in: ['pending', 'delivered', 'canceled', 'returned', 'Return pending'] },
                orderDate: { $gte: startDate, $lte: endDate }
            }
        }
    ]);
}

function createChartData(yValues, numBars, isMonthly = false, isWeekly = false) {
    const barColors = generateBarColors(numBars);
    const xValues = [];

    if (isMonthly) {
        const monthNames = ['Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec', 'Jan', 'Feb', 'Mar'];
        xValues.push(...monthNames);
    } else if (isWeekly) {
        const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        xValues.push(...dayNames);
    } else {
        for (let i = 1; i <= numBars; i++) {
            xValues.push(i.toString());
        }
    }

    return { xValues, yValues, barColors };
}

function generateBarColors(numBars) {
    const barColors = [];
    const hueStep = 360 / numBars;
    for (let i = 0; i < numBars; i++) {
        const hue = i * hueStep;
        const color = `hsl(${hue}, 70%, 50%)`;
        barColors.push(color);
    }
    return barColors;
}




const userlistpage = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = 10;
        const skip = (page - 1) * limit;

        const totalUsers = await User.countDocuments({ is_verified: 0 });

        const userdata = await User.find({ is_verified: 0 })
            .skip(skip)
            .limit(limit);

        const totalPages = Math.ceil(totalUsers / limit);

        res.render('userlist', {
            users: userdata,
            currentPage: page,
            totalPages: totalPages
        });
    } catch (error) {
        console.log(error.message);
    }
}

const blockUnblock = async (req, res) => {
    try {

        const id = req.query.user;

        const userData = await User.findById({ _id: id });

        if (userData.is_blocked === false) {
            await User.findByIdAndUpdate(id, { is_blocked: true });
            res.redirect('/admin/userlist');
        }
        else {
            await User.findByIdAndUpdate(id, { is_blocked: false });
            res.redirect('/admin/userlist');
        }

    } catch (error) {
        console.log(error.message);
    }
}

const productlistpage = async (req, res) => {
    try {
        const { status, page = 1, limit = 10 } = req.query;
        const pageNumber = parseInt(page);
        const limitNumber = parseInt(limit);

        let query = {};

        // Filter based on status
        if (status === 'Active') {
            query.is_listed = true;
        } else if (status === 'Inactive') {
            query.is_listed = false;
        }

        // Calculate total documents and pages
        const totalProducts = await Product.countDocuments(query);
        const totalPages = Math.ceil(totalProducts / limitNumber);

        // Fetch products for the current page
        const productdata = await Product.find(query).sort({ createdAt: -1 })
            .skip((pageNumber - 1) * limitNumber)
            .limit(limitNumber);

        res.render('productlist', {
            products: productdata,
            currentPage: pageNumber,
            totalPages: totalPages,
            status: status
        });
    } catch (error) {
        console.log(error.message);
        res.status(500).send("Server Error");
    }
};

const addproductpage = async (req, res) => {
    try {
        const data = await Category.find();

        res.render('addproduct', { categories: data });
    } catch (error) {
        console.log(error.message);
    }
}

const editproductpage = async (req, res) => {
    try {
        const Id = req.query.id;

        const data = await Product.findById({ _id: Id })
        const categorydata = await Category.find();
        res.render('updateproduct', { prodata: data, category: categorydata });
    } catch (error) {
        console.log(error.message);
    }
}



const updateproduct = async (req, res) => {
    try {
        let id = req.query.id;
        function obj(size, quantity) {
            this.size = size;
            this.quantity = quantity;
        }
        const { product_title, product_brand, price, category, description, sizes } = req.body;
        let productsize = [];
        for (const key in sizes) {
            productsize.push(new obj(key, sizes[key]))
        }

        const data = await Product.findByIdAndUpdate({ _id: id }, {
            productname: product_title,
            brand: product_brand,
            price: price,
            productcategory: category,
            description: description,
            sizes: productsize
        })

        const Images = req.files.map(file => file.filename);
        for (let i = 0; i < Images.length; i++) {
            data.images.push(Images[i]);
        }
        // data.images.push(Images);
        await data.save();


        if (data) {
            res.redirect('/admin/productlist')
        }
    } catch (error) {
        console.log(error.message);
    };
}

const removeImage = async (req, res) => {

    const { productId, index } = req.body;


    const productData = await Product.findById({ _id: productId });

    productData.images.splice(index, 1);

    await productData.save();

    res.status(200).json({ success: true });

}

const insertproduct = async (req, res) => {
    try {

        const { product_title, product_brand, price, offerPrice, category, description, sizes } = req.body;

        function obj(size, quantity) {
            this.size = size;
            this.quantity = quantity;
        }
        let productsize = [];
        for (const key in sizes) {
            productsize.push(new obj(key, sizes[key]))
        }
        const images = req.files.map(file => file.filename);

        const productdetail = new Product({
            productname: product_title,
            brand: product_brand,
            price: price,
            offerPrice: offerPrice,
            productcategory: category,
            description: description,
            images: images,
            sizes: productsize,
        })

        await productdetail.save();
        if (productdetail) {
            res.redirect('/admin/productlist');
        }
    } catch (error) {
        console.log(error.message);
    }
}

const blockproduct = async (req, res) => {
    try {
        const Id = req.query.id;
        const data = await Product.findById({ _id: Id });
        if (data.is_listed === true) {
            const data = await Product.findByIdAndUpdate({ _id: Id }, {
                is_listed: false
            });
            if (data) {
                res.redirect('/admin/productlist')
            }

        } else {
            const data = await Product.findByIdAndUpdate({ _id: Id }, {
                is_listed: true
            });
            if (data) {
                res.redirect('/admin/productlist');

            }
        }
    } catch (error) {
        console.log(error.message);
    }
}

const categorypage = async (req, res) => {
    try {
        const data = await Category.find();
        res.render('addcategory', { categories: data });
    }
    catch (error) {
        console.log(error.message)
    }
}

const addCategory = async (req, res) => {
    try {
        const { categoryname, description } = req.body;

        const LowerCatName = categoryname.toLowerCase();

        const existingCategory = await Category.findOne({
            name: { $regex: new RegExp(`^${LowerCatName}$`, 'i') }
        });

        if (!existingCategory) {
            const newCategory = new Category({
                name: categoryname,
                description: description,
            });

            await newCategory.save();

            res.status(200).json({ success: true, message: 'Category added successfully' });
        } else {
            res.status(400).json({ success: false, message: 'Category already exists' });
        }
    } catch (error) {
        console.error('Error adding category:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
};

const editcategorypage = async (req, res) => {
    try {
        const id = req.query.id;

        const data = await Category.findById({ _id: id })

        res.render('editcategory', { category: data });

    } catch (error) {
        console.log(error.message);
    }
}

const editcategory = async (req, res) => {
    try {

        const id = req.query.id;

        const { name, description } = req.body;

        const data = await Category.findOne({ _id: id });

        const newData = await Category.findOne({ name: name });

        if (newData == null) {

            const categoryName = data.name;

            const productData = await Product.updateMany({ productcategory: categoryName },
                { $set: { productcategory: name } });

            if (productData) {
                data.name = name;
                data.description = description;
                await data.save();
                res.redirect('/admin/Category');
            }
        } else {
            res.render('editcategory', { category: data, message: 'category already exist' });
        }

    } catch (error) {
        console.log(error.message);
    }
}

const enableDisable = async (req, res) => {
    try {

        const { Id } = req.body;

        const data = await Category.findById({ _id: Id })


        if (data.is_active === true) {
            const category = await Category.findByIdAndUpdate({ _id: Id }, {
                is_active: false
            });
            const categoryProduct = await Product.updateMany({ productcategory: data.name },
                { $set: { is_listed: false } });


            if (category) {

                res.status(200).json({ success: true, message: "success" });
            }
            else {
                res.status(400).json({ success: false, message: "false" });
            }
        }
        else {
            const category = await Category.findByIdAndUpdate({ _id: Id }, {
                is_active: true
            })
            const categoryProduct = await Product.updateMany({ productcategory: data.name },
                { $set: { is_listed: true } });
            if (category) {
                res.status(200).json({ success: true, message: 'success' });
            } else {
                res.status(400).json({ success: false, message: 'false' });
            }
        }
    } catch (error) {
        console.log(error.message);
    }
};

const orderPage = async (req, res) => {
    try {
        const { status = 'All', page = 1, limit = 10 } = req.query;

        console.log("status is ", status);

        const pageNumber = parseInt(page, 10);
        const limitNumber = parseInt(limit, 10);

        let query = {};

        if (status !== 'All') {
            query.status = status;
        }


        const skip = (pageNumber - 1) * limitNumber;
        const totalOrders = await orders.countDocuments(query);
        const totalPages = Math.ceil(totalOrders / limitNumber);

        const orderList = await orders.find(query)
            .populate('userId')
            .sort({ orderDate: -1 })
            .skip(skip)
            .limit(limitNumber);

        res.render('orderList', {
            AllOrders: orderList,
            currentPage: pageNumber,
            totalPages: totalPages,
            status: status,
            limit: limitNumber
        });

    } catch (error) {
        console.log(error.message);
        res.status(500).send("Server Error");
    }
};


const orderDetails = async (req, res) => {
    try {
        const id = req.query.id;

        const orderData = await orders.findById(id).populate({
            path: 'items.product',
            model: 'Product'
        })

        const userId = orderData.userId;

        const userData = await User.findById(userId);
        res.render('orderDetails', {
            orderDetails: orderData,
            userDetails: userData
        });
    } catch (error) {
        console.log(error.message);
    }
}

const changeStatus = async (req, res) => {
    try {

        const id = req.params.orderId;

        const action = req.body.action;

        if (action === 'returned') {
            const order = await orders.findByIdAndUpdate({ _id: id }, {
                status: action,
                isReturned: true
            })

            await order.save();

            const updateProduct = order.items.map(async (order) => {

                const product = await Product.findById(order.product._id);
                const sizeObj = product.sizes.find(item => item.size === order.size);
                sizeObj.quantity += order.quantity;
                product.save();
            });

            await Promise.all(updateProduct);

            const userId = order.userId;
            const userWallet = await Wallet.findOne({ user: userId })
            userWallet.walletBalance += parseFloat(order.totalAmount);
            const amountDetail = {
                createdAt: Date.now(),
                paymentType: 'Refund',
                transactionMode: 'Credited',
                transactionAmount: parseFloat(order.totalAmount)
            }
            userWallet.transactionHistory.push(amountDetail);
            await userWallet.save();
            res.status(200).json({ success: true })
        } else {
            const order = await orders.findByIdAndUpdate({ _id: id }, {
                status: action
            });

            if (order) {

                await order.save();
                res.status(200).json({ success: true })

            }
        }

    } catch (error) {
        console.log(error.message);
    }
}

const couponListPage = async (req, res) => {
    try {
        const couponList = await Coupon.find();
        res.render('couponList', { couponData: couponList });

    } catch (error) {

        console.log(error.message);

    }
}

const addCouponPage = async (req, res) => {
    try {

        res.render('addCoupon');

    } catch (error) {

        console.log(error.message);

    }
}

const createCoupon = async (req, res) => {
    try {

        const { couponId, description, maximumDiscount, minimumAmount, maximumAmount, maximumUser, expireDate } = req.body;

        const existingCoupon = await Coupon.findOne({ couponId: couponId })
        if (existingCoupon === null) {

            const couponData = new Coupon({
                couponId: couponId,
                description: description,
                maximumDiscount: maximumDiscount,
                minimumAmount: minimumAmount,
                maximumAmount: maximumAmount,
                maximumUser: maximumUser,
                expireDate: expireDate
            })

            await couponData.save();

            if (couponData) {
                res.status(200).json({ message: 'Coupon created successfully' });
            } else {
                res.status(404).json({ message: 'failed to create coupon' });
            }
        } else {
            res.status(404).json({ message: 'Coupon already exist' });

        }

    } catch (error) {
        console.error('Error creating coupon:', error);
        res.status(500).json({ message: 'Failed to create coupon' });
    }
};

const deleteCoupon = async (req, res) => {
    try {

        const { id } = req.body;
        const couponData = await Coupon.findByIdAndDelete({ _id: id })

        if (couponData) {
            res.status(200).json({ message: 'Coupon deleted successfully' });
        }


    } catch (error) {

        console.log(error);

    }
}

const editCouponPage = async (req, res) => {
    try {

        const id = req.query.id;

        const couponData = await Coupon.findById({ _id: id });

        res.render('editCoupon', { couponData })


    } catch (error) {

        console.log(error)

    }
}

const updateCoupon = async (req, res) => {
    try {
        const { _id, couponId, description, maximumDiscount, minimumAmount, maximumAmount, maximumUser, expireDate } = req.body;

        const couponToUpdate = await Coupon.findById(_id);
        if (!couponToUpdate) {
            return res.status(404).json({ message: 'Coupon not found' });
        }

        const existingCoupon = await Coupon.findOne({ couponId: couponId, _id: { $ne: _id } });
        if (existingCoupon) {
            return res.status(409).json({ message: 'Another coupon with this ID already exists' });
        }

        const updatedCoupon = await Coupon.findByIdAndUpdate(
            _id,
            {
                couponId,
                description,
                maximumDiscount,
                minimumAmount,
                maximumAmount,
                maximumUser,
                expireDate
            },
            { new: true, runValidators: true }
        );

        if (updatedCoupon) {
            res.status(200).json({ message: 'Coupon updated successfully', coupon: updatedCoupon });
        } else {
            res.status(500).json({ message: 'Failed to update coupon' });
        }
    } catch (error) {
        console.error('Error updating coupon:', error);
        res.status(500).json({ message: 'Internal server error', error: error.message });
    }
};

const offerPage = async (req, res) => {
    try {

        const productData = await Product.find();
        const categoryData = await Category.find();

        res.render('offerPage', {
            products: productData,
            categories: categoryData
        })

    } catch (error) {

        console.log(error.message)

    }
}

const addOfferPrice = async (req, res) => {
    try {

        const { productId, offerPrice } = req.body;

        const productData = await Product.findById({ _id: productId });

        productData.offerPrice = offerPrice;

        await productData.save();

        res.status(200).json({ success: true });

    } catch (error) {

        console.log(error.message);

    }
}

const editOfferPrice = async (req, res) => {
    try {

        const { productId, newOfferPrice } = req.body;

        const productData = await Product.findById({ _id: productId });

        productData.offerPrice = newOfferPrice;

        await productData.save();

        res.status(200).json({ success: true });


    } catch (error) {

        console.log(error);

    }
}

const addDiscountCategory = async (req, res) => {
    try {
        const { discountPercentage } = req.body;
        const categoryId = req.params.categoryId;

        const categoryData = await Category.findById(categoryId);
        if (!categoryData) {
            return res.status(404).json({ success: false, message: "Category not found" });
        }

        const categoryName = categoryData.name;

        const products = await Product.find({ productcategory: categoryName });

        const updatePromises = products.map(async (product) => {
            const newPrice = product.price - (product.price * (discountPercentage / 100));
            product.offerPrice = newPrice;
            return product.save();
        });

        await Promise.all(updatePromises);

        res.status(200).json({ success: true, message: "Discount applied successfully" });

    } catch (error) {
        console.error("Error applying discount:", error);
        res.status(500).json({ success: false, message: "An error occurred while applying the discount" });
    }
}
const salesReportPage = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const pageSize = 10;

        const totalOrders = await orders.countDocuments({ status: 'delivered' });

        const deliveredList = await orders.find({ status: 'delivered' })
            .populate({ path: 'items.product', model: 'Product' })
            .populate({ path: 'userId', model: 'customer' })
            .skip((page - 1) * pageSize)
            .limit(pageSize);

        const value = await orders.aggregate([{
            $group: { _id: null, totalSum: { $sum: '$totalAmount' } }
        }]);
        const totalSum = value[0].totalSum;

        const totalPages = Math.ceil(totalOrders / pageSize);

        res.render('salesReport', {
            deliveredList: deliveredList,
            totalSum: totalSum,
            currentPage: page,
            totalPages: totalPages
        });

    } catch (error) {
        console.log(error);
    }
};

const filterReport = async (req, res) => {
    try {
        const option = req.body.option;
        let order;
        let startDate, endDate;

        switch (option) {
            case 'daily':

                startDate = new Date();
                startDate.setUTCHours(0, 0, 0, 0);
                endDate = new Date();
                endDate.setUTCHours(23, 59, 59, 999);
                break;

            case 'weekly':

                startDate = new Date();
                const dayOfWeek = startDate.getUTCDay();  
                const distanceToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
                startDate.setDate(startDate.getDate() - distanceToMonday);
                startDate.setUTCHours(0, 0, 0, 0);
                endDate = new Date();
                endDate.setUTCHours(23, 59, 59, 999);
                break;

            case 'monthly':

                startDate = new Date();
                startDate.setUTCDate(1);  
                startDate.setUTCHours(0, 0, 0, 0);
                endDate = new Date();
                endDate.setUTCHours(23, 59, 59, 999);
                break;

            case 'yearly':
                startDate = new Date();
                startDate.setUTCMonth(0); 
                startDate.setUTCDate(1);    
                startDate.setUTCHours(0, 0, 0, 0);
                endDate = new Date();
                endDate.setUTCHours(23, 59, 59, 999);
                break;

            case 'all':

                order = await orders.find({
                    status: 'delivered'
                }).populate('items.product').populate('userId');
                return res.status(200).json({ success: order });

            default:
                return res.status(400).json({ error: 'Invalid option' });
        }

        order = await orders.find({
            status: 'delivered',
            orderDate: { $gte: startDate, $lte: endDate }
        }).populate('items.product').populate('userId');

        res.status(200).json({ success: order });

    } catch (error) {
        console.error('Error in filterReport:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};


const customFilterReport = async (req, res) => {
    try {
        const { startDate, endDate } = req.body;

        const startOfDay = new Date(startDate);
        const endOfDay = new Date(endDate);
        if (startOfDay < endOfDay) {
            startOfDay.setUTCHours(0, 0, 0, 0);
            endOfDay.setUTCHours(23, 59, 59, 999);

            const order = await orders.find({
                status: 'delivered',
                orderDate: { $gte: startOfDay, $lte: endOfDay }
            }).populate('items.product').populate('userId');

            res.status(200).json({ success: order });
        } else {
            res.status(400).json({ success: false, message: "Invalid Date" });
        }
    } catch (error) {
        console.log(error.message);
        res.status(500).json({ error: 'Internal Server error' });
    }
}

module.exports = {

    adminlogin,
    adminLogout,
    adminhome,
    filterChart,
    adminverify,
    userlistpage,
    blockUnblock,
    productlistpage,
    addproductpage,
    editproductpage,
    updateproduct,
    removeImage,
    insertproduct,
    blockproduct,
    categorypage,
    addCategory,
    editcategorypage,
    editcategory,
    enableDisable,
    orderPage,
    orderDetails,
    changeStatus,
    couponListPage,
    addCouponPage,
    createCoupon,
    deleteCoupon,
    editCouponPage,
    updateCoupon,
    offerPage,
    addOfferPrice,
    editOfferPrice,
    addDiscountCategory,
    salesReportPage,
    filterReport,
    customFilterReport
}

