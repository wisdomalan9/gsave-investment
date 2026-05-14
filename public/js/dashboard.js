// ===============================
// G-SAVE FINAL DASHBOARD (FULL FIX)
// ===============================
console.log("✅ FULL DASHBOARD LOADED");

/* FIREBASE */
const firebaseConfig = {
  apiKey: "AIzaSyCewm0z-8PA4JIvHR6WZ5QJZ1cTVfRPvXo",
  authDomain: "g-save-investment.firebaseapp.com",
  projectId: "g-save-investment",
  appId: "1:223920210175:web:719631a9fa002e17a98cca"
};
if (!firebase.apps.length) firebase.initializeApp(firebaseConfig);

/* ADMIN WHATSAPP */
const ADMIN_WHATSAPP = "15488577219";

/* API */
const API = "https://gsave-investment.onrender.com/api/user";

/* CURRENCY ENGINE */
const CURRENCY_SYMBOL = "₱";
function money(v){
  v = Number(String(v).replace(/[^\d.]/g,''))||0;
  return CURRENCY_SYMBOL + v.toLocaleString(undefined,{minimumFractionDigits:2});
}

/* STATE */
let currentUser=null;
let balance=0;
let withdrawable=0;
let cyt=0;
let historyData=[];
let investments=[];

/* POPUP */
function popup(msg,color="#16a34a"){
  const el=document.getElementById("popup");
  el.innerText=msg;
  el.style.background=color;
  el.classList.add("show");
  setTimeout(()=>el.classList.remove("show"),2500);
}

/* RECEIPT VIEW */
function receipt(title,msg){
  document.getElementById("receiptBox").innerHTML=
  `<h2>${title}</h2><p style="white-space:pre-line">${msg}</p>
  <button class="primary-btn" onclick="closeReceipt()">OK</button>`;
  document.getElementById("receipt").classList.remove("hidden");
}

/* WHATSAPP SEND */
function sendToWhatsApp(message){
  window.open("https://wa.me/"+ADMIN_WHATSAPP+"?text="+encodeURIComponent(message),"_blank");
}

/* RECEIPT GENERATOR */
function receiptID(type){
  const p=type=="deposit"?"DEP":"WTH";
  return "GSV-"+p+"-"+Math.floor(100000+Math.random()*900000);
}

/* ===============================
   AUTH LOAD
=============================== */
firebase.auth().onAuthStateChanged(async(user)=>{
  if(!user){window.location="login.html";return;}
  document.getElementById("userEmail").innerText=user.email;

  const res=await fetch(API+"/login",{method:"POST",
  headers:{'Content-Type':'application/json'},
  body:JSON.stringify({name:user.displayName||"User",email:user.email})});
  const data=await res.json();

  currentUser=data;
  balance=Number(data.balance)||0;
  withdrawable=Number(data.withdrawable)||0;
  cyt=Number(data.cyt)||0;

  document.getElementById("balance").innerText=money(balance);
  document.getElementById("withdrawable").innerText=money(withdrawable);
  document.getElementById("cytBalance").innerText=cyt.toFixed(6);
});

/* ===============================
   DEPOSIT FLOW
=============================== */
function depositNext(){
  const amount=Number(document.getElementById("depositAmount").value);
  const method=document.getElementById("depositMethod").value;

  if(amount<1000){popup("Minimum ₱1,000","#dc2626");return;}

  const id=receiptID("deposit");

  const msg=
`G-SAVE DEPOSIT RECEIPT

Receipt ID: ${id}
Email: ${currentUser.email}
Amount: ${money(amount)}
Method: ${method}
Status: PENDING`;

  receipt("Deposit Receipt",msg);
  sendToWhatsApp(msg);
}

/* ===============================
   WITHDRAW FLOW
=============================== */
function withdrawNext(){
  const amount=Number(document.getElementById("withdrawAmount").value||withdrawable);
  const bank=document.getElementById("bankName").value;
  const acc=document.getElementById("accountNumber").value;
  const name=document.getElementById("accountName").value;

  if(amount>withdrawable){popup("Insufficient balance","#dc2626");return;}
  if(!bank||!acc||!name){popup("Enter bank details","#dc2626");return;}

  const id=receiptID("withdraw");

  const msg=
`G-SAVE WITHDRAWAL RECEIPT

Receipt ID: ${id}
Email: ${currentUser.email}
Amount: ${money(amount)}

Bank: ${bank}
Acct: ${acc}
Name: ${name}

Status: PENDING`;

  receipt("Withdrawal Receipt",msg);
  sendToWhatsApp(msg);
}

/* LOGOUT */
function logout(){firebase.auth().signOut();}
