const mongoose = require('mongoose');

const walletSchema = new mongoose.Schema({
    userId: {type: mongoose.Schema.Types.ObjectId, 
    ref: 'user', 
    required: true,
    unique: true},
    accountNumber: {type: String, required: true, unique: true},

    bankName: {type: String, default: "Dimpay", required: true},
    
    balance: {type: Number, default: 0},
    currency: {type: String, default: "Naira"},
}, {timestamps: true, strict:"throw"});
const Walletmodel = mongoose.model("wallet", walletSchema);

module.exports = Walletmodel;
