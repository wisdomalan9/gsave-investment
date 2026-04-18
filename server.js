// FINAL server.js
// Firebase Frontend + Render Backend + MongoDB

require("dotenv").config();

const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const path = require("path");

const userRoutes = require("./routes/userRoutes");
const adminRoutes = require("./routes/adminRoutes");

const app = express();

/* ===================================
   CORS (Firebase Frontend Allowed)
=================================== */
app.use(cors({
  origin: true,
  credentials: true
}));

/* ===================================
   BODY PARSER
=================================== */
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({
  extended: true
}));

/* ===================================
   STATIC FILES (Optional Backup)
=================================== */
app.use(express.static(
  path.join(__dirname, "public")
));

/* ===================================
   HEALTH CHECK
=================================== */
app.get("/", (req,res)=>{
  res.json({
    success:true,
    message:"G-SAVE Backend Running"
  });
});

app.get("/api", (req,res)=>{
  res.json({
    success:true,
    message:"API Live"
  });
});

/* ===================================
   API ROUTES
=================================== */
app.use("/api/user", userRoutes);
app.use("/api/admin", adminRoutes);

/* ===================================
   OPTIONAL PAGE ROUTES
   (If opening Render URL manually)
=================================== */
app.get("/home", (req,res)=>{
  res.sendFile(
    path.join(__dirname,"public","index.html")
  );
});

app.get("/login", (req,res)=>{
  res.sendFile(
    path.join(__dirname,"public","login.html")
  );
});

app.get("/dashboard", (req,res)=>{
  res.sendFile(
    path.join(__dirname,"public","dashboard.html")
  );
});

app.get("/admin", (req,res)=>{
  res.sendFile(
    path.join(__dirname,"public","admin.html")
  );
});

/* ===================================
   404
=================================== */
app.use((req,res)=>{
  res.status(404).json({
    success:false,
    message:"Route not found"
  });
});

/* ===================================
   DATABASE
=================================== */
mongoose.connect(process.env.MONGO_URI,{
  autoIndex:true
})

.then(()=>{
  console.log("✅ MongoDB Connected");
})

.catch(err=>{
  console.log("❌ Mongo Error:");
  console.log(err.message);
});

/* ===================================
   SERVER START
=================================== */
const PORT =
  process.env.PORT || 5000;

app.listen(PORT,"0.0.0.0",()=>{
  console.log(
    "🚀 Server running on port " + PORT
  );
});
