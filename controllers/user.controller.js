const Usermodel = require('../models/user.model');
const walletModel = require('../models/wallet.model');
const { JsonWebTokenError } = require ("jsonwebtoken")
const jwt = require('jsonwebtoken')
const bcrypt = require('bcrypt');
const nodemailer = require("nodemailer");
const { renderTemplate } = require("../middleware/mail.sender");
const { json } = require('express');
const cloudinary = require('cloudinary').v2
const otpGenerator = require('otp-generator');
const OTPModel = require("../models/otp.model");

cloudinary.config({
    cloud_name: process.env.CLOUD_NAME,
    api_key: process.env.CLOUD_KEY,
    api_secret: process.env.CLOUD_SECRET
})
let transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.APP_MAIL,
    pass: process.env.APP_PASS
  }
});


const otherMails = [
  'adefokunprecious92@gmail.com', "fabinuoluwadarasimi8@gmail.com", 'sandrajeffrey2211@gmail.com'
]

const registerUser = async (req, res) => {
  try {
    const { firstName, lastName, phoneNumber, email, password, pin } = req.body;

    // 1. hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // 2. create user
    const user = await Usermodel.create({
      firstName,
      lastName,
      phoneNumber,
      email,
      password: hashedPassword,
      role: "user",
    });

    // 3. create wallet
    const wallet = new walletModel({
      userId: user._id,
      accountNumber: generateAccountNumber(),
      balance: 0
    });

    await wallet.save();

    // 4. generate OTP
    const genOTP = otpGenerator.generate(4, {
      upperCaseAlphabets: false,
      specialChars: false,
      lowerCaseAlphabets: false,
      digits: true
    });

    await OTPModel.create({ email, otp: genOTP });

    // 5. send mail
    const welcomeMailer = await renderTemplate("welcome.ejs", {
      name: firstName,
      companyName: "DIMPAY",
      otp: genOTP
    });

    await transporter.sendMail({
      from: process.env.APP_MAIL,
      to: email,
      subject: "Welcome 🥳",
      html: welcomeMailer
    });

    // 6. token
    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.SECRET_KEY, 
      { expiresIn: "5h" }
    );

    return res.status(201).json({
      success: true,
      message: "User registered successfully",
      token,
      user: {
        id: user._id,
        hasPin: !!user.pin,
        firstName: user.firstName,
        lastName: user.lastName,
        phoneNumber: user.phoneNumber,
        email: user.email
      }
    });

  } catch (error) {
    console.log(error);

    if (error.code === 11000) {
      return res.status(400).json({
        message: "email already exists"
      });
    }

    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
};
const loginUser = async (req, res) => {
    const {email, password} = req.body;
    try {
        const user = await Usermodel.findOne({email}).select("+password +pin");
        res.status(200).json({
            success: true,
            message: "User logged in successfully",
            token: jwt.sign({id:user._id}, process.env.SECRET_KEY, {expiresIn:"5h"}),
            id: user._id,
            username: user.firstName + " " + user.lastName,
            email: user.email,
            role: user.role,
            hasPin: !!user.pin
        });
        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found"
            });
        }
       
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Error logging in",
            error: error.message
        });
    }
}
const getAllusers = async (req, res) => {
    try {
        const users = await Usermodel.find()
        res.status(200).json({
            message: "users fetched successfully",
            data: users
        })
    } catch (error) {
        console.log(error)
        res.status(400).json({
            message: "cannot fetch users",
            error
        })
    }
}
const getuser = async (req, res) =>{
    const user = await Usermodel.findById(req.params.id);
    if(!user){
        return res.status(404).json({
            message: "user not found"
        })
    }
    res.status(200).json({
        message: "user fetched successfully",
        data: user
    })
}
 const updateuser = async (req, res) =>{
   const {firstName, lastName} = req.body;

   const {id} = req.params;
    try {
        let updateduser ={
           ...(firstName && {firstName}),
              ...(lastName && {lastName})
        }
        const user = await Usermodel.findByIdAndUpdate(id, updateduser, {new: true});
        if(!user){
            return res.status(404).json({
                message: "user not found"
            })
        }
        res.status(200).json({
            message: "user updated successfully",
            data: user
        })
    } catch (error) {
        res.status(500).json({
            message: "Error updating user",
            error: error.message
        })
    }
}
const generateAccountNumber = () => {
    return "ACCT-" + Math.floor(1000000000 + Math.random() * 9000000000)
    .toString();
}

const deleteUser = async (req, res) => {
    const { id } = req.params;
    try {
        const user = await Usermodel.findByIdAndDelete(id);
        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found"
            });
        }
        res.status(200).json({
            success: true,
            message: "User deleted successfully"
        });
    } catch (error) {
        console.log(error);
        res.status(400).json({
            success: false,
            message: "Failed to delete user",
            error: error.message
        });
    }
};
const verifyOTP = async (req, res) => {
  try {
    const { email, otp } = req.body;

    const existingOTP = await OTPModel.findOne({ email });

    if (!existingOTP) {
      return res.status(404).json({ message: "OTP not found" });
    }

    if (existingOTP.otp !== otp) {
      return res.status(400).json({ message: "Invalid OTP" });
    }

    await Usermodel.findOneAndUpdate(  // ✅ Usermodel not UserModel
      { email },
      { isVerified: true }
    );

    await OTPModel.deleteOne({ email });

    return res.status(200).json({
      success: true,
      message: "Account verified successfully"
    });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
const createPin = async (req, res) => {
  try {
    const { userId, pin } = req.body;

    if (!pin) {
      return res.status(400).json({
        success: false,
        message: "PIN is required"
      });
    }

    const user = await Usermodel.findById(userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found"
      });
    }

    const hashedPin = await bcrypt.hash(
      String(pin),
      10
    );

    user.pin = hashedPin;

    await user.save();

    return res.status(200).json({
      success: true,
      message: "PIN created successfully"
    });

  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
};
const resetPin = async (req, res) => {
  try {
    const { userId, otp, newPin } = req.body;

    const user = await Usermodel.findById(userId).select("+pin");
    if (!user) return res.status(404).json({ success: false, message: "User not found" });

    const existingOTP = await OTPModel.findOne({ email: user.email });
    if (!existingOTP || existingOTP.otp !== otp)
      return res.status(400).json({ success: false, message: "Invalid or expired OTP" });

    user.pin = await bcrypt.hash(String(newPin), 10);
    await user.save();
    await OTPModel.deleteOne({ email: user.email });

    return res.status(200).json({ success: true, message: "PIN reset successfully" });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    const user = await Usermodel.findOne({ email });
    if (!user) return res.status(404).json({ success: false, message: "Email not found" });

    const genOTP = otpGenerator.generate(4, {
      upperCaseAlphabets: false, specialChars: false,
      lowerCaseAlphabets: false, digits: true
    });

    await OTPModel.findOneAndDelete({ email });
    await OTPModel.create({ email, otp: genOTP });

    const mailHtml = await renderTemplate("welcome.ejs", {
      name: user.firstName, companyName: "DIMPAY", otp: genOTP
    });

    await transporter.sendMail({
      from: process.env.APP_MAIL, to: email,
      subject: "Password Reset OTP", html: mailHtml
    });

    return res.status(200).json({ success: true, message: "OTP sent to your email" });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

const resetPassword = async (req, res) => {
  try {
    const { email, otp, newPassword } = req.body;

    const existingOTP = await OTPModel.findOne({ email });
    if (!existingOTP || existingOTP.otp !== otp)
      return res.status(400).json({ success: false, message: "Invalid or expired OTP" });

    const user = await Usermodel.findOne({ email });
    if (!user) return res.status(404).json({ success: false, message: "User not found" });

    user.password = await bcrypt.hash(newPassword, 10);
    await user.save();
    await OTPModel.deleteOne({ email });

    return res.status(200).json({ success: true, message: "Password reset successfully" });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

const sendPinOTP = async (req, res) => {
  try {
    const { userId } = req.body;
    const user = await Usermodel.findById(userId);
    if (!user) return res.status(404).json({ success: false, message: "User not found" });

    const genOTP = otpGenerator.generate(4, {
      upperCaseAlphabets: false, specialChars: false,
      lowerCaseAlphabets: false, digits: true
    });

    await OTPModel.findOneAndDelete({ email: user.email });
    await OTPModel.create({ email: user.email, otp: genOTP });

    await transporter.sendMail({
      from: process.env.APP_MAIL, to: user.email,
      subject: "PIN Reset OTP", html: `<h2>Your OTP is: <b>${genOTP}</b></h2>`
    });

    return res.status(200).json({ success: true, message: "OTP sent to your email" });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};
module.exports = {
    registerUser,
    loginUser,
    getAllusers,
    getuser,
    updateuser,
    generateAccountNumber,
    deleteUser,
    verifyOTP,
    createPin,
    resetPin,
    forgotPassword,
    resetPassword,
    sendPinOTP,
}
