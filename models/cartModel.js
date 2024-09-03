const mongoose = require('mongoose');

const mongooseSchema = new mongoose.Schema({

    userId:{
        type:String,
        required:true
    },
    items:[
        {
            product:{
                type:mongoose.Schema.Types.ObjectId,
                ref:"Product",
                required:true,
            },
            size:{
                type:String,
                required:true
            },
            subTotal:{
                type:Number,
                required:true
            },
            quantity:{
                type:Number,
                required:true,
                default:1
            }
        }
    ],
    total:{
        type:Number,
        required:true,
        default:0
    }
})

module.exports = mongoose.model('cart',mongooseSchema);

