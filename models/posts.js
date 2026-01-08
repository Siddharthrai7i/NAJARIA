const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const PostSchema = new Schema({
    title: {
        type: String,
        required: true,
        trim: true
    },
    content: {
        type: String,
        required: true
    },
    image: {
        type: String,  // Store image URL/path
        default: null  // Optional - null if no image
    },
    author:{
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    village: {                         
        type: Schema.Types.ObjectId,
        ref: 'Village',
        required: true
    },
    comments: [{
        user: {
            type: Schema.Types.ObjectId,
            ref: 'User'
        },
        content: String,
    }]
}, {
    timestamps: true
});

module.exports = mongoose.model('Post', PostSchema);