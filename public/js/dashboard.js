// FINAL G-SAVE DASHBOARD JS (FULL MERGED + SAFE CURRENCY CORE)

console.log("✅ G-SAVE DASHBOARD LOADED - FULL SYSTEM READY + CURRENCY FIX");

/* ===============================
   FIREBASE
=============================== */
const firebaseConfig = {
  apiKey: "AIzaSyCewm0z-8PA4JIvHR6WZ5QJZ1cTVfRPvXo",
  authDomain: "g-save-investment.firebaseapp.com",
  projectId: "g-save-investment",
  appId: "1:223920210175:web:719631a9fa002e17a98cca"
};

if (!firebase.apps.length) firebase.initializeApp(firebaseConfig);

/* ===============================
   API
=============================== */
const API = "https://gsave-investment.onrender.com/api/user";

/* ===============================
   ADMIN WHATSAPP (UPDATED)
=============================== */
const ADMIN_WHATSAPP = "15488577219";

/* ===============================
   GLOBAL CURRENCY ENGINE (FIXED)
=============================== */
const CURRENCY = {
  symbol: "₱",
  allowed: ["₱", "₦", "$", "PHP", "php", "naira", "NAIRA"],
};

/* normalize ANY old stored value */
function normalizeCurrencyValue(val) {
  if (typeof val === "number") return val;
  if (!val) return 0;

  let str = String(val);

  CURRENCY.allowed.forEach(s => {
    str = str.replaceAll(s, "");
  });

  return Number(str.replace(/,/g, "")) || 0;
}

/* SAFE FORMATTER (ONLY ONE SOURCE OF TRUTH) */
function formatMoney(value) {
  const num = normalizeCurrencyValue(value);

  return (
    CURRENCY.symbol +
    num.toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })
  );
}

/* clean old database text receipts */
function cleanCurrencyText(text) {
  if (!text) return text;

  let cleaned = String(text);

  CURRENCY.allowed.forEach(sym => {
    cleaned = cleaned.split(sym).join(CURRENCY.symbol);
  });

  return cleaned;
}

/* ===============================
   STATE
=============================== */
let currentUser = null;
let balance = 0;
let cyt = 0;
let withdrawable = 0;
let historyData = [];
let investments = [];
let chart = null;

/* ===============================
   MULTI-STEP STATE
=============================== */
let depositStep = 1;
let withdrawStep = 1;

let depositForm = { amount: 0, method: "" };
let withdrawForm = {
  amount: 0,
  bankName: "",
  accountNumber: "",
  accountName: ""
};

let activeReceipt = null;

/* ===============================
   SETTINGS
=============================== */
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

/* ===============================
   HELPERS
=============================== */
function php(v) {
  return formatMoney(v);
}

function phpToCYT(v) {
  return Number(v) / CYT_RATE;
}

function popup(msg, color = "#16a34a") {
  const el = document.getElementById("popup");
  if (!el) return;
  el.innerText = msg;
  el.style.background = color;
  el.classList.add("show");
  setTimeout(() => el.classList.remove("show"), 2500);
}

function receipt(title, msg) {
  const box = document.getElementById("receiptBox");
  const wrap = document.getElementById("receipt");

  box.innerHTML = `
    <h2>${title}</h2>
    <p style="margin:12px 0 20px; white-space:pre-line;">${msg}</p>
    <button class="primary-btn" onclick="closeReceipt()">OK</button>
  `;

  wrap.classList.remove("hidden");
}

/* ===============================
   RECEIPT SYSTEM
=============================== */
function generateReceiptId(type) {
  const prefix = type === "deposit" ? "DEP" : "WTH";
  const random = Math.floor(100000 + Math.random() * 900000);
  return `GSV-${prefix}-${random}`;
}

function buildReceipt(type, data) {
  const id = generateReceiptId(type);

  const title =
    type === "deposit"
      ? "G-SAVE DEPOSIT RECEIPT"
      : "G-SAVE WITHDRAWAL RECEIPT";

  const message = `
${title}

Receipt ID: ${id}
Name: ${currentUser?.name || "User"}
Email: ${currentUser?.email || ""}

Amount: ${formatMoney(data.amount)}
Method: ${data.method || "N/A"}

${
  type === "withdrawal"
    ? `
Bank Details:
${data.bankName || ""} ${data.accountNumber || ""} ${data.accountName || ""}
`
    : ""
}

Date: ${new Date().toLocaleString()}

Status: PENDING
`;

  return { id, message };
}

function sendToWhatsApp(message) {
  const url =
    "https://wa.me/" +
    ADMIN_WHATSAPP +
    "?text=" +
    encodeURIComponent(message);

  window.open(url, "_blank");
}

/* ===============================
   HISTORY
=============================== */
function addHistory(type, details) {
  historyData.unshift({
    type,
    details: cleanCurrencyText(details),
    time: new Date().toLocaleString(),
  });

  if (historyData.length > 50) historyData.pop();
}

/* ===============================
   AUTH
=============================== */
firebase.auth().onAuthStateChanged(async (user) => {
  if (!user) {
    window.location.replace("login.html");
    return;
  }

  document.getElementById("userEmail").innerText = user.email;

  const res = await fetch(API + "/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      name: user.displayName || "User",
      email: user.email,
    }),
  });

  const data = await res.json();

  currentUser = data;

  /* FIX OLD CURRENCY HERE */
  balance = normalizeCurrencyValue(data.balance);
  cyt = normalizeCurrencyValue(data.cyt);
  withdrawable = normalizeCurrencyValue(data.withdrawable);

  historyData = (data.history || []).map((h) => ({
    ...h,
    details: cleanCurrencyText(h.details),
  }));

  investments = data.investments || [];

  loadPlans();
  updateUI();
  initChart();
});

/* ===============================
   UI
=============================== */
function updateUI() {
  document.getElementById("balance").innerText = php(balance);
  document.getElementById("cytBalance").innerText = cyt.toFixed(6);
  document.getElementById("withdrawable").innerText = php(withdrawable);

  renderHistory();
  renderInvestments();
  updateChart();
}

function renderHistory() {
  const box = document.getElementById("historyList");

  if (!historyData.length) {
    box.innerHTML = `<div class="empty">No transactions yet</div>`;
    return;
  }

  box.innerHTML = "";

  historyData.slice(0, 15).forEach((h) => {
    box.innerHTML += `
      <div class="list-item">
        <strong>${h.type}</strong><br>
        ${h.details}<br>
        <small>${h.time}</small>
      </div>
    `;
  });
}

/* ===============================
   INVESTMENTS
=============================== */
function renderInvestments() {
  const box = document.getElementById("investmentList");

  if (!investments.length) {
    box.innerHTML = `<div class="empty">No investments yet</div>`;
    return;
  }

  box.innerHTML = "";

  investments.forEach((inv) => {
    const now = Date.now();
    const total = inv.endTime - inv.startTime;
    const left = inv.endTime - now;

    let progress = Math.min(((now - inv.startTime) / total) * 100, 100);
    if (progress < 0) progress = 0;

    const liveProfit = inv.profit * (progress / 100);

    if (progress >= 100 && !inv.paid) {
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

        <div class="progress-wrap">
          <div class="progress-bar" style="width:${progress}%"></div>
        </div>

        <small>${timeLeft(left)}</small>
      </div>
    `;
  });
}

/* ===============================
   LOAD PLANS
=============================== */
function loadPlans() {
  const select = document.getElementById("planSelect");
  select.innerHTML = "";

  PACKAGES.forEach((p) => {
    const opt = document.createElement("option");
    opt.value = p.id;
    opt.textContent = `${php(p.peso)} → ${php(p.profit)} / ${p.hours}h`;
    select.appendChild(opt);
  });
}

/* ===============================
   INVEST / BUY / FLOW
=============================== */
function buyCYT() {
  const amount = Number(document.getElementById("buyAmount").value);

  if (amount <= 0 || amount > balance) {
    popup("Invalid amount", "#dc2626");
    return;
  }

  const token = phpToCYT(amount);

  balance -= amount;
  cyt += token;

  addHistory("Buy CYT", `${php(amount)} → ${token.toFixed(6)} CYT`);

  updateUI();
  popup("CYT Purchased");
}

function invest() {
  const id = Number(document.getElementById("planSelect").value);
  const pack = PACKAGES.find((x) => x.id === id);

  if (!pack) return;

  const need = phpToCYT(pack.peso);

  if (cyt < need) {
    popup("Not enough CYT", "#dc2626");
    return;
  }

  cyt -= need;

  const start = Date.now();
  const end = start + pack.hours * 3600000;

  investments.unshift({
    id: Date.now(),
    principal: pack.peso,
    profit: pack.profit,
    startTime: start,
    endTime: end,
    status: "active",
    paid: false,
  });

  addHistory("Investment", `${php(pack.peso)} package started`);

  updateUI();
  popup("Investment Started");
}

/* ===============================
   CHART + FEED
=============================== */
function initChart() {
  const ctx = document.getElementById("profitChart");
  if (!ctx) return;

  chart = new Chart(ctx, {
    type: "line",
    data: { labels: [], datasets: [{ data: [], fill: true }] },
    options: { responsive: true, plugins: { legend: { display: false } } },
  });
}

function updateChart() {
  if (!chart) return;

  let total = 0;

  investments.forEach((inv) => {
    const now = Date.now();
    const max = inv.endTime - inv.startTime;

    let progress = Math.min(((now - inv.startTime) / max) * 100, 100);
    total += inv.profit * (progress / 100);
  });

  chart.data.labels.push("");
  chart.data.datasets[0].data.push(total);

  if (chart.data.labels.length > 12) {
    chart.data.labels.shift();
    chart.data.datasets[0].data.shift();
  }

  chart.update();
}

const names = ["John", "Grace", "Kevin", "Pedro", "Anna", "James", "Mark", "Liza"];

function feed() {
  const box = document.getElementById("activityFeed");
  if (!box) return;

  const acts = ["invested", "earned", "withdrew"];
  const item = document.createElement("div");

  item.innerText =
    names[Math.floor(Math.random() * names.length)] +
    " " +
    acts[Math.floor(Math.random() * acts.length)];

  box.prepend(item);
}

/* ===============================
   MODALS CONTROL (MISSING FIX)
=============================== */

function openDepositModal(){
  const m = document.getElementById("depositModal");
  if(m) m.classList.remove("hidden");
}

function openWithdrawModal(){
  const m = document.getElementById("withdrawModal");
  if(m) m.classList.remove("hidden");
}

function closeModal(){
  const d = document.getElementById("depositModal");
  const w = document.getElementById("withdrawModal");

  if(d) d.classList.add("hidden");
  if(w) w.classList.add("hidden");

  depositStep = 1;
  withdrawStep = 1;
}

function closeReceipt(){
  const r = document.getElementById("receipt");
  if(r) r.classList.add("hidden");
}
/* ===============================
   LOOPS
=============================== */
setInterval(updateUI, 3000);
setInterval(feed, 4000);
