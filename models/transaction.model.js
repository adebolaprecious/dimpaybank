const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema({
    userId: {type: mongoose.Schema.Types.ObjectId, ref: 'user', required: true},
    type: {type: String, enum: [
        'deposit',
        'withdrawal',
        'transfer',
        'airtime',
        'bill',
         "data",
      "gotv",
      "dstv",
      "startimes",
        'subscription payment',
        'refund',
    ], required: true},
    amount: {type: Number, 
        required: true},
        status: {type: String, 
        enum: ['pending', 'success', 'failed'], 
        default: 'pending'},
        reference: {
        type: String, 
        required: true, 
        unique: true
    },

        description: {
        type: String
        },
    recipientId: {type: mongoose.Schema.Types.ObjectId, ref: 'user'},

recipient: {
  type: String,
  required: false
},
pin: {type: String, required: false},
date: {type: Date, default: Date.now},
}, {timestamps: true, strict:"throw"});
const Transactionmodel = mongoose.model("transaction", transactionSchema);

module.exports = Transactionmodel;
