const mongoose = require('mongoose');

const couponSchema = new mongoose.Schema({
    couponId :{
        type:String,
        unique:true,
        index:true
    },
    description:{
        type:String,
        required:true
    },
    maximumDiscount:{
        type:Number,
        required:true
    },
    minimumAmount:{
        type:Number,
        required:true
    },
    maximumAmount:{
        type:Number,
        required:true
    },
    maximumUser:{
        type:Number,
        required:true
    },
    expireDate:{
        type:Date,
        required:true
    }
})

module.exports = mongoose.model('Coupon',couponSchema);