const express = require('express');
const router = express.Router();
const {registerUser, loginUser, getAllusers, updateuser, getuser, deleteUser, verifyOTP, createPin, forgotPassword, resetPassword, sendPinOTP, resetPin} = require('../controllers/user.controller');
const authMiddleware = require('../middleware/auth').authMiddleware;
router.post('/registeruser', registerUser);
router.post('/loginuser', loginUser);
router.get('/getallusers', getAllusers);
router.get('/getuser/:id', getuser);
router.patch('/updateuser/:id', updateuser);
router.delete('/deleteuser/:id', deleteUser)
router.post("/verifyotp", verifyOTP);
router.post("/create-pin", createPin);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);
router.post('/send-pin-otp', sendPinOTP);
router.post('/reset-pin', resetPin);
router.delete('/delete-account/:id', authMiddleware, deleteUser);


module.exports = router;