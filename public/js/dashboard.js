console.log("🔥 DASHBOARD JS LOADED");
const firebaseConfig = {
  apiKey: "AIzaSyCewm0z-8PA4JIvHR6WZ5QJZ1cTVfRPvXo",
  authDomain: "g-save-investment.firebaseapp.com",
  projectId: "g-save-investment",
  appId: "1:223920210175:web:719631a9fa002e17a98cca"
};

if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
}

// GLOBAL STATE
let currentUser = null;
let history = [];
let investments = [];

// 🔥 FORCE SYNC WITH RETRY
async function syncUser(firebaseUser, retries = 3) {
    try {
        console.log("🚀 Syncing user to backend...");

        const res = await fetch("http://10.68.16.165:5000/api/user/login", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                name: firebaseUser.displayName || "User",
                email: firebaseUser.email
            })
        });

        const data = await res.json();

        if (!data || !data.email) throw new Error("Invalid response");

        console.log("✅ User synced:", data);

        return data;

    } catch (err) {
        console.log("❌ Sync failed. Retries left:", retries);

        if (retries > 0) {
            return await syncUser(firebaseUser, retries - 1);
        } else {
            alert("Server connection failed");
            return null;
        }
    }
}

// SAVE TO DATABASE
function saveUserData() {
    if (!currentUser) return;

    fetch("http://10.68.16.165:5000/api/user/update", {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            email: currentUser.email,
            balance: Number(window.balance),
            cyt: Number(window.cyt),
            investments: investments,
            history: history
        })
    });
}

// 🔐 AUTH (FINAL STABLE VERSION)
firebase.auth().onAuthStateChanged(async (user) => {
    if (!user) {
        window.location.href = "login.html";
        return;
    }

    document.getElementById("userName").innerText = user.displayName || "User";
    document.getElementById("userEmail").innerText = user.email;

    // 🔥 ALWAYS SYNC USER
    const data = await syncUser(user);
    if (!data) return;

    currentUser = data;

    // 🔥 NO NaN EVER
    window.balance = Number(data.balance ?? 1000000);
    window.cyt = Number(data.cyt ?? 0);

    investments = Array.isArray(data.investments) ? data.investments : [];
    history = Array.isArray(data.history) ? data.history : [];

    document.getElementById("balance").innerText = "₱" + window.balance;
    document.getElementById("cytBalance").innerText = "CYT Balance: " + window.cyt;

    displayInvestments();
    displayHistory();
    updateAnalytics();
});

// LOGOUT
function logout() {
    firebase.auth().signOut().then(() => {
        window.location.href = "login.html";
    });
}

// DEPOSIT
function deposit() {
    let amount = parseInt(document.getElementById("depositAmount").value);

    if (!amount || amount <= 0) {
        alert("Enter valid amount");
        return;
    }

    window.balance = Number(window.balance) + amount;

    document.getElementById("balance").innerText = "₱" + window.balance;

    addHistory("Deposit", `Added ₱${amount}`);
    saveUserData();

    alert("Deposit successful!");
}

// BUY CYT
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

    let tokens = Math.floor(amount / 2500);

    if (tokens < 1) {
        alert("Minimum is ₱2500 for 1 CYT");
        return;
    }

    window.balance = Number(window.balance) - (tokens * 2500);
    window.cyt = Number(window.cyt) + tokens;

    document.getElementById("balance").innerText = "₱" + window.balance;
    document.getElementById("cytBalance").innerText = "CYT Balance: " + window.cyt;

    addHistory("Buy CYT", `Purchased ${tokens} CYT`);
    saveUserData();

    alert("Successfully purchased " + tokens + " CYT");
}

// DISPLAY INVESTMENTS
function displayInvestments() {
    const list = document.getElementById("investmentList");
    if (!list) return;

    list.innerHTML = "";

    investments.forEach((inv, index) => {

        let elapsed = Date.now() - inv.startTime;
        let progress = (elapsed / inv.duration) * 100;

        if (progress >= 100) {
            progress = 100;
            inv.status = "completed";
        }

        let timeLeft = inv.duration - elapsed;

        let days = Math.max(0, Math.floor(timeLeft / (1000 * 60 * 60 * 24)));
        let hours = Math.max(0, Math.floor((timeLeft / (1000 * 60 * 60)) % 24));
        let minutes = Math.max(0, Math.floor((timeLeft / (1000 * 60)) % 60));

        let li = document.createElement("li");

        li.innerHTML = `
            <div class="investment-card">
                <h4>${inv.amount} CYT</h4>
                <p>${inv.plan} days plan</p>
                <p>Profit: ${inv.profit} CYT</p>
                <p>Status: ${inv.status}</p>
                <p>Time Left: ${days}d ${hours}h ${minutes}m</p>

                <div class="progress-bar">
                    <div class="progress" style="width: ${progress}%"></div>
                </div>

                ${inv.status === "completed"
                    ? `<button onclick="withdraw(${index})">Request Withdraw</button>`
                    : ""}

                ${inv.status === "pending"
                    ? `<button onclick="approveWithdraw(${index})">Approve (Admin)</button>`
                    : ""}
            </div>
        `;

        list.appendChild(li);
    });

    updateAnalytics();
}

// INVEST
function invest() {
    let amount = parseInt(document.getElementById("investAmount").value);
    let plan = parseInt(document.getElementById("plan").value);

    if (!amount || amount <= 0) {
        alert("Enter valid CYT amount");
        return;
    }

    if (amount > window.cyt) {
        alert("Not enough CYT");
        return;
    }

    let profitPercent =
        plan === 7 ? 30 :
        plan === 14 ? 60 :
        plan === 21 ? 90 :
        plan === 30 ? 95 :
        plan === 60 ? 150 : 200;

    let profit = Math.floor((amount * profitPercent) / 100);

    window.cyt = Number(window.cyt) - amount;

    let newInvestment = {
        amount,
        plan,
        profit,
        status: "active",
        startTime: Date.now(),
        duration: plan * 24 * 60 * 60 * 1000
    };

    investments.push(newInvestment);

    document.getElementById("cytBalance").innerText = "CYT Balance: " + window.cyt;

    addHistory("Investment", `${amount} CYT for ${plan} days`);
    saveUserData();

    displayInvestments();

    alert("Investment successful!");
}

// WITHDRAW
function withdraw(index) {
    let inv = investments[index];

    if (inv.status !== "completed") {
        alert("Investment not ready");
        return;
    }

    inv.status = "pending";

    saveUserData();
    displayInvestments();

    alert("Withdraw request submitted!");
}

// APPROVE
function approveWithdraw(index) {
    let inv = investments[index];

    if (inv.status !== "pending") return;

    let totalCYT = inv.amount + inv.profit;
    let phpValue = totalCYT * 2500;

    window.balance = Number(window.balance) + phpValue;

    investments.splice(index, 1);

    document.getElementById("balance").innerText = "₱" + window.balance;

    addHistory("Withdraw", `Received ₱${phpValue}`);
    saveUserData();

    displayInvestments();

    alert("Withdraw approved!");
}

// HISTORY
function addHistory(type, details) {
    history.unshift({
        type,
        details,
        time: new Date().toLocaleString()
    });

    displayHistory();
}

// DISPLAY HISTORY
function displayHistory() {
    const list = document.getElementById("historyList");
    if (!list) return;

    list.innerHTML = "";

    history.forEach((item) => {
        let li = document.createElement("li");
        li.innerHTML = `
            <strong>${item.type}</strong> - ${item.details}
            <br><small>${item.time}</small>
        `;
        list.appendChild(li);
    });
}

// ANALYTICS
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

// AUTO REFRESH
setInterval(displayInvestments, 1000);
