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

function showPopup(message, color = "#00c853") {
    const popup = document.getElementById("popup");
    if (!popup) return;

    // reset first
    popup.classList.remove("show");

    popup.innerText = message;
    popup.style.background = color;

    setTimeout(() => {
        popup.classList.add("show");
    }, 10);

    setTimeout(() => {
        popup.classList.remove("show");
    }, 3000);
}

// ✅ ADD HERE (RIGHT AFTER showPopup)

function simulateLoading(callback) {
    showPopup("Processing...");
    setTimeout(callback, 1200);
}

function showReceipt(title, details) {
    const box = document.getElementById("receipt");

    box.innerHTML = `
        <h3>${title}</h3>
        <p>${details}</p>
        <button onclick="closeReceipt()">OK</button>
    `;

    box.classList.add("show");
}

function closeReceipt() {
    document.getElementById("receipt").classList.remove("show");
}

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

        showPopup("Server connection failed", "#ff3d00");
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
    document.getElementById("balance").innerText = "₱" + window.balance.toLocaleString();
    document.getElementById("cytBalance").innerText = "CYT Balance: " + window.cyt;

    displayInvestments();
    displayHistory();
    updateAnalytics();
updateWithdrawable();
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
        showPopup("Minimum deposit is ₱2,900", "#ff3d00");
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
        showPopup("Enter valid amount", "#ff3d00");
        return;
    }

    if (amount > window.balance) {
        showPopup("Insufficient balance", "#ff3d00");
        return;
    }

    let tokens = Math.floor(amount / 500);

    if (tokens < 1) {
        showPopup("Minimum is ₱500 for 1 CYT", "#ff3d00");
        return;
    }

    simulateLoading(() => {
        window.balance -= tokens * 500;
        window.cyt += tokens;

        addHistory("Buy CYT", `Purchased ${tokens} CYT`);

        saveUserData();
        updateUI();

        showReceipt("Purchase Successful", `${tokens} CYT added`);
    });
} // ✅ THIS WAS MISSING

// 📈 INVEST
function invest() {
    let amount = parseInt(document.getElementById("investAmount").value);
    let plan = parseInt(document.getElementById("plan").value);

    if (!amount || amount < 6) {
        showPopup("Minimum investment is 6 CYT (₱2,900)", "#ff3d00");
        return;
    }

    if (amount > window.cyt) {
        showPopup("Not enough CYT", "#ff3d00");
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

const start = Date.now();
const duration = plan * 86400000;

investments.push({
    amount,
    plan,
    profit,
    status: "active",
    startTime: start,
    endTime: start + duration
});

    addHistory("Investment", `${amount} CYT for ${plan} days`);

    saveUserData();
    updateUI();

    showReceipt("Investment Successful", `${amount} CYT invested`);
}

// 💸 REQUEST WITHDRAW
function requestWithdraw(index) {
    let inv = investments[index];

    if (inv.status !== "completed") {
        showPopup("Investment not ready", "#ff3d00");
        return;
    }

    let totalCYT = inv.amount + inv.profit;
    let amountPHP = totalCYT * 500;

    if (amountPHP < 10000) {
        showPopup("Minimum withdrawal is ₱10,000", "#ff3d00");
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

let remaining = inv.endTime    ? inv.endTime - now    : (inv.startTime + (inv.plan * 86400000)) - now;
let totalDuration = (inv.endTime && inv.startTime)    ? inv.endTime - inv.startTime    : inv.plan * 86400000;

let progress = inv.startTime    ? Math.min(((now - inv.startTime) / totalDuration) * 100, 100)    : 0;

// ✅ MARK COMPLETE
if (progress >= 100 && inv.status !== "completed") {
    inv.status = "completed";
    saveUserData(); // ✅ ensures persistence
    remaining = 0;
}

// ⏱️ TIME FORMAT
let timeText = formatTime(remaining);

        let li = document.createElement("li");

li.innerHTML = `
    <div class="investment-card">
        <h4>${inv.amount} CYT</h4>
        <p>${inv.plan} Days Plan</p>

        <p style="color:${inv.status === 'completed' ? '#00c853' : '#ff3d00'};">
            Profit: ${calculateLiveProfit(inv).toLocaleString()} CYT
        </p>

        <p style="color:${inv.status === 'completed' ? '#00c853' : '#999'};">
            Total Value: ₱${((inv.amount + calculateLiveProfit(inv)) * 500).toLocaleString()}
        </p>

        <p>
            Status:
            <span style="color:${inv.status === 'completed' ? '#00c853' : '#ff3d00'}; font-weight:bold;">
                ${inv.status === 'completed' ? '✔ Completed' : '⏳ In Progress'}
            </span>
        </p>

        <!-- ⏱ COUNTDOWN -->
        <p class="countdown">${timeText}</p>

        <!-- ✅ ADD HERE -->
        <p style="font-size:12px; color:#888;">

Ends at: ${inv.endTime ? new Date(inv.endTime).toLocaleString() : "Calculating..."}

        </p>

        <!-- 📊 PROGRESS -->
        <div class="progress-bar">
            <div class="progress" style="width:${progress}%"></div>
        </div>

        ${inv.status === "completed"
            ? `<p style="color:green;">Ready for withdrawal</p>`
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

function calculateLiveProfit(inv) {
    if (!inv.startTime || !inv.endTime) return 0;

    let now = Date.now();

    let totalDuration = inv.endTime - inv.startTime;
    let elapsed = now - inv.startTime;

    if (elapsed < 0) return 0;
    if (elapsed > totalDuration) return inv.profit;

    let progress = elapsed / totalDuration;

    return Math.floor(inv.profit * progress);
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
        let icon =
            item.type === "Investment" ? "📈" :
            item.type === "Buy CYT" ? "🪙" :
            "💰";

        let li = document.createElement("li");

        li.innerHTML = `
            <div style="display:flex; justify-content:space-between;">
                <div>
                    <strong>${icon} ${item.type}</strong><br>
                    <small>${item.details}</small>
                </div>
                <div>
                    <small>${item.time}</small>
                </div>
            </div>
        `;

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

document.getElementById("totalInvested").innerText = totalInvested.toLocaleString();
document.getElementById("totalProfit").innerText = totalProfit.toLocaleString();
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

        showPopup("Account updated!");
    });
} // ✅ THIS WAS MISSING

function updateWithdrawable() {
    let total = 0;

    investments.forEach(inv => {
        if (inv.status === "completed") {
            let totalCYT = inv.amount + inv.profit;
            total += totalCYT * 500;
        }
    });

    document.getElementById("withdrawable").innerText =
        "Withdrawable: ₱" + total.toLocaleString();
}

function withdrawAll() {
    let total = 0;

    investments.forEach(inv => {
        if (inv.status === "completed") {
            let totalCYT = inv.amount + inv.profit;
            total += totalCYT * 500;
        }
    });

    if (total <= 0) {
        showPopup("No available balance to withdraw", "#ff3d00");
        return;
    }

    if (total < 10000) {
        showPopup("Minimum withdrawal is ₱10,000", "#ff3d00");
        return;
    }

    let commission = Math.floor(total * 0.3);
    let receive = total - commission;

    let message =
        `Hello Admin, I want to withdraw ₱${total.toLocaleString()}\n` +
        `Commission (30%): ₱${commission}\n` +
        `I will receive: ₱${receive}\n` +
        `Email: ${currentUser.email}`;

    window.open(`https://wa.me/17828611696?text=${encodeURIComponent(message)}`, "_blank");

    // REMOVE COMPLETED INVESTMENTS
    investments = investments.filter(inv => inv.status !== "completed");

    saveUserData();
    updateUI();
}

function generateFakeActivity() {
    const names = [
        "John", "Sarah", "Michael", "David", "Grace", "Daniel"
    ];

    const actions = [
        { text: "invested", icon: "📈" },
        { text: "withdrew", icon: "💸" },
        { text: "earned", icon: "💰" }
    ];

    const amounts = [10000, 20000, 50000, 75000, 120000];

    let name = names[Math.floor(Math.random() * names.length)];
    let action = actions[Math.floor(Math.random() * actions.length)];
    let amount = amounts[Math.floor(Math.random() * amounts.length)];

    return `${action.icon} ${name} ${action.text} ₱${amount.toLocaleString()}`;
}

// 🔁 AUTO REFRESH
setInterval(() => {
    updateWithdrawable();
    updateAnalytics();
}, 3000); // every 3 seconds

setInterval(() => {
    displayInvestments();
}, 1000); // keep smooth animation

setInterval(() => {
    const feed = document.getElementById("activityFeed");
    if (!feed) return;

    let li = document.createElement("li");
    li.innerText = generateFakeActivity();

feed.prepend(li);

// trigger animation
setTimeout(() => {
    li.classList.add("show");
}, 50);

    if (feed.children.length > 5) {
        feed.removeChild(feed.lastChild);
    }
}, 4000);

