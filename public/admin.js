// FILE 4: public/admin.js

console.log("✅ ADMIN PANEL LOADED");

/* ===================================
   CONFIG
=================================== */
const API = "/api/admin";
const ADMIN_PASS = "admin123";

/* ===================================
   SIMPLE ACCESS GATE
=================================== */
const entered = prompt("Enter Admin Password");

if (entered !== ADMIN_PASS) {
  alert("Access Denied");
  window.location.href = "/";
}

/* ===================================
   HELPERS
=================================== */
function php(v) {
  return "₱" + Number(v).toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
}

function showPopup(msg, color = "#16a34a") {
  const pop = document.getElementById("popup");
  if (!pop) return;

  pop.innerText = msg;
  pop.style.background = color;
  pop.classList.add("show");

  setTimeout(() => {
    pop.classList.remove("show");
  }, 2500);
}

function authHeaders() {
  return {
    "Content-Type": "application/json",
    "Authorization": ADMIN_PASS
  };
}

/* ===================================
   LOAD USERS
=================================== */
async function loadUsers() {

  try {
    const res = await fetch(API + "/users", {
      headers: {
        "Authorization": ADMIN_PASS
      }
    });

    const users = await res.json();

    if (!Array.isArray(users)) {
      showPopup("Failed to load users", "#dc2626");
      return;
    }

    renderUsers(users);
    renderStats(users);

  } catch (err) {
    showPopup("Server error", "#dc2626");
  }
}

/* ===================================
   STATS
=================================== */
function renderStats(users) {

  document.getElementById("totalUsers").innerText =
    users.length;

  let totalBalance = 0;
  let totalCYT = 0;
  let active = 0;

  users.forEach(u => {

    totalBalance += Number(u.balance || 0);
    totalCYT += Number(u.cyt || 0);

    if (
      Array.isArray(u.investments) &&
      u.investments.length > 0
    ) {
      active++;
    }

  });

  document.getElementById("totalBalance").innerText =
    php(totalBalance);

  document.getElementById("totalCYT").innerText =
    totalCYT.toFixed(6);

  document.getElementById("activeUsers").innerText =
    active;
}

/* ===================================
   TABLE
=================================== */
function renderUsers(users) {

  const table = document.getElementById("userTable");

  if (!users.length) {
    table.innerHTML =
      `<tr><td colspan="7" class="empty">No users found</td></tr>`;
    return;
  }

  table.innerHTML = "";

  users.forEach(user => {

    const name = user.name || "User";
    const email = user.email || "-";
    const balance = php(user.balance || 0);
    const cyt = Number(user.cyt || 0).toFixed(6);
    const wd = php(user.withdrawable || 0);

    const invCount =
      Array.isArray(user.investments)
        ? user.investments.length
        : 0;

    table.innerHTML += `
      <tr>
        <td>${name}</td>
        <td>${email}</td>
        <td>${balance}</td>
        <td>${cyt}</td>
        <td>${wd}</td>
        <td>${invCount}</td>

        <td>
          <div class="action-row">

            <button
              class="small-btn green"
              onclick="creditUser('${email}')"
            >
              Deposit
            </button>

            <button
              class="small-btn blue"
              onclick="withdrawUser('${email}')"
            >
              Withdraw
            </button>

            <button
              class="small-btn red"
              onclick="deleteUser('${email}')"
            >
              Delete
            </button>

          </div>
        </td>

      </tr>
    `;
  });
}

/* ===================================
   CREDIT USER
=================================== */
async function creditUser(email) {

  const amount = prompt(
    "Enter deposit amount to approve:"
  );

  if (!amount) return;

  try {
    const res = await fetch(API + "/credit", {
      method: "POST",
      headers: authHeaders(),
      body: JSON.stringify({
        email,
        amount: Number(amount)
      })
    });

    const data = await res.json();

    showPopup(
      data.msg || "Deposit approved"
    );

    loadUsers();

  } catch (err) {
    showPopup("Failed", "#dc2626");
  }
}

/* ===================================
   WITHDRAW USER
=================================== */
async function withdrawUser(email) {

  const amount = prompt(
    "Enter withdrawal amount:"
  );

  if (!amount) return;

  try {
    const res = await fetch(API + "/withdraw", {
      method: "POST",
      headers: authHeaders(),
      body: JSON.stringify({
        email,
        amount: Number(amount)
      })
    });

    const data = await res.json();

    if (!res.ok) {
      showPopup(data.msg || "Failed", "#dc2626");
      return;
    }

    showPopup(
      data.msg || "Withdrawal approved"
    );

    loadUsers();

  } catch (err) {
    showPopup("Failed", "#dc2626");
  }
}

/* ===================================
   DELETE USER
=================================== */
async function deleteUser(email) {

  const yes = confirm(
    "Delete this user permanently?"
  );

  if (!yes) return;

  try {
    const res = await fetch(API + "/delete", {
      method: "POST",
      headers: authHeaders(),
      body: JSON.stringify({
        email
      })
    });

    const data = await res.json();

    showPopup(
      data.msg || "Deleted",
      "#dc2626"
    );

    loadUsers();

  } catch (err) {
    showPopup("Failed", "#dc2626");
  }
}

/* ===================================
   SEARCH
=================================== */
function searchUser() {

  const q =
    document.getElementById("searchEmail")
    .value
    .toLowerCase()
    .trim();

  const rows =
    document.querySelectorAll("#userTable tr");

  rows.forEach(row => {

    const txt =
      row.innerText.toLowerCase();

    row.style.display =
      txt.includes(q) ? "" : "none";
  });
}

/* ===================================
   LOGOUT
=================================== */
function logoutAdmin() {
  window.location.href = "/";
}

/* ===================================
   AUTO START
=================================== */
loadUsers();

setInterval(() => {
  loadUsers();
}, 15000);
