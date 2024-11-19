const mongoose = require('mongoose');
const { Schema } = mongoose;

const reportSchema = new Schema({
    reporter: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    reportedContentId: {
        type: Schema.Types.ObjectId,
        required: true
    },
    reportedContentType: {
        type: String,
        enum: ['recipe', 'comment'],
        required: true
    },
    reason: {
        type: String,
        enum: ['SPAM', 'INAPPROPRIATE', 'COPYRIGHT', 'OTHER'],
        required: true
    },
    description: {
        type: String,
        default: null
    },
    status: {
        type: String,
        enum: ['pending', 'resolved', 'rejected'],
        default: 'pending'
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('Report', reportSchema);
