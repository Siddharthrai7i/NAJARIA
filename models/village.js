const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const VillageSchema = new Schema({
    name: {
        type: String,
        required: true,
        unique: true,
        trim: true
    },
    description: {
        type: String
    },
    lagion: {
        type: Schema.Types.ObjectId,
        ref: 'User'
    },
    posts: [{
        type: Schema.Types.ObjectId,
        ref: 'Post'
    }]
}, {
    timestamps: true
});
module.exports = mongoose.model('Village', VillageSchema);