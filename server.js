require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const userRoutes = require("./routes/userRoutes");
const path = require("path");

const app = express();

// 🔐 MIDDLEWARE
app.use(cors());
app.use(express.json());

// 🔗 API ROUTES
app.use("/api/user", userRoutes);

// 🌐 SERVE FRONTEND FILES
app.use(express.static(path.join(__dirname, "public")));

// 🔌 CONNECT MONGODB
const MONGO_URI = process.env.MONGO_URI;

console.log("🔗 Connecting to MongoDB...");

mongoose.connect(MONGO_URI)
.then(() => console.log("✅ MongoDB Connected Successfully"))
.catch(err => {
    console.log("❌ MongoDB Connection Error:");
    console.log(err);
});

// ✅ TEST API ROUTE
app.get("/api", (req, res) => {
    res.send("API running...");
});

// ✅ CATCH-ALL ROUTE (MUST BE LAST)
app.get("/*", (req, res) => {
    res.sendFile(path.join(__dirname, "public", "dashboard.html"));
});

// 🚀 START SERVER
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log("🚀 Server running on port " + PORT);
});
