const mongoose = require('mongoose');
const { Schema } = mongoose;

const RateSchema = new Schema({
  user_id: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  recipe_id: { type: Schema.Types.ObjectId, ref: 'Recipe', required: true },
  rating: { type: Number, required: true, min: 1, max: 5 },
  rated_at: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Rate', RateSchema);
