const mongoose = require("mongoose");

let connectionPromise = null;

const connectDB = async () => {
  // Already connected
  if (mongoose.connection.readyState === 1) {
    return;
  }

  // Connection in progress
  if (connectionPromise) {
    return connectionPromise;
  }

  connectionPromise = mongoose
    .connect(process.env.MONGODB_URI)
    .then(() => {
      console.log("Database connected successfully");
    })
    .catch((err) => {
      connectionPromise = null;
      console.error("Database connection failed:", err);
      throw err;
    });

  return connectionPromise;
};

module.exports = connectDB;