// models/Product.js
const mongoose = require('mongoose');

const productSchema = new mongoose.Schema(
  {
    userId: String,
    title: String,
    details: String,
    category:String,
    price: Number,
    image:String,
      province: String,
    district: String,
    tehsil: String,
    area: String,
    phone: String,
    whatsapp: String,
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Product', productSchema);
