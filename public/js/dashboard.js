// FILE 2: public/js/dashboard.js

console.log("✅ FINAL DASHBOARD JS LOADED");

/* ===================================
   FIREBASE CONFIG
=================================== */
const firebaseConfig = {
  apiKey: "AIzaSyCewm0z-8PA4JIvHR6WZ5QJZ1cTVfRPvXo",
  authDomain: "g-save-investment.firebaseapp.com",
  projectId: "g-save-investment",
  appId: "1:223920210175:web:719631a9fa002e17a98cca"
};

if (!firebase.apps.length) {
  firebase.initializeApp(firebaseConfig);
}

/* ===================================
   GLOBAL STATE
=================================== */
let currentUser = null;
let historyData = [];
let investments = [];
let chart = null;

let balance = 0;
let cyt = 0;
let withdrawable = 0;

/* ===================================
   SETTINGS
=================================== */
const CYT_RATE = 3000000; // ₱3,000,000 = 1 CYT

const PACKAGES = [
  { id: 1, peso: 1000, profit: 50000, hours: 6 },
  { id: 2, peso: 2000, profit: 100500, hours: 8 },
  { id: 3, peso: 3000, profit: 140000, hours: 10 },
  { id: 4, peso: 4000, profit: 210000, hours: 12 },
  { id: 5, peso: 5000, profit: 300000, hours: 16 },
  { id: 6, peso: 6000, profit: 370000, hours: 18 },
  { id: 7, peso: 7000, profit: 460000, hours: 24 },
  { id: 8, peso: 8000, profit: 580000, hours: 36 },
  { id: 9, peso: 9000, profit: 670000, hours: 48 },
  { id: 10, peso: 10000, profit: 750000, hours: 60 },
  { id: 11, peso: 20000, profit: 8300000, hours: 72 }
];

/* ===================================
   HELPERS
=================================== */
function php(v) {
  return "₱" + Number(v).toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
}

function phpToCYT(v) {
  return Number(v) / CYT_RATE;
}

function cytToPHP(v) {
  return Number(v) * CYT_RATE;
}

function showPopup(msg, color = "#16a34a") {
  const el = document.getElementById("popup");
  if (!el) return;

  el.innerText = msg;
  el.style.background = color;
  el.classList.add("show");

  setTimeout(() => {
    el.classList.remove("show");
  }, 2500);
}

function showReceipt(title, message) {
  const box = document.getElementById("receiptBox");
  const wrap = document.getElementById("receipt");

  box.innerHTML = `
    <h2>${title}</h2>
    <p style="margin:12px 0 20px;">${message}</p>
    <button class="primary-btn" onclick="closeReceipt()">OK</button>
  `;

  wrap.classList.remove("hidden");
}

function addHistory(type, details) {
  historyData.unshift({
    type,
    details,
    time: new Date().toLocaleString()
  });

  if (historyData.length > 50) {
    historyData.pop();
  }
}

function timeLeft(ms) {
  if (ms <= 0) return "Completed";

  let sec = Math.floor(ms / 1000);

  let d = Math.floor(sec / 86400);
  sec %= 86400;

  let h = Math.floor(sec / 3600);
  sec %= 3600;

  let m = Math.floor(sec / 60);
  sec %= 60;

  return `${d}d ${h}h ${m}m ${sec}s`;
}

/* ===================================
   SERVER API
=================================== */
async function syncUser(user) {
  try {
    const res = await fetch("/api/user/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        name: user.displayName || "User",
        email: user.email
      })
    });

    return await res.json();

  } catch (err) {
    showPopup("Server error", "#dc2626");
    return null;
  }
}

async function saveUserData() {
  if (!currentUser) return;

  try {
    await fetch("/api/user/update", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        email: currentUser.email,
        balance,
        cyt,
        withdrawable,
        investments,
        history: historyData
      })
    });

  } catch (err) {
    console.log("Save failed");
  }
}

/* ===================================
   AUTH
=================================== */
firebase.auth().onAuthStateChanged(async (user) => {

  if (!user) {
    window.location.href = "login.html";
    return;
  }

  document.getElementById("userEmail").innerText = user.email;

  const data = await syncUser(user);

  if (!data) return;

  currentUser = data;

  balance = Number(data.balance || 0);
  cyt = Number(data.cyt || 0);
  withdrawable = Number(data.withdrawable || 0);

  historyData = Array.isArray(data.history) ? data.history : [];
  investments = Array.isArray(data.investments) ? data.investments : [];

  loadPlans();
  updateUI();
  initChart();
});

/* ===================================
   LOAD PACKAGES
=================================== */
function loadPlans() {
  const select = document.getElementById("planSelect");
  if (!select) return;

  select.innerHTML = "";

  PACKAGES.forEach(pack => {
    const opt = document.createElement("option");

    opt.value = pack.id;

    const need = phpToCYT(pack.peso);

    opt.textContent =
      `${php(pack.peso)} (${need.toFixed(6)} CYT) → ${php(pack.profit)} / ${pack.hours}h`;

    select.appendChild(opt);
  });
}

/* ===================================
   UI RENDER
=================================== */
function updateUI() {
  document.getElementById("balance").innerText = php(balance);
  document.getElementById("cytBalance").innerText = cyt.toFixed(6);
  document.getElementById("withdrawable").innerText = php(withdrawable);

  renderInvestments();
  renderHistory();
  updateChart();
}

function renderHistory() {
  const box = document.getElementById("historyList");

  if (!historyData.length) {
    box.innerHTML = `<div class="empty">No transactions yet</div>`;
    return;
  }

  box.innerHTML = "";

  historyData.slice(0, 15).forEach(item => {
    box.innerHTML += `
      <div class="list-item">
        <strong>${item.type}</strong><br>
        ${item.details}<br>
        <small>${item.time}</small>
      </div>
    `;
  });
}

function renderInvestments() {
  const box = document.getElementById("investmentList");

  if (!investments.length) {
    box.innerHTML = `<div class="empty">No investments yet</div>`;
    return;
  }

  box.innerHTML = "";

  investments.forEach(inv => {

    const now = Date.now();
    const totalMs = inv.endTime - inv.startTime;
    const remain = inv.endTime - now;

    let progress = Math.min(
      ((now - inv.startTime) / totalMs) * 100,
      100
    );

    if (progress < 0) progress = 0;

    const liveProfit = inv.profit * (progress / 100);

    // mature package
    if (progress >= 100 && !inv.paid) {
      inv.paid = true;
      inv.status = "completed";

      withdrawable += inv.principal + inv.profit;

      addHistory(
        "Completed",
        `${php(inv.principal)} matured`
      );

      saveUserData();
    }

    box.innerHTML += `
      <div class="list-item">
        <strong>${php(inv.principal)} Package</strong><br>
        Status: ${inv.status}<br>
        Live Profit: ${php(liveProfit)}<br>
        Ends: ${new Date(inv.endTime).toLocaleString()}

        <div class="progress-wrap">
          <div class="progress-bar" style="width:${progress}%"></div>
        </div>

        <small>${timeLeft(remain)}</small>
      </div>
    `;
  });
}

/* ===================================
   ACTIONS
=================================== */
function requestDeposit() {
  const amount = Number(
    document.getElementById("depositAmount").value
  );

  if (amount < 1000) {
    showPopup("Minimum ₱1,000", "#dc2626");
    return;
  }

  const msg =
`G-SAVE INVESTMENT

Deposit Request
Amount: ${php(amount)}
Email: ${currentUser.email}`;

  window.open(
    "https://wa.me/239167404311?text=" +
    encodeURIComponent(msg),
    "_blank"
  );

  closeModal();

  showReceipt(
    "Deposit Request Sent",
    "Admin will approve and credit your wallet."
  );
}

async function buyCYT() {
  const amount = Number(
    document.getElementById("buyAmount").value
  );

  if (amount <= 0) {
    showPopup("Enter valid amount", "#dc2626");
    return;
  }

  if (amount > balance) {
    showPopup("Insufficient balance", "#dc2626");
    return;
  }

  const token = phpToCYT(amount);

  showPopup("Processing...");

  setTimeout(async () => {

    balance -= amount;
    cyt += token;

    addHistory(
      "Buy CYT",
      `${php(amount)} → ${token.toFixed(6)} CYT`
    );

    await saveUserData();

    updateUI();
    closeModal();

    showReceipt(
      "Purchase Successful",
      `${token.toFixed(6)} CYT added`
    );

  }, 1200);
}

async function invest() {
  const id = Number(
    document.getElementById("planSelect").value
  );

  const pack = PACKAGES.find(x => x.id === id);

  if (!pack) return;

  const tokenNeed = phpToCYT(pack.peso);

  if (cyt < tokenNeed) {
    showPopup("Not enough CYT", "#dc2626");
    return;
  }

  showPopup("Starting investment...");

  setTimeout(async () => {

    cyt -= tokenNeed;

    const start = Date.now();
    const end = start + (pack.hours * 60 * 60 * 1000);

    investments.unshift({
      id: Date.now(),
      principal: pack.peso,
      profit: pack.profit,
      tokenSpent: tokenNeed,
      startTime: start,
      endTime: end,
      status: "active",
      paid: false
    });

    addHistory(
      "Investment",
      `${php(pack.peso)} package started`
    );

    await saveUserData();

    updateUI();
    closeModal();

    showReceipt(
      "Investment Started",
      `${php(pack.peso)} now counting down`
    );

  }, 1500);
}

function withdrawAll() {
  if (withdrawable <= 0) {
    showPopup("No withdrawable funds", "#dc2626");
    return;
  }

  const msg =
`G-SAVE INVESTMENT

Withdrawal Request
Amount: ${php(withdrawable)}
Email: ${currentUser.email}`;

  window.open(
    "https://wa.me/239167404311?text=" +
    encodeURIComponent(msg),
    "_blank"
  );

  showReceipt(
    "Withdrawal Request Sent",
    "Admin will process your payout shortly."
  );
}

function logout() {
  firebase.auth().signOut().then(() => {
    window.location.href = "login.html";
  });
}

/* ===================================
   LIVE FEED
=================================== */
const feedNames = [
  "John","Maria","Grace","Kevin",
  "Anna","Pedro","James","Mark"
];

function generateFeed() {
  const box = document.getElementById("activityFeed");
  if (!box) return;

  const actions = ["invested", "withdrew", "earned"];

  const name =
    feedNames[Math.floor(Math.random() * feedNames.length)];

  const act =
    actions[Math.floor(Math.random() * actions.length)];

  const amount =
    php(Math.floor(Math.random() * 90000) + 10000);

  const item = document.createElement("div");
  item.className = "list-item";
  item.innerText = `${name} ${act} ${amount}`;

  box.prepend(item);

  while (box.children.length > 6) {
    box.removeChild(box.lastChild);
  }
}

/* ===================================
   CHART
=================================== */
function initChart() {
  const ctx = document.getElementById("profitChart");

  if (!ctx) return;

  chart = new Chart(ctx, {
    type: "line",
    data: {
      labels: [],
      datasets: [{
        data: [],
        borderColor: "#007dff",
        backgroundColor: "rgba(0,125,255,.12)",
        fill: true,
        tension: 0.4
      }]
    },
    options: {
      responsive: true,
      plugins: {
        legend: { display: false }
      },
      scales: {
        x: { display: false },
        y: { display: false }
      }
    }
  });
}

function updateChart() {
  if (!chart) return;

  let total = 0;

  investments.forEach(inv => {
    const now = Date.now();
    const totalMs = inv.endTime - inv.startTime;

    let progress = Math.min(
      ((now - inv.startTime) / totalMs) * 100,
      100
    );

    if (progress < 0) progress = 0;

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

/* ===================================
   LOOPS
=================================== */
setInterval(() => {
  updateUI();
}, 3000);

setInterval(() => {
  saveUserData();
}, 10000);

setInterval(() => {
  generateFeed();
}, 4000);
