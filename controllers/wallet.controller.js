const walletModel = require('../models/wallet.model');
const UserModel = require('../models/user.model');
const transactionModel = require('../models/transaction.model');
const createWallet = async (req, res) => {
    const {userId} = req.body;
    try {
        const user = await UserModel.findById(userId);
        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found"
            });
        }
        const wallet = new walletModel({
            userId: userId,
            accountNumber: generateAccountNumber(),
            balance: 0
        });
        await wallet.save();
        res.status(201).json({
            success: true,
            message: "Wallet created successfully",
            data: wallet
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Error creating wallet",
            error: error.message
        });
    }
};
const getWallet = async (req, res) => {
  try {
    const { userId } = req.params;

    const wallet = await walletModel.findOne({ userId });

    if (!wallet) {
      return res.status(404).json({
        success: false,
        message: "Wallet not found"
      });
    }

    const user = await UserModel.findById(userId);

    const transactions = await transactionModel
      .find({ userId })
      .sort({ createdAt: -1 })
      .limit(10);

return res.status(200).json({
  success: true,
  wallet,
  transactions,
  username: `${user.firstName} ${user.lastName}`
});

  } catch (error) {
    console.log(error);

    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
};
module.exports = {
    createWallet,
    getWallet
};