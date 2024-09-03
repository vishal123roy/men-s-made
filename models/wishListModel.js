const mongoose = require('mongoose');

const wishListSchema = new mongoose.Schema({

    user:{
        type:mongoose.Schema.Types.ObjectId,
        ref:'customers',
        required:true
    },
    products: [{
        product: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Product',
            required: true
        }
    }]
})

module.exports = mongoose.model('wishList',wishListSchema);