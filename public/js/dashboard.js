console.log("🔥 FINAL DASHBOARD VERSION LOADED");

// 🔥 FIREBASE CONFIG
const firebaseConfig = {
  apiKey: "AIzaSyCewm0z-8PA4JIvHR6WZ5QJZ1cTVfRPvXo",
  authDomain: "g-save-investment.firebaseapp.com",
  projectId: "g-save-investment",
  appId: "1:223920210175:web:719631a9fa002e17a98cca"
};

if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
}

// 🌍 GLOBAL STATE
let currentUser = null;
let history = [];
let investments = [];

// 🔁 SYNC USER
async function syncUser(firebaseUser, retries = 3) {
    try {
        const res = await fetch("https://gsave-investment.onrender.com/api/user/login", {
            method: "POST",
            headers: {"Content-Type": "application/json"},
            body: JSON.stringify({
                name: firebaseUser.displayName || "User",
                email: firebaseUser.email
            })
        });

        const data = await res.json();
        if (!data || !data.email) throw new Error("Invalid response");

        return data;

    } catch (err) {
        console.log("❌ Sync failed:", err);

        if (retries > 0) return syncUser(firebaseUser, retries - 1);

        alert("Server connection failed");
        return null;
    }
}

// 💾 SAVE USER DATA
function saveUserData() {
    if (!currentUser) return;

    fetch("https://gsave-investment.onrender.com/api/user/update", {
        method: "POST",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify({
            email: currentUser.email,
            balance: Number(window.balance || 0),
            cyt: Number(window.cyt || 0),
            investments: investments || [],
            history: history || []
        })
    });
}

// 🔐 AUTH
firebase.auth().onAuthStateChanged(async (user) => {
    if (!user) {
        window.location.href = "login.html";
        return;
    }

    document.getElementById("userName").innerText = user.displayName || "User";
    document.getElementById("userEmail").innerText = user.email;

    const data = await syncUser(user);
    if (!data) return;

    currentUser = data;

    window.balance = Number(data.balance ?? 0);
    window.cyt = Number(data.cyt ?? 0);

    investments = Array.isArray(data.investments) ? data.investments : [];
    history = Array.isArray(data.history) ? data.history : [];

    updateUI();
});

// 🔄 UI UPDATE
function updateUI() {
    document.getElementById("balance").innerText = "₱" + window.balance;
    document.getElementById("cytBalance").innerText = "CYT Balance: " + window.cyt;

    displayInvestments();
    displayHistory();
    updateAnalytics();
}

// 🔓 LOGOUT
function logout() {
    firebase.auth().signOut().then(() => {
        window.location.href = "login.html";
    });
}

// 📲 REQUEST DEPOSIT (WHATSAPP ONLY)
function requestDeposit() {
    let amount = parseInt(document.getElementById("depositAmount").value);

    if (!amount || amount < 2900) {
        alert("Minimum deposit is ₱2,900");
        return;
    }

let message =
`G-SAVE INVESTMENT

Deposit Request
Amount: ₱${amount}

User Email: ${currentUser.email}

Please confirm once received.`;
    window.open(`https://wa.me/17828611696?text=${encodeURIComponent(message)}`, "_blank");
}

// 🪙 BUY CYT
function buyCYT() {
    let amount = parseInt(document.getElementById("amount").value);

    if (!amount || amount <= 0) {
        alert("Enter valid amount");
        return;
    }

    if (amount > window.balance) {
        alert("Insufficient balance");
        return;
    }

    let tokens = Math.floor(amount / 500);

    if (tokens < 1) {
        alert("Minimum is ₱500 for 1 CYT");
        return;
    }

    window.balance -= tokens * 500;
    window.cyt += tokens;

    addHistory("Buy CYT", `Purchased ${tokens} CYT`);

    saveUserData();
    updateUI();

    alert("Purchased " + tokens + " CYT");
}

// 📈 INVEST
function invest() {
    let amount = parseInt(document.getElementById("investAmount").value);
    let plan = parseInt(document.getElementById("plan").value);

    if (!amount || amount < 1) {
        alert("Minimum investment is 6 CYT (₱2,900)");
        return;
    }

    if (amount > window.cyt) {
        alert("Not enough CYT");
        return;
    }

let profitPercent =
    plan === 3 ? 50 :
    plan === 7 ? 70 :
    plan === 9 ? 90 :
    plan === 14 ? 120 :
    plan === 30 ? 300 : 0;

    let profit = Math.floor((amount * profitPercent) / 100);

    window.cyt -= amount;

    investments.push({
        amount,
        plan,
        profit,
        status: "active",
        startTime: Date.now(),
        duration: plan * 86400000
    });

    addHistory("Investment", `${amount} CYT for ${plan} days`);

    saveUserData();
    updateUI();

    alert("Investment successful!");
}

// 💸 REQUEST WITHDRAW
function requestWithdraw(index) {
    let inv = investments[index];

    if (inv.status !== "completed") {
        alert("Investment not ready");
        return;
    }

    let totalCYT = inv.amount + inv.profit;
    let amountPHP = totalCYT * 500;

    if (amountPHP < 10000) {
        alert("Minimum withdrawal is ₱10,000");
        return;
    }

    let commission = Math.floor(amountPHP * 0.3);
    let receive = amountPHP - commission;

    let message =
        `Hello Admin, I want to withdraw ₱${amountPHP}\n` +
        `Commission (30%): ₱${commission}\n` +
        `I will receive: ₱${receive}\n` +
        `Email: ${currentUser.email}`;

    window.open(`https://wa.me/17828611696?text=${encodeURIComponent(message)}`, "_blank");
}

// 📊 INVESTMENTS DISPLAY
function displayInvestments() {
    const list = document.getElementById("investmentList");
    if (!list) return;

    list.innerHTML = "";

    investments.forEach((inv, index) => {

        let now = Date.now();
if (!inv.startTime || !inv.duration) {
    inv.startTime = Date.now();
    inv.duration = inv.plan * 86400000;
}

let elapsed = now - inv.startTime;
let remaining = inv.duration - elapsed;
        let progress = Math.min((elapsed / inv.duration) * 100, 100).toFixed(2);

        // ✅ MARK COMPLETE
        if (progress >= 100) {
            inv.status = "completed";
            remaining = 0;
        }

        // ⏱️ TIME FORMAT
        let timeText = formatTime(remaining);

        let li = document.createElement("li");

        li.innerHTML = `
            <div class="investment-card">
                <h4>${inv.amount} CYT</h4>
                <p>${inv.plan} Days Plan</p>
                <p>Profit: ${inv.profit} CYT</p>
                <p>Status: ${inv.status}</p>

                <p class="countdown">${timeText}</p>

                <div class="progress-bar">
                    <div class="progress" style="width:${progress}%"></div>
                </div>

                ${inv.status === "completed"
                    ? `<button onclick="requestWithdraw(${index})" class="btn">Withdraw</button>`
                    : ""}
            </div>
        `;

        list.appendChild(li);
    });
}

function formatTime(ms) {
    if (ms <= 0) return "Completed";

    let totalSeconds = Math.floor(ms / 1000);

    let days = Math.floor(totalSeconds / 86400);
    let hours = Math.floor((totalSeconds % 86400) / 3600);
    let minutes = Math.floor((totalSeconds % 3600) / 60);
    let seconds = totalSeconds % 60;

    return `${days}d ${hours}h ${minutes}m ${seconds}s`;
}

// 📜 HISTORY
function addHistory(type, details) {
    history.unshift({
        type,
        details,
        time: new Date().toLocaleString()
    });
}

// 📜 DISPLAY HISTORY
function displayHistory() {
    const list = document.getElementById("historyList");
    if (!list) return;

    list.innerHTML = "";

    history.forEach(item => {
        let li = document.createElement("li");
        li.innerHTML = `<strong>${item.type}</strong> - ${item.details}<br><small>${item.time}</small>`;
        list.appendChild(li);
    });
}

// 📊 ANALYTICS
function updateAnalytics() {
    let totalInvested = 0;
    let totalProfit = 0;
    let activeCount = 0;

    investments.forEach(inv => {
        totalInvested += inv.amount;
        totalProfit += inv.profit;
        if (inv.status === "active") activeCount++;
    });

    document.getElementById("totalInvested").innerText = totalInvested;
document.getElementById("totalProfit").innerText = totalProfit;
document.getElementById("activeCount").innerText = activeCount;
}
function refreshAccount() {
    if (!firebase.auth().currentUser) return;

    syncUser(firebase.auth().currentUser).then(data => {
        if (!data) return;

        window.balance = Number(data.balance || 0);
        window.cyt = Number(data.cyt || 0);
        investments = data.investments || [];
        history = data.history || [];

        updateUI();

        alert("Account updated!");
    });
}

// 🔁 AUTO REFRESH
setInterval(() => {
    displayInvestments();
}, 50);
