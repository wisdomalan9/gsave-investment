const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema({
    name: {
        type: String,
        default: "User"
    },

    email: {
        type: String,
        required: true,
        unique: true
    },

    balance: {
        type: Number,
        default: 0
    },

    cyt: {
        type: Number,
        default: 0
    },

    investments: {
        type: Array,
        default: []
    },

    history: {
        type: Array,
        default: []
    },

    // 🆕 NEW
    depositRequests: {
        type: Array,
        default: []
    },

    withdrawRequests: {
        type: Array,
        default: []
    }
});

module.exports = mongoose.model("User", UserSchema);
