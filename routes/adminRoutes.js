// FINAL SECURITY PATCHES
// Apply these upgrades safely

/* =====================================================
   FILE: routes/adminRoutes.js
   Replace entire file
===================================================== */

const express = require("express");
const router = express.Router();
const User = require("../models/User");

/* ===================================
   ENV ADMIN PASSWORD
=================================== */
const ADMIN_PASS =
process.env.ADMIN_PASS || "admin123";

/* ===================================
   SAFE USER RESPONSE
=================================== */
function cleanUser(user){
  return {
    name: user.name || "User",
    email: user.email,
    balance: Number(user.balance || 0),
    cyt: Number(user.cyt || 0),
    withdrawable: Number(user.withdrawable || 0),
    investments: Array.isArray(user.investments)
      ? user.investments.length
      : 0,
    createdAt: user.createdAt || null
  };
}

/* ===================================
   ADMIN AUTH
=================================== */
router.use((req,res,next)=>{

  const auth =
    req.headers.authorization;

  if(auth !== ADMIN_PASS){
    return res.status(403).json({
      success:false,
      msg:"Unauthorized"
    });
  }

  next();
});

/* ===================================
   GET USERS
=================================== */
router.get("/users", async(req,res)=>{

  try{

    const users = await User.find()
      .sort({createdAt:-1});

    res.json(
      users.map(cleanUser)
    );

  }catch(err){
    res.status(500).json({
      success:false,
      msg:"Failed to load users"
    });
  }
});

/* ===================================
   CREDIT USER
=================================== */
router.post("/credit", async(req,res)=>{

  try{

    const { email, amount } =
      req.body;

    const add =
      Number(amount || 0);

    if(!email || add <= 0){
      return res.status(400).json({
        success:false,
        msg:"Invalid request"
      });
    }

    const user =
      await User.findOne({email});

    if(!user){
      return res.status(404).json({
        success:false,
        msg:"User not found"
      });
    }

    user.balance =
      Number(user.balance || 0) + add;

    user.history =
      Array.isArray(user.history)
      ? user.history
      : [];

    user.history.unshift({
      type:"Admin Deposit",
      details:`₱${add.toLocaleString()} credited`,
      time:new Date().toLocaleString()
    });

    await user.save();

    res.json({
      success:true,
      msg:"Deposit Approved"
    });

  }catch(err){
    res.status(500).json({
      success:false,
      msg:"Deposit failed"
    });
  }
});

/* ===================================
   WITHDRAW USER
=================================== */
router.post("/withdraw", async(req,res)=>{

  try{

    const { email, amount } =
      req.body;

    const take =
      Number(amount || 0);

    if(!email || take <= 0){
      return res.status(400).json({
        success:false,
        msg:"Invalid request"
      });
    }

    const user =
      await User.findOne({email});

    if(!user){
      return res.status(404).json({
        success:false,
        msg:"User not found"
      });
    }

    if(
      Number(user.withdrawable || 0)
      < take
    ){
      return res.status(400).json({
        success:false,
        msg:"Insufficient balance"
      });
    }

    user.withdrawable =
      Number(user.withdrawable || 0)
      - take;

    user.history =
      Array.isArray(user.history)
      ? user.history
      : [];

    user.history.unshift({
      type:"Admin Withdrawal",
      details:`₱${take.toLocaleString()} paid`,
      time:new Date().toLocaleString()
    });

    await user.save();

    res.json({
      success:true,
      msg:"Withdrawal Approved"
    });

  }catch(err){
    res.status(500).json({
      success:false,
      msg:"Withdrawal failed"
    });
  }
});

/* ===================================
   DELETE USER
=================================== */
router.post("/delete", async(req,res)=>{

  try{

    const { email } = req.body;

    if(!email){
      return res.status(400).json({
        success:false,
        msg:"Email required"
      });
    }

    await User.deleteOne({email});

    res.json({
      success:true,
      msg:"User Deleted"
    });

  }catch(err){
    res.status(500).json({
      success:false,
      msg:"Delete failed"
    });
  }
});

module.exports = router;
