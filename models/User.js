const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
{
name:{
type:String,
default:"User"
},

email:{
type:String,
required:true,
unique:true
},

balance:{
type:Number,
default:0
},

cyt:{
type:Number,
default:0
},

withdrawable:{
type:Number,
default:0
},

investments:{
type:Array,
default:[]
},

history:{
type:Array,
default:[]
},

lastLogin:{
type:Date,
default:Date.now
},

status:{
type:String,
default:"active"
}
},
{
timestamps:true
}
);

module.exports = mongoose.model("User", userSchema);
