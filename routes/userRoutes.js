const express = require("express");
const router = express.Router();
const User = require("../models/User");

/* =========================
   SAFE USER RESPONSE
========================= */
function cleanUser(user) {
  return {
    name: user.name || "User",
    email: user.email,
    balance: Number(user.balance || 0),
    cyt: Number(user.cyt || 0),
    withdrawable: Number(user.withdrawable || 0),
    investments: Array.isArray(user.investments) ? user.investments : [],
    history: Array.isArray(user.history) ? user.history : []
  };
}

/* =========================
   LOGIN / CREATE USER
========================= */
router.post("/login", async (req, res) => {
  try {
    const { name, email } = req.body;

    if (!email) {
      return res.status(400).json({ msg: "Email required" });
    }

    let user = await User.findOne({ email });

    if (!user) {
      user = await User.create({
        name: name || "User",
        email,
        balance: 0,
        cyt: 0,
        withdrawable: 0,
        investments: [],
        history: [],
        lastLogin: new Date()
      });
    } else {
      // backward compatibility
      if (user.balance == null) user.balance = 0;
      if (user.cyt == null) user.cyt = 0;
      if (user.withdrawable == null) user.withdrawable = 0;
      if (!Array.isArray(user.investments)) user.investments = [];
      if (!Array.isArray(user.history)) user.history = [];

      user.name = name || user.name;
      user.lastLogin = new Date();

      await user.save();
    }

    res.json(cleanUser(user));

  } catch (err) {
    console.log(err);
    res.status(500).json({ msg: "Login failed" });
  }
});

/* =========================
   UPDATE USER DATA
========================= */
router.post("/update", async (req, res) => {
  try {
    const {
      email,
      balance,
      cyt,
      withdrawable,
      investments,
      history
    } = req.body;

    if (!email) {
      return res.status(400).json({ msg: "Email required" });
    }

    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({ msg: "User not found" });
    }

    if (balance != null && !isNaN(balance)) {
      user.balance = Number(balance);
    }

    if (cyt != null && !isNaN(cyt)) {
      user.cyt = Number(cyt);
    }

    if (withdrawable != null && !isNaN(withdrawable)) {
      user.withdrawable = Number(withdrawable);
    }

    if (Array.isArray(investments)) {
      user.investments = investments;
    }

    if (Array.isArray(history)) {
      user.history = history;
    }

    await user.save();

    res.json({
      msg: "Updated successfully",
      user: cleanUser(user)
    });

  } catch (err) {
    console.log(err);
    res.status(500).json({ msg: "Update failed" });
  }
});

/* =========================
   GET USER
========================= */
router.get("/:email", async (req, res) => {
  try {
    const user = await User.findOne({
      email: req.params.email
    });

    if (!user) {
      return res.status(404).json({
        msg: "User not found"
      });
    }

    res.json(cleanUser(user));

  } catch (err) {
    res.status(500).json({
      msg: "Failed"
    });
  }
});

module.exports = router;
