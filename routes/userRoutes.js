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
                balance: 0,
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
    balance: Number(user.balance ?? 0),
    cyt: Number(user.cyt ?? 0),
    investments: Array.isArray(user.investments) ? user.investments : [],
    history: Array.isArray(user.history) ? user.history : [],

    depositRequests: Array.isArray(user.depositRequests) ? user.depositRequests : [],
    withdrawRequests: Array.isArray(user.withdrawRequests) ? user.withdrawRequests : []
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

router.post("/request-deposit", async (req, res) => {
    try {
        const { email, amount } = req.body;

        const user = await User.findOne({ email });
if (!user) {
    return res.status(404).json({ error: "User not found" });
}

        user.depositRequests.push({
            amount: Number(amount),
            status: "pending",
            date: new Date()
        });

        await user.save();

        res.json({ message: "Deposit request sent" });

    } catch (err) {
        res.status(500).json({ error: "Failed" });
    }
});

router.post("/request-withdraw", async (req, res) => {

    try {
        const { email, amount } = req.body;

const user = await User.findOne({ email });

if (!user) {
    return res.status(404).json({ error: "User not found" });
}

        user.withdrawRequests.push({
            amount: Number(amount),
            status: "pending",
            date: new Date()
        });

        await user.save();

        res.json({ message: "Withdraw request sent" });

    } catch (err) {
        res.status(500).json({ error: "Failed" });
    }
});

router.post("/approve-deposit", async (req, res) => {
    try {
        const { email, index } = req.body;

        const user = await User.findOne({ email });
if (!user) {
    return res.status(404).json({ error: "User not found" });
}

if (!user.depositRequests[index]) {
    return res.status(400).json({ error: "Invalid request" });
}

let request = user.depositRequests[index];

        if (!request || request.status !== "pending") {
            return res.status(400).json({ error: "Invalid request" });
        }

        request.status = "approved";

        user.balance = Number(user.balance || 0) + Number(request.amount || 0);

        user.history.unshift({
            type: "Deposit Approved",
            details: `₱${request.amount} added`,
            time: new Date().toLocaleString()
        });

        await user.save();

        res.json({ message: "Deposit approved" });

    } catch (err) {
        res.status(500).json({ error: "Error" });
    }
});

router.post("/reject-deposit", async (req, res) => {
    try {
        const { email, index } = req.body;

        const user = await User.findOne({ email });
if (!user) {
    return res.status(404).json({ error: "User not found" });
}

if (!user.depositRequests[index]) {
    return res.status(400).json({ error: "Invalid request" });
}

        user.depositRequests[index].status = "rejected";

        await user.save();

        res.json({ message: "Rejected" });

    } catch (err) {
        res.status(500).json({ error: "Error" });
    }
});

router.post("/approve-withdraw", async (req, res) => {
    try {
        const { email, index } = req.body;

        const user = await User.findOne({ email });
if (!user) {
    return res.status(404).json({ error: "User not found" });
}

if (!user.withdrawRequests[index]) {
    return res.status(400).json({ error: "Invalid request" });
}

let request = user.withdrawRequests[index];

        if (!request || request.status !== "pending") {
            return res.status(400).json({ error: "Invalid request" });
        }

        if (user.balance < request.amount) {
            return res.status(400).json({ error: "Insufficient balance" });
        }

        request.status = "approved";

        user.balance = Number(user.balance || 0) - Number(request.amount || 0);

        user.history.unshift({
            type: "Withdraw Approved",
            details: `₱${request.amount} sent`,
            time: new Date().toLocaleString()
        });

        await user.save();

        res.json({ message: "Withdraw approved" });

    } catch (err) {
        res.status(500).json({ error: "Error" });
    }
});

router.post("/reject-withdraw", async (req, res) => {
    try {
        const { email, index } = req.body;

        const user = await User.findOne({ email });

if (!user) {
    return res.status(404).json({ error: "User not found" });
}

if (!user.withdrawRequests[index]) {
    return res.status(400).json({ error: "Invalid request" });
}

        user.withdrawRequests[index].status = "rejected";

        await user.save();

        res.json({ message: "Rejected" });

    } catch (err) {
        res.status(500).json({ error: "Error" });
    }
});
module.exports = router;
