const express = require('express');
const router = express.Router();
const {walletBalance, getWallet, createWallet} = require('../controllers/wallet.controller');
const authMiddleware = require("../middleware/auth").authMiddleware;



router.get('/:userId', getWallet);
router.post("/createwallet", authMiddleware, createWallet);
module.exports = router;