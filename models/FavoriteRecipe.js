const mongoose = require('mongoose');
const { Schema } = mongoose;

const FavoriteRecipeSchema = new Schema({
  user_id: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  recipe_id: { type: Schema.Types.ObjectId, ref: 'Recipe', required: true },
  saved_at: { type: Date, default: Date.now }
});

module.exports = mongoose.model('FavoriteRecipe', FavoriteRecipeSchema);
