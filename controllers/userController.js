
const customer = require('../models/userModel');
const Products = require('../models/productModel');
const nodemailer = require('nodemailer');
const bcrypt = require('bcrypt');

const generateOTP = () => {
    return Math.random().toString().slice(2, 8);
};

const otpExpiryTime = () => {
    const now = new Date();
    now.setMinutes(now.getMinutes() + 1);
    return now;
};

const sendOTP = async (email, otp) => {
    try {
        const transporter = nodemailer.createTransport({
            service: 'gmail',
            host: 'smtp.gmail.com',
            port: 587,
            secure: false,
            requireTLS: true,
            auth: {
                user: "vishaldrx1999@gmail.com",
                pass: "lekj devm qukz vtsd",
            }
        })
        const mailOptions = {
            from: {
                name: "men's made",
                address: 'vishaldrx1999@gmail.com'
            },
            to: email,
            subject: 'Sending email',
            text: 'hello world',
            html: `<p>Your OTP for email verification is <strong>${otp}</strong>this OTP is valid for 10 minutes</p>`
        }

        await transporter.sendMail(mailOptions);
        console.log('otp email has been sent');
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
        console.log(error.message);
    }
}

const insertUser = async (req, res) => {
    try {
        // console.log(req.body);
        const { username, useremail, mobilenumber, password } = req.body;

        const secretpassword = await securePassword(password);

        const otp = generateOTP();
        console.log(otp);

        const user = { username, useremail, mobilenumber, secretpassword, otp }
        req.session.Data = user;
        // console.log(req.session.Data)
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
        console.log(req.query.OTP, 'otp');
        const otptimer = new Date(req.session.Data.otpexpiry);
        const now = new Date();
        // console.log(now);
        const OTP = req.query.OTP;

        if (req.session.Data.otp == OTP && otptimer > now) {

            const user = new customer({
                name: req.session.Data.username,
                email: req.session.Data.useremail,
                phoneNumber: req.session.Data.mobilenumber,
                password: req.session.Data.secretpassword,
                is_verified: 0
            })

            await user.save();

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
        console.log(req.session.Data.otp);
        await req.session.save();
        // res.redirect('otp');

        res.status(200).json({ success: true, message: 'otp sent successfully' });

    } catch (error) {
        console.log(error.message);
    }
}

const loadLogin = async (req, res) => {
    try {
        res.render('login');
    } catch (error) {
        console.log(error.message);
    }
};

const verifyLogin = async (req, res) => {
    try {

        const Email = req.body.Customeremail;

        const password = req.body.Customerpassword;

        const userData = await customer.findOne({ email: Email });

        req.session.user_id = userData._id;

        const samepassword = await bcrypt.compare(password, userData.password);

        if (samepassword) {

            res.redirect('home');

        } else {
            res.render('login', { message: 'login failed' })
        }

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
        console.log(email);
        if (email) {
            const otp = generateOTP();
            console.log(otp)
            const otpexpiry = otpExpiryTime();
            await sendOTP(email, otp);
            const otpdata = {email,otp,otpexpiry}          
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
        
        const expiryTime = new Date(req.session.Data.otpexpiry);
        const now = new Date();
        const Email = req.session.Data.email;
        console.log(newPassword);


        if (otp === req.session.Data.otp && expiryTime > now){
            console.log('true');
            const recentPassword = await securePassword(newPassword);

            const data = await customer.findOne({email:Email});
            
            const userData = await customer.findByIdAndUpdate({_id:data._id},{
                password:recentPassword
            })

            console.log(userData)
            if(userData){
                console.log('userpassword updated');
                res.redirect('login');
            }
        }else{
            console.log('otp error')
        }

    } catch (error) {
        console.log(error.message);
    }
}


const loadHome = async (req, res) => {
    try {
        const productdata = await Products.find({ is_listed: true });
        res.render('home', { products: productdata });
    } catch (error) {
        console.log(error.message);
    }
}

const productpage = async (req, res) => {
    try {
        console.log('hi');
        const Id = req.query.id;
        console.log(Id);
        const data = await Products.findById({ _id: Id });
        const prodata = await Products.find();
        // console.log('product found out')
        console.log(prodata);
        res.render('productPage', { productData: data, product: prodata });
    } catch (error) {
        console.log(error.message);
    }
}

const userProfile = async (req, res) => {
    try {
        res.render('dashBoard');
    } catch (error) {
        console.log(error.message);
    }
}

const orderpage = async (req,res) => {
    try {
        res.render('orders')
    } catch (error) {
        console.log(error.message);
    }
}

const trackOrderpage = async (req,res) => {
    try {
        res.render('trackOrders')
    } catch (error) {
        console.log(error.message)
    }
}

const addressPage = async (req,res) => {
    try{
        res.render('myAddress');
    }catch(error){
        console.log(error.message);
    }
}


module.exports = {
    signup,
    insertUser,
    loadOTP,
    verifyOTP,
    loadLogin,
    loadHome,
    verifyLogin,
    Resend,
    productpage,
    userProfile,
    forgot,
    sendEmail,
    newPassword,
    updatePassword,
    userProfile,
    orderpage,
    trackOrderpage,
    addressPage


};
