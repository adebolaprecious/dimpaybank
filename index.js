const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
require("dotenv").config();

const app = express();

// Middleware
const cors = require("cors");

app.use(
  cors({
    origin: [
      "http://localhost:5173",
      "https://dimpaybankfr-tde6.vercel.app",
    ],
    credentials: true,
  })
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static("public"));

// Database Connection
const connectDB = require("./database/connectDB");
connectDB();

// Routes
const userRoute = require("./routes/user.route");
app.use("/api/v1", userRoute);

const transferRoute = require("./routes/transfer.route");
app.use("/api/v1/wallet", transferRoute);

const walletRoute = require("./routes/wallet.route");
app.use("/api/v1/wallet", walletRoute);

// Start Server
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

// Vercel Export
module.exports = async (req, res) => {
  await connectDB();
  return app(req, res);
};