// FINAL admin.js
// Firebase Frontend + Render Backend

console.log("✅ FINAL ADMIN PANEL LOADED");

/* ===================================
   CONFIG
=================================== */
const API =
"https://gsave-investment.onrender.com/api/admin";

const ADMIN_PASS = "admin123";

/* ===================================
   ACCESS GATE
=================================== */
const entered =
prompt("Enter Admin Password");

if(entered !== ADMIN_PASS){
  alert("Access Denied");
  location.href = "index.html";
}

/* ===================================
   HELPERS
=================================== */
function php(v){
  return "₱" + Number(v).toLocaleString(undefined,{
    minimumFractionDigits:2,
    maximumFractionDigits:2
  });
}

function popup(msg,color="#16a34a"){

  const el =
    document.getElementById("popup");

  if(!el) return;

  el.innerText = msg;
  el.style.background = color;
  el.classList.add("show");

  setTimeout(()=>{
    el.classList.remove("show");
  },2500);
}

function authHeaders(){
  return {
    "Content-Type":"application/json",
    "Authorization":ADMIN_PASS
  };
}

/* ===================================
   LOAD USERS
=================================== */
async function loadUsers(){

  try{

    const res = await fetch(
      API + "/users",
      {
        headers:{
          "Authorization":ADMIN_PASS
        }
      }
    );

    const users =
      await res.json();

    if(!Array.isArray(users)){
      popup("Failed","#dc2626");
      return;
    }

    renderStats(users);
    renderUsers(users);

  }catch(err){
    popup("Server error","#dc2626");
  }
}

/* ===================================
   STATS
=================================== */
function renderStats(users){

  let totalBal = 0;
  let totalCYT = 0;
  let active = 0;

  users.forEach(u=>{

    totalBal +=
      Number(u.balance || 0);

    totalCYT +=
      Number(u.cyt || 0);

    if(
      Array.isArray(u.investments) &&
      u.investments.length
    ){
      active++;
    }

  });

  document.getElementById(
    "totalUsers"
  ).innerText = users.length;

  document.getElementById(
    "totalBalance"
  ).innerText = php(totalBal);

  document.getElementById(
    "totalCYT"
  ).innerText = totalCYT.toFixed(6);

  document.getElementById(
    "activeUsers"
  ).innerText = active;
}

/* ===================================
   TABLE
=================================== */
function renderUsers(users){

  const box =
    document.getElementById("userTable");

  if(!box) return;

  if(!users.length){
    box.innerHTML =
    `<tr>
      <td colspan="7">
        No users found
      </td>
    </tr>`;
    return;
  }

  box.innerHTML = "";

  users.forEach(user=>{

    const email =
      user.email || "-";

    const inv =
      Array.isArray(user.investments)
      ? user.investments.length
      : 0;

    box.innerHTML += `
      <tr>
        <td>${user.name || "User"}</td>
        <td>${email}</td>
        <td>${php(user.balance || 0)}</td>
        <td>${Number(user.cyt || 0).toFixed(6)}</td>
        <td>${php(user.withdrawable || 0)}</td>
        <td>${inv}</td>

        <td>

          <button
          class="small-btn green"
          onclick="creditUser('${email}')">
          Deposit
          </button>

          <button
          class="small-btn blue"
          onclick="withdrawUser('${email}')">
          Withdraw
          </button>

          <button
          class="small-btn red"
          onclick="deleteUser('${email}')">
          Delete
          </button>

        </td>
      </tr>
    `;
  });
}

/* ===================================
   CREDIT USER
=================================== */
async function creditUser(email){

  const amount =
    prompt("Enter amount");

  if(!amount) return;

  try{

    const res = await fetch(
      API + "/credit",
      {
        method:"POST",
        headers:authHeaders(),
        body:JSON.stringify({
          email,
          amount:Number(amount)
        })
      }
    );

    const data =
      await res.json();

    popup(
      data.msg ||
      "Deposit approved"
    );

    loadUsers();

  }catch(err){
    popup("Failed","#dc2626");
  }
}

/* ===================================
   WITHDRAW USER
=================================== */
async function withdrawUser(email){

  const amount =
    prompt("Enter amount");

  if(!amount) return;

  try{

    const res = await fetch(
      API + "/withdraw",
      {
        method:"POST",
        headers:authHeaders(),
        body:JSON.stringify({
          email,
          amount:Number(amount)
        })
      }
    );

    const data =
      await res.json();

    if(!res.ok){
      popup(
        data.msg ||
        "Failed",
        "#dc2626"
      );
      return;
    }

    popup(
      data.msg ||
      "Withdrawal approved"
    );

    loadUsers();

  }catch(err){
    popup("Failed","#dc2626");
  }
}

/* ===================================
   DELETE USER
=================================== */
async function deleteUser(email){

  const yes =
    confirm("Delete user?");

  if(!yes) return;

  try{

    const res = await fetch(
      API + "/delete",
      {
        method:"POST",
        headers:authHeaders(),
        body:JSON.stringify({
          email
        })
      }
    );

    const data =
      await res.json();

    popup(
      data.msg ||
      "Deleted",
      "#dc2626"
    );

    loadUsers();

  }catch(err){
    popup("Failed","#dc2626");
  }
}

/* ===================================
   SEARCH
=================================== */
function searchUser(){

  const q =
    document.getElementById(
      "searchEmail"
    )
    .value
    .toLowerCase();

  const rows =
    document.querySelectorAll(
      "#userTable tr"
    );

  rows.forEach(row=>{

    row.style.display =
      row.innerText
      .toLowerCase()
      .includes(q)
      ? ""
      : "none";
  });
}

/* ===================================
   LOGOUT
=================================== */
function logoutAdmin(){
  location.href = "index.html";
}

/* ===================================
   START
=================================== */
loadUsers();

setInterval(()=>{
  loadUsers();
},15000);
