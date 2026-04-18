console.log("🔥 ADMIN PANEL LOADED");

// 🔥 FIREBASE CONFIG
const firebaseConfig = {
apiKey: "AIzaSyCewm0z-8PA4JIvHR6WZ5QJZ1cTVfRPvXo",
authDomain: "g-save-investment.firebaseapp.com",
projectId: "g-save-investment",
appId: "1:223920210175:web:719631a9fa002e17a98cca"
};

if (!firebase.apps.length) firebase.initializeApp(firebaseConfig);

// 🔐 CHECK ADMIN
firebase.auth().onAuthStateChanged(async (user) => {
if (!user) {
location.href = "login.html";
return;
}

if (user.email !== "gsaveadmin@gmail.com") {
    alert("Access denied");
    location.href = "dashboard.html";
    return;
}

document.getElementById("adminInfo").innerText =
    "Logged in as: " + user.email;

loadUsers();

});

// 📥 LOAD USERS
async function loadUsers() {
const res = await fetch("/api/admin/users", {
headers: {
"Authorization": "admin123"
}
});

const users = await res.json();

const list = document.getElementById("userList");
list.innerHTML = "";

users.forEach(user => {
    let li = document.createElement("li");

    li.innerHTML = `
        <div style="border:1px solid #ccc; padding:10px; margin:10px;">
            <strong>${user.email}</strong><br>
            Balance: ₱${user.balance || 0}<br>
            CYT: ${user.cyt || 0}<br><br>

            <input type="number" placeholder="Deposit ₱" id="dep-${user._id}">
            <button onclick="approveDeposit('${user._id}')">Approve Deposit</button>

            <br><br>

            <input type="number" placeholder="Withdraw ₱" id="wit-${user._id}">
            <button onclick="approveWithdraw('${user._id}')">Approve Withdraw</button>
        </div>
    `;

    list.appendChild(li);
});

}

// ✅ APPROVE DEPOSIT
async function approveDeposit(userId) {
let amount = document.getElementById("dep-" + userId).value;

await fetch("/api/admin/deposit", {
    method: "POST",
    headers: {
        "Content-Type": "application/json",
        "Authorization": "admin123"
    },
    body: JSON.stringify({ userId, amount })
});

alert("Deposit approved");
loadUsers();

}

// ✅ APPROVE WITHDRAW
async function approveWithdraw(userId) {
let amount = document.getElementById("wit-" + userId).value;

await fetch("/api/admin/withdraw", {
    method: "POST",
    headers: {
        "Content-Type": "application/json",
        "Authorization": "admin123"
    },
    body: JSON.stringify({ userId, amount })
});

alert("Withdrawal approved");
loadUsers();

}

// 🔓 LOGOUT
function logout() {
firebase.auth().signOut().then(() => {
location.href = "login.html";
});
}
