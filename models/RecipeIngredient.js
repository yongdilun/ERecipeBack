const mongoose = require('mongoose');
const { Schema } = mongoose;

const RecipeIngredientSchema = new Schema({
  recipe_id: { type: Schema.Types.ObjectId, ref: 'Recipe', required: true },
  ingredient_number: { type: Number, required: true },
  ingredient_name: { type: String, required: true },
  quantity: { type: String, required: true }
});

module.exports = mongoose.model('RecipeIngredient', RecipeIngredientSchema);
