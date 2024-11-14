const mongoose = require('mongoose');
const { Schema } = mongoose;

const RecipeSchema = new Schema({
  user_id: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  title: { type: String, required: true },
  description: { type: String },
  servings: { type: Number },
  cooking_time: { type: Number },
  prep_time: { type: Number },
  cuisine: { type: String, required: true },
  image_url: { type: String },
  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Recipe', RecipeSchema);
