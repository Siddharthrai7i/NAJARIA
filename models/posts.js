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