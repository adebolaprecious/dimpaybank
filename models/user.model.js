const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
    firstName: {type: String, required: true},
    lastName: {type: String, required: true},
    phoneNumber: {type:String, required:true, unique:true},
    email: {type: String, required: true, unique: true},
    password: {type: String, required: true, select: false},
    isAdmin: {type:Boolean, default:false},
    isVerified: {type:Boolean, default:false},
    role: {type: String, enum: ['user', 'admin'], default: 'user'},
    pin: {type: String, required: false, select: false},
}, {timestamps: true, strict:"throw"});

const Usermodel = mongoose.model("user", userSchema);

module.exports = Usermodel;