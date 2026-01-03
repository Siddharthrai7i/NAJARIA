const mongoose = require('mongoose');



const conversationSchema = new mongoose.Schema({
    conversationId: {
        type: String,
        required: true,
        unique: true
    },
    participants: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }],
    village: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Village',
        required: true
    },
    lastMessage: {
        type: String
    },
    lastMessageAt: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true
});

conversationSchema.index({ participants: 1 });
conversationSchema.index({ village: 1 });

module.exports = mongoose.model('Conversation', conversationSchema);
