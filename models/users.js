const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const passportLocalMongoose = require("passport-local-mongoose");

const userSchema = new Schema({
    username: {
        type: String,
        required: true,
        unique: true,
        trim: true
    },
    email: {
        type: String,
        required: true,
        unique: true
    },
    fullName: {
        type: String,
        required: true
    },
    phoneNumber: {
        type: String,
        required: true
    },
    village: {
        type: Schema.Types.ObjectId,
        ref: 'Village',
        required: true
    },
}, {
    timestamps: true
});
userSchema.plugin(passportLocalMongoose.default);
module.exports = mongoose.model('User', userSchema);