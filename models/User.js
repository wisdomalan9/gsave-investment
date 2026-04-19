// FINAL models/User.js

const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
{
  name:{
    type:String,
    default:"User",
    trim:true
  },

  email:{
    type:String,
    required:true,
    unique:true,
    lowercase:true,
    trim:true
  },

  balance:{
    type:Number,
    default:0,
    min:0
  },

  cyt:{
    type:Number,
    default:0,
    min:0
  },

  withdrawable:{
    type:Number,
    default:0,
    min:0
  },

  investments:{
    type:[Object],
    default:[]
  },

  history:{
    type:[Object],
    default:[]
  },

  lastLogin:{
    type:Date,
    default:Date.now
  },

  status:{
    type:String,
    enum:["active","blocked"],
    default:"active"
  }
},
{
  timestamps:true
}
);

/* ===================================
   INDEX
=================================== */
userSchema.index({
  email:1
});

/* ===================================
   EXPORT
=================================== */
module.exports =
mongoose.model("User", userSchema);
