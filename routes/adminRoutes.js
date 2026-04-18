const express = require("express");
const router = express.Router();
const User = require("../models/User");

// 🔐 SIMPLE ADMIN SECURITY
router.use((req,res,next)=>{

const auth = req.headers.authorization;

if(auth !== "admin123"){
return res.status(403).json({
msg:"Unauthorized"
});
}

next();
});

// 📦 GET ALL USERS
router.get("/users", async (req,res)=>{
try{

const users = await User.find().sort({createdAt:-1});

res.json(users);

}catch(err){
res.status(500).json({
msg:"Failed to load users"
});
}
});

// 💰 CREDIT USER (DEPOSIT APPROVAL)
router.post("/credit", async (req,res)=>{
try{

const { email, amount } = req.body;

const user = await User.findOne({ email });

if(!user){
return res.status(404).json({
msg:"User not found"
});
}

user.balance =
Number(user.balance || 0) + Number(amount);

await user.save();

res.json({
msg:"Deposit Approved Successfully"
});

}catch(err){
res.status(500).json({
msg:"Deposit failed"
});
}
});

// 💸 PROCESS WITHDRAWAL
router.post("/withdraw", async (req,res)=>{
try{

const { email, amount } = req.body;

const user = await User.findOne({ email });

if(!user){
return res.status(404).json({
msg:"User not found"
});
}

if(Number(user.balance || 0) < Number(amount)){
return res.status(400).json({
msg:"Insufficient balance"
});
}

user.balance =
Number(user.balance || 0) - Number(amount);

await user.save();

res.json({
msg:"Withdrawal Approved"
});

}catch(err){
res.status(500).json({
msg:"Withdrawal failed"
});
}
});

// ❌ DELETE USER
router.post("/delete", async (req,res)=>{
try{

const { email } = req.body;

await User.deleteOne({ email });

res.json({
msg:"User Deleted"
});

}catch(err){
res.status(500).json({
msg:"Delete failed"
});
}
});

module.exports = router;
