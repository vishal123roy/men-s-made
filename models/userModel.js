const mongoose = require('mongoose');

const customerschema = new mongoose.Schema({
    name:{
        type:String,
        required:true,
        trim: true
    },
    email:{
        type:String,
        required:true,
        trim:true
    },
    phoneNumber:{
        type:String,
        required:false,
        trim: true
    },
    password:{
        type:String,
        required:false,
               
    },
    is_verified:{
        type:Number,
        default:0
    },
    is_blocked:{
        type:Boolean,
        default:false
    },
    referralCode: {
        type: String,
    },
    appliedCoupon:[{
        type:String,
        required:false
    }]

});

module.exports = mongoose.model('customer',customerschema);