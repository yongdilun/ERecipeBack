const mongoose = require('mongoose');
const { Schema } = mongoose;

const RecipeStepSchema = new Schema({
  recipe_id: { type: Schema.Types.ObjectId, ref: 'Recipe', required: true },
  step_number: { type: Number, required: true },
  description: { type: String, required: true },
  image_url: { type: String }, // New field for step image URL
});

module.exports = mongoose.model('RecipeStep', RecipeStepSchema);
