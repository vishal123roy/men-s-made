const mongoose = require('mongoose');

const walletSchema = new mongoose.Schema({
    user:{
        type:mongoose.Schema.Types.ObjectId,
        ref:'customer',
        required:true
    },
    walletBalance:{
        type:Number,
        required:true,
        default:0
    },
    transactionHistory:[{
        createdAt:{
            type:Date,
            default:Date.now
        },
        paymentType:{
            type:String,
            required:true
        },
        transactionMode:{
            type:String,
            required:true
        },
        transactionAmount:{
            type:Number,
            required:true
        }
    }],
    totalRefund:{
        type:Number,
        required:true,
        default:0
    }
});

module.exports = mongoose.model('Wallet',walletSchema);