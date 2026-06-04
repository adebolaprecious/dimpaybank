const express = require('express');
const router = express.Router();
const { authMiddleware, adminOnly } = require('../middleware/auth');
const {
  transferFunds, getTransactions, depositFunds,
  withdrawFunds, buyService, getAdminStats,
  getTransactionById, getAllTransactions,
  getAllUsersWithWallets, getUserTransactions
} = require('../controllers/transfer.controller');

// User routes
router.post('/transfer',     authMiddleware, transferFunds);
router.post('/depositfunds', authMiddleware, depositFunds);
router.post('/withdraw',     authMiddleware, withdrawFunds);
router.post('/buy-service',  authMiddleware, buyService);
router.get('/transactions',  authMiddleware, getTransactions);

// Admin routes
router.get('/admin/stats',                          authMiddleware, adminOnly, getAdminStats);
router.get('/admin/users',                          authMiddleware, adminOnly, getAllUsersWithWallets);
router.get('/admin/transactions',                   authMiddleware, adminOnly, getAllTransactions);
router.get('/admin/transactions/:transactionId',    authMiddleware, adminOnly, getTransactionById);
router.get('/admin/users/:userId/transactions',     authMiddleware, adminOnly, getUserTransactions);

module.exports = router;