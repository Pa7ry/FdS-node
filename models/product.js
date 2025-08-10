import { Schema, model } from 'mongoose';

const productSchema = new Schema({
  name: { type: String, required: true },
  img: { type: String },
  price: { type: Number, required: true, min: 0 },
  sold: { type: Boolean, default: false },
  measures: { type: String },
  technique: { type: String },
  weight: { type: Number, min: 0 }
}, { timestamps: true });

export default model('Product', productSchema);
