// FILE 5: routes/adminRoutes.js

const express = require("express");
const router = express.Router();
const User = require("../models/User");

/* ===================================
   SIMPLE ADMIN AUTH
=================================== */
router.use((req, res, next) => {
  const auth = req.headers.authorization;

  if (auth !== "admin123") {
    return res.status(403).json({
      success: false,
      msg: "Unauthorized"
    });
  }

  next();
});

/* ===================================
   GET ALL USERS
=================================== */
router.get("/users", async (req, res) => {
  try {
    const users = await User.find()
      .sort({ createdAt: -1 });

    res.json(users);

  } catch (err) {
    res.status(500).json({
      success: false,
      msg: "Failed to load users"
    });
  }
});

/* ===================================
   APPROVE DEPOSIT
   Adds money to wallet balance
=================================== */
router.post("/credit", async (req, res) => {
  try {
    const { email, amount } = req.body;

    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({
        success: false,
        msg: "User not found"
      });
    }

    const add = Number(amount || 0);

    if (add <= 0) {
      return res.status(400).json({
        success: false,
        msg: "Invalid amount"
      });
    }

    user.balance =
      Number(user.balance || 0) + add;

    user.history = user.history || [];

    user.history.unshift({
      type: "Admin Deposit",
      details: `₱${add.toLocaleString()} credited`,
      time: new Date().toLocaleString()
    });

    await user.save();

    res.json({
      success: true,
      msg: "Deposit Approved Successfully"
    });

  } catch (err) {
    res.status(500).json({
      success: false,
      msg: "Deposit failed"
    });
  }
});

/* ===================================
   PROCESS WITHDRAWAL
   Deducts from withdrawable balance
=================================== */
router.post("/withdraw", async (req, res) => {
  try {
    const { email, amount } = req.body;

    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({
        success: false,
        msg: "User not found"
      });
    }

    const take = Number(amount || 0);

    if (take <= 0) {
      return res.status(400).json({
        success: false,
        msg: "Invalid amount"
      });
    }

    if (Number(user.withdrawable || 0) < take) {
      return res.status(400).json({
        success: false,
        msg: "Insufficient withdrawable balance"
      });
    }

    user.withdrawable =
      Number(user.withdrawable || 0) - take;

    user.history = user.history || [];

    user.history.unshift({
      type: "Admin Withdrawal",
      details: `₱${take.toLocaleString()} paid out`,
      time: new Date().toLocaleString()
    });

    await user.save();

    res.json({
      success: true,
      msg: "Withdrawal Approved"
    });

  } catch (err) {
    res.status(500).json({
      success: false,
      msg: "Withdrawal failed"
    });
  }
});

/* ===================================
   DELETE USER
=================================== */
router.post("/delete", async (req, res) => {
  try {
    const { email } = req.body;

    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({
        success: false,
        msg: "User not found"
      });
    }

    await User.deleteOne({ email });

    res.json({
      success: true,
      msg: "User Deleted"
    });

  } catch (err) {
    res.status(500).json({
      success: false,
      msg: "Delete failed"
    });
  }
});

module.exports = router;
