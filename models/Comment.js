const mongoose = require('mongoose');
const { Schema } = mongoose;

const CommentSchema = new Schema({
  user_id: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  recipe_id: { type: Schema.Types.ObjectId, ref: 'Recipe', required: true },
  content: { type: String, required: true },
  created_at: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Comment', CommentSchema);
