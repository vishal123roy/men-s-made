const mongoose = require('mongoose');

const productschema = new mongoose.Schema({
    productname:{
        type:String,
        required:true,
        trim: true
    },
    brand:{
        type:String,
        required:true,
        trim:true
    },
    price:{
        type:Number,
        required:true,
        trim: true
    },
    productcategory:{
        type:String,
        required:true,
               
    },
    description:{
        type:String,
        required:true
    },
    images:[{
        type:String,
        
    }],
    sizes:[
        {
            size:{
                type:String,
                required:true
            },
            quantity:{
                type:Number,
                required:true
            }
        }
    ],
    is_listed:{
        type:Boolean,
        default:true
    }
});

module.exports = mongoose.model('Products',productschema);