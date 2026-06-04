const jwt = require("jsonwebtoken");

const authMiddleware = async (req, res, next) => {
  try {
    const token = req.headers.authorization;
    if (!token) return res.status(401).json({ success: false, message: "No token provided" });

    const actualToken = token.split(" ")[1];
    const decoded = jwt.verify(actualToken, process.env.SECRET_KEY); // sync — throws on failure

    req.userId = decoded.id;

    const User = require('../models/user.model');
    const user = await User.findById(decoded.id).select('role');
    req.userRole = user?.role;

    next();
  } catch (error) {
    return res.status(401).json({ success: false, message: "Invalid token" });
  }
};
const adminOnly = (req, res, next) => {
  if (req.userRole !== 'admin') {
    return res.status(403).json({
      success: false,
      message: "Access denied. Admins only."
    });
  }
  next();
};

module.exports = { authMiddleware, adminOnly };
