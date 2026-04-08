const express = require("express");
const router = express.Router();
const User = require("../models/User");

// LOGIN / CREATE USER
router.post("/login", async (req, res) => {
    try {
        const { name, email } = req.body;

        let user = await User.findOne({ email });

        if (!user) {
            user = new User({
                name: name || "User",
                email,
                balance: 1000000,
                cyt: 0,
                investments: [],
                history: []
            });

            await user.save();
            console.log("✅ NEW USER CREATED:", email);
        } else {
            console.log("🔁 EXISTING USER:", email);
        }

        // 🔥 ALWAYS RETURN SAFE DATA
        res.json({
            name: user.name || "User",
            email: user.email,
            balance: Number(user.balance ?? 1000000),
            cyt: Number(user.cyt ?? 0),
            investments: Array.isArray(user.investments) ? user.investments : [],
            history: Array.isArray(user.history) ? user.history : []
        });

    } catch (err) {
        console.log("❌ LOGIN ERROR:", err);
        res.status(500).json({ error: "Server error" });
    }
});

// UPDATE USER DATA
router.post("/update", async (req, res) => {
    try {
        const { email, balance, cyt, investments, history } = req.body;

        let user = await User.findOneAndUpdate(
            { email },
            {
                balance: Number(balance),
                cyt: Number(cyt),
                investments: Array.isArray(investments) ? investments : [],
                history: Array.isArray(history) ? history : []
            },
            { returnDocument: "after" }
        );

        res.json(user);

    } catch (err) {
        console.log("❌ UPDATE ERROR:", err);
        res.status(500).json({ error: "Update failed" });
    }
});

module.exports = router;
