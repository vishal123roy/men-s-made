const mongoose = require('mongoose');

const mongooseschema = new mongoose.Schema({

    name:{
        type:String,
        required:true
    },
    description:{
        type:String,
        required:true
    },
    is_active:{
        type:Boolean,
        default:true
    }

})

module.exports = mongoose.model('category',mongooseschema);

