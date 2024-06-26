const User = require('../models/userModel');
const Products = require('../models/productModel');
const Category = require('../models/categorymodel');
const bcrypt = require("bcrypt");

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

        req.session.admin_id = userData._id;
        // console.log(userData);
        const checkpassword = await bcrypt.compare(password, userData.password);
        console.log(checkpassword);
        if (checkpassword == true && userData.is_verified === 1) {
            res.redirect('/admin/home');
            console.log('admin log in')
        }
        else {
            res.render('adminlogin', { message: 'admin not found' });
        }
    }
    catch (error) {
        console.log(error.message);
    }
}

const adminhome = async (req, res) => {
    try {
        // console.log('hi0')
        res.render('adminhome');
    }
    catch (error) {
        console.log(error.message);
    }
}

const userlistpage = async (req, res) => {
    try {
        const userdata = await User.find({ is_verified: 0 })
        // console.log(userdata);
        res.render('userlist', { users: userdata });
    } catch (error) {
        console.log(error.message);
    }
}

const blockuser = async (req, res) => {
    try {
        // console.log('hi')
        const id = req.query.user;
        await User.findByIdAndUpdate(id, { is_blocked: true });
        res.redirect('/admin/userlist');
    } catch (error) {
        console.log(error.message);
    }
}

const unblockuser = async (req, res) => {
    const id = req.query.user;
    await User.findByIdAndUpdate(id, { is_blocked: false });
    res.redirect('/admin/userlist');
}

const productlistpage = async (req, res) => {
    try {
        const productdata = await Products.find()
        res.render('productlist', { products: productdata });
    } catch (error) {
        console.log(error.message);
    }
}

const addproductpage = async (req, res) => {
    try {
        const data = await Category.find();
        console.log(data);
        res.render('addproduct', { categories: data });
    } catch (error) {
        console.log(error.message);
    }
}

const editproductpage = async (req, res) => {
    try {
        const Id = req.query.id;
        // console.log(Id);
        const data = await Products.findById({ _id: Id })
        const categorydata = await Category.find();
        // console.log(data);
        res.render('updateproduct', { prodata: data, category: categorydata });
    } catch (error) {
        console.log(error.message);
    }
}

const updateproduct = async(req,res) => {
    try {
        console.log(req.body);
        let id = req.query.id;
        function obj(size, quantity) {
            this.size = size;
            this.quantity = quantity;
        }
        const { product_title, product_brand, price, category, description,sizes,images } = req.body;
        let productsize = [];
        for (const key in sizes) {
            productsize.push(new obj(key, sizes[key]))
        }
        
        const Images = req.files.map(file => file.filename);
        // console.log(Images)
        let finalimages = '';
        if(Images == ''){
            finalimages  = images;
        }
        else{
            finalimages = Images;
        }
        
        console.log(finalimages);

        const data = await Products.findByIdAndUpdate({_id:id},{
            productname: product_title,
            brand: product_brand,
            price: price,
            productcategory: category,
            description: description,
            images: finalimages,
            sizes:productsize
        })
        // console.log(data)
        if(data){
            res.redirect('/admin/productlist')
        }
    } catch (error) {
        console.log(error.message);
    };
}

const insertproduct = async (req, res) => {
    try {

        const { product_title, product_brand, price, category, description, sizes } = req.body;

        // console.log(sizes);
        function obj(size, quantity) {
            this.size = size;
            this.quantity = quantity;
        }
        let productsize = [];
        for (const key in sizes) {
            productsize.push(new obj(key, sizes[key]))
        }
        const images = req.files.map(file => file.filename);

        // console.log(productsize);
        const productdetail = new Products({
            productname: product_title,
            brand: product_brand,
            price: price,
            productcategory: category,
            description: description,
            images: images,
            sizes: productsize,
        })

        await productdetail.save();
        // console.log(productdetail);
        if (productdetail) {
            res.redirect('/admin/productlist');
        } else {
            console.log("data has not been saved");
        }
    } catch (error) {
        console.log(error.message);
    }
}

const blockproduct = async (req, res) => {
    try {
        const Id = req.query.id;
        console.log(Id);
        const data = await Products.findById({ _id: Id });
        if (data.is_listed === true) {
            const data = await Products.findByIdAndUpdate({ _id: Id }, {
                is_listed: false
            });
            if (data) {
                console.log('hi');
                res.redirect('/admin/productlist')
                console.log(data.is_listed);
            }
            
        } else {
            const data = await Products.findByIdAndUpdate({ _id: Id }, {
                is_listed: true
            });
            // console.log('is_listed is false');
            if (data) {
                res.redirect('/admin/productlist');
            console.log(data.is_listed);

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

const addcategory = async (req, res) => {
    try {
        const { categoryname, description } = req.body;

        const categorydata = new Category({
            name: categoryname,
            description: description,
        })

        await categorydata.save();

        if (categorydata) {
            console.log(categorydata);
            // res.redirect('/admin/addcategory');
            res.status(200).json({ success: true, message: 'successful' })
        } else {
            res.status(400).json({ success: false, message: 'not added' })
        }
    }
    catch (error) {

        console.log(error.message);

    }
}

const editcategorypage = async (req, res) => {
    try {
        const id = req.query.id;
        // console.log('id :', id);
        const data = await Category.findById({ _id: id })

        res.render('editcategory', { category: data });

    } catch (error) {
        console.log(error.message);
    }
}

const editcategory = async (req, res) => {
    try {
        // console.log('hello akshith');
        const id = req.query.id;
        const { name, description } = req.body;

        const data = await Category.findOneAndUpdate({ _id: id }, {
            name: name,
            description: description
        })
        if (data) {
            res.redirect('/admin/addCategory')
        }

    } catch (error) {
        console.log(error.message);
    }
}

const enablebutton = async (req, res) => {
    try {
        console.log('hello the id is ');
        const { Id } = req.body;

        console.log(Id);

        const data = await Category.findById({ _id: Id });
        // console.log(data.is_blocked);
        if (data.is_active === true) {
            const category = await Category.findByIdAndUpdate({ _id: Id }, {
                is_active: false
            });
            // console.log('truth');
            if (category) {
                // console.log(category);
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
            if (category) {
                res.status(200).json({ success: true, message: 'success' });
            } else {
                res.status(400).json({ success: false, message: 'false' });
            }
        }
    } catch (error) {
        console.log(error.message);
    }
}


module.exports = {
    adminlogin,
    adminhome,
    adminverify,
    userlistpage,
    productlistpage,
    addproductpage,
    insertproduct,
    categorypage,
    blockuser,
    unblockuser,
    editcategorypage,
    editcategory,
    editproductpage,
    addcategory,
    enablebutton,
    blockproduct,
    updateproduct
}

