const transactionModel = require('../models/transaction.model');
const walletModel = require('../models/wallet.model');
const UserModel = require('../models/user.model');
const bcrypt = require('bcrypt');
const { generateAccountNumber } = require('./user.controller');
const Walletmodel = require('../models/wallet.model');

const transferFunds = async (req, res) => {
  try {
    const { senderId, recipientId, amount, bankName, pin } = req.body;

    // 1. Check required fields
    if (!senderId || !recipientId || !bankName || !amount) {
      return res.status(400).json({
        success: false,
        message: "Please provide all required fields"
      });
    }

    // 2. Find sender and check PIN exists FIRST
    const sender = await UserModel.findById(senderId).select("+pin");

    if (!sender) {
      return res.status(404).json({
        success: false,
        message: "Sender not found"
      });
    }

    if (!sender.pin) {
      return res.status(400).json({
        success: false,
        message: "Please create a transaction PIN first"
      });
    }

    // 3. Validate PIN
    const isPinValid = await bcrypt.compare(pin, sender.pin);
    if (!isPinValid) {
      return res.status(401).json({
        success: false,
        message: "Invalid PIN"
      });
    }

    // 4. Find wallets
    const senderWallet = await walletModel.findOne({ userId: senderId });
    const formattedAccount = recipientId.startsWith("ACCT-")
      ? recipientId
      : `ACCT-${recipientId}`;
    const recipientWallet = await walletModel.findOne({
      accountNumber: formattedAccount
    });

    if (!senderWallet) {
      return res.status(404).json({
        success: false,
        message: "Sender wallet not found"
      });
    }

    if (!recipientWallet) {
      return res.status(404).json({
        success: false,
        message: "Recipient wallet not found"
      });
    }

    // 5. Prevent self transfer
    if (senderWallet.accountNumber === recipientWallet.accountNumber) {
      return res.status(400).json({
        success: false,
        message: "You cannot transfer funds to yourself"
      });
    }

    // 6. Check balance
    const amountValue = Number(amount);
    if (senderWallet.balance < amountValue) {
      return res.status(400).json({
        success: false,
        message: "Insufficient funds"
      });
    }

    // 7. Execute transfer
    const reference = "TRX-" + Date.now();
    senderWallet.balance -= amountValue;
    recipientWallet.balance += amountValue;

    await senderWallet.save();
    await recipientWallet.save();

// After saving wallets, create TWO transaction records

// Sender's debit record
await transactionModel.create({
  userId: senderId,
  type: "transfer",
  amount: amountValue,
  reference,
  description: `Transfer to ${recipientWallet.accountNumber}`,
  recipient: recipientWallet.accountNumber,
  status: "success",
  date: new Date()
});


await transactionModel.create({
  userId: recipientWallet.userId,  // recipient's userId
  type: "deposit",                 // deposit = credit type
  amount: amountValue,
  reference: "TRX-" + Date.now() + 1, // slightly different reference
  description: `Transfer from ${senderWallet.accountNumber}`,
  status: "success",
  date: new Date()
});

    return res.status(200).json({
      success: true,
      message: "Transfer successful",
      reference
    });

  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
};
const getTransactions = async (req, res) => {
  try {
    const userId = req.userId;
    const transactions = await transactionModel
      .find({ userId })
      .sort({ createdAt: -1 });
  
    res.status(200).json({
      success: true,
      transactions
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};
  const depositFunds = async (req, res) => {
  const { userId, amount } = req.body;

  try {

    const wallet = await walletModel.findOne({ userId });

    if (!wallet) {
      return res.status(404).json({
        success: false,
        message: "Wallet not found"
      });
    }

    wallet.balance += Number(amount);

    await wallet.save();

return res.status(200).json({
  success: true,
  message: "Funds deposited successfully",
  wallet
});

  } catch (error) {

    return res.status(500).json({
      success: false,
      message: "Error processing deposit",
      error: error.message
    });

  }
};    
const dataPurchase =async(req, res) =>{
        const {phoneNumber, userId, amount} = req.body;
        try {
            const wallet = await walletModel.findOne({userId})
            if (!phoneNumber || phoneNumber.length !== 11){ 
                return res.status(404).json({
                 success: false,
            message: "Error processing deposit",
            error: error.message
                })}
        } catch (error) {
            res.status(500).json({
                success: false,
                message: "Error buying data",
                error: error.message
            });
        }
    }
const buyService = async (req, res) => {
  try {
      const userId = req.userId;
    const {
      serviceType,
      provider,
      phoneNumber,
      smartCardNumber,
      amount
    } = req.body;

    if (!userId || !serviceType || !amount) {
      return res.status(400).json({
        success: false,
        message: "Missing required fields"
      });
    }


    if (
      (serviceType === "airtime" || serviceType === "data") &&
      !phoneNumber
    ) {
      return res.status(400).json({
        success: false,
        message: "Phone number is required"
      });
    }

  
    if (
      (serviceType === "gotv" ||
        serviceType === "dstv" ||
        serviceType === "startimes") &&
      !smartCardNumber
    ) {
      return res.status(400).json({
        success: false,
        message: "Smart card number is required"
      });
    }

    const wallet = await walletModel.findOne({ userId });

    if (!wallet) {
      return res.status(404).json({
        success: false,
        message: "Wallet not found"
      });
    }

    if (wallet.balance < Number(amount)) {
      return res.status(400).json({
        success: false,
        message: "Insufficient balance"
      });
    }

    wallet.balance -= Number(amount);
    await wallet.save();

    const reference = "TXN-" + Date.now();

    await transactionModel.create({
      userId,
     type: serviceType.toLowerCase(),
      amount: Number(amount),
      reference,
      status: "success",
      description: `${provider} ${serviceType} purchase`
    });

    return res.status(200).json({
      success: true,
      message: `${provider} purchase successful`,
      reference,
      balance: wallet.balance
    });

  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
};
const withdrawFunds = async (req, res) => {
  try {
    const { userId, amount, pin } = req.body;

    const user = await UserModel
      .findById(userId)
      .select("+pin");

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found"
      });
    }

    const isPinValid = await bcrypt.compare(
      String(pin),
      user.pin
    );

    if (!isPinValid) {
      return res.status(401).json({
        success: false,
        message: "Invalid PIN"
      });
    }

    const wallet = await walletModel.findOne({
      userId
    });

    if (!wallet) {
      return res.status(404).json({
        success: false,
        message: "Wallet not found"
      });
    }

    if (wallet.balance < Number(amount)) {
      return res.status(400).json({
        success: false,
        message: "Insufficient funds"
      });
    }

    wallet.balance -= Number(amount);

    await wallet.save();

    const reference =
      "WDR-" + Date.now();

    await transactionModel.create({
      userId,
      type: "withdrawal",
      amount: Number(amount),
      reference,
      status: "success",
      description: "Cash Withdrawal"
    });

    return res.status(200).json({
      success: true,
      message: "Withdrawal successful",
      reference
    });

  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
};
// Get all users with their wallet balance
const getAllUsersWithWallets = async (req, res) => {
  try {
    const users = await UserModel.find().select('-password -pin');
    const usersWithWallets = await Promise.all(
      users.map(async (user) => {
        const wallet = await walletModel.findOne({ userId: user._id });
        const txCount = await transactionModel.countDocuments({ userId: user._id });
        return {
          ...user.toObject(),
          wallet: wallet || null,
          transactionCount: txCount
        };
      })
    );
    return res.status(200).json({ success: true, users: usersWithWallets });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// Get all transactions for a specific user
const getUserTransactions = async (req, res) => {
  try {
    const { userId } = req.params;
    const transactions = await transactionModel
      .find({ userId })
      .sort({ createdAt: -1 });
    const user = await UserModel.findById(userId).select('-password -pin');
    const wallet = await walletModel.findOne({ userId });
    return res.status(200).json({ success: true, transactions, user, wallet });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// Get transaction by ID
const getTransactionById = async (req, res) => {
  try {
    const { transactionId } = req.params;
    const transaction = await transactionModel.findById(transactionId);
    if (!transaction) return res.status(404).json({ success: false, message: 'Transaction not found' });
    return res.status(200).json({ success: true, transaction });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// Get all transactions (admin)
const getAllTransactions = async (req, res) => {
  try {
    const transactions = await transactionModel
      .find()
      .sort({ createdAt: -1 })
      .limit(100);
    return res.status(200).json({ success: true, transactions });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// Get dashboard stats
const getAdminStats = async (req, res) => {
  try {
    const totalUsers = await UserModel.countDocuments();
    const totalTransactions = await transactionModel.countDocuments();
    const wallets = await walletModel.find();
    const totalBalance = wallets.reduce((sum, w) => sum + w.balance, 0);
    const todayStart = new Date(); todayStart.setHours(0,0,0,0);
    const todayTx = await transactionModel.countDocuments({ createdAt: { $gte: todayStart } });
    return res.status(200).json({
      success: true,
      stats: { totalUsers, totalTransactions, totalBalance, todayTx }
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};
module.exports = {
    transferFunds,
    depositFunds,
    dataPurchase,
    getTransactions,
    withdrawFunds,
    buyService,
    getAllUsersWithWallets,
    getUserTransactions,
    getTransactionById,
    getAllTransactions,
    getAdminStats
}
