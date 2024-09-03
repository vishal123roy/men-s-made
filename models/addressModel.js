const mongoose = require('mongoose');

const addressSchema = new mongoose.Schema({
    
    user:{
        type:mongoose.Schema.Types.ObjectId,
        ref:'customer',
        required:true
    },
    name:{
        type:String,
        required:true
    },
    pincode:{
        type:Number,
        required:true
    },
    locality:{
        type:String,
        required:true
    },
    address:{
        type:String,
        required:true
    },
    district:{
        type:String,
        required:true
    },
    state:{
        type:String,
        required:true
    },
    landmark:{
        type:String
    },
    alternativeNumber:{
        type:Number,
        required:true
    },
    locationType:{
        type:String,
        required:true
    }
});

module.exports = mongoose.model('Addresses',addressSchema);