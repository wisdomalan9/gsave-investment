const API = "https://gsave-investment.onrender.com/api/admin";
const AUTH = "admin123";

// 🔐 SIMPLE ADMIN LOGIN
const pass = prompt("Enter Admin Password");

if (pass !== AUTH) {
alert("Access Denied");
window.location.href = "/";
}

// 🔔 POPUP
function showPopup(msg,color="#16a34a"){
const p = document.getElementById("popup");
p.innerText = msg;
p.style.background = color;
p.classList.add("show");

setTimeout(()=>{
    p.classList.remove("show");
},2500);

}

// 📦 LOAD USERS
async function loadUsers(){
try{
const res = await fetch(API + "/users",{
headers:{ Authorization: AUTH }
});

const users = await res.json();

renderUsers(users);
loadStats(users);

}catch(err){
showPopup("Failed loading users","#dc2626");
}
}

// 📊 STATS
function loadStats(users){

document.getElementById("totalUsers").innerText = users.length;

let bal = 0;
let cyt = 0;
let active = 0;

users.forEach(u=>{
bal += Number(u.balance || 0);
cyt += Number(u.cyt || 0);

if((u.investments || []).length > 0) active++;
});

document.getElementById("totalBalance").innerText =
"₱" + bal.toLocaleString();

document.getElementById("totalCYT").innerText =
cyt.toFixed(6);

document.getElementById("activeUsers").innerText =
active;
}

// 📋 TABLE
function renderUsers(users){

const table = document.getElementById("userTable");

if(!users.length){
table.innerHTML = "<tr><td colspan="6">No users found</td></tr>";
return;
}

table.innerHTML = "";

users.forEach(user=>{

table.innerHTML += `

<tr>
<td>${user.name || "User"}</td>
<td>${user.email}</td>
<td>₱${Number(user.balance||0).toLocaleString()}</td>
<td>${Number(user.cyt||0).toFixed(6)}</td>
<td>${(user.investments||[]).length}</td><td>
<button class="action-btn green"
onclick="credit('${user.email}')">
Deposit
</button><button class="action-btn blue"
onclick="withdraw('${user.email}')">
Withdraw
</button>

<button class="action-btn red"
onclick="removeUser('${user.email}')">
Delete
</button>

</td>
</tr>
`;
});
}// 💰 CREDIT USER
async function credit(email){

const amount = prompt("Enter deposit amount");

if(!amount) return;

const res = await fetch(API + "/credit",{
method:"POST",
headers:{
"Content-Type":"application/json",
Authorization: AUTH
},
body:JSON.stringify({
email,
amount:Number(amount)
})
});

const data = await res.json();

showPopup(data.msg || "Credited");
loadUsers();
}

// 💸 WITHDRAW USER
async function withdraw(email){

const amount = prompt("Enter withdrawal amount");

if(!amount) return;

const res = await fetch(API + "/withdraw",{
method:"POST",
headers:{
"Content-Type":"application/json",
Authorization: AUTH
},
body:JSON.stringify({
email,
amount:Number(amount)
})
});

const data = await res.json();

showPopup(data.msg || "Processed");
loadUsers();
}

// ❌ DELETE USER
async function removeUser(email){

if(!confirm("Delete this user?")) return;

const res = await fetch(API + "/delete",{
method:"POST",
headers:{
"Content-Type":"application/json",
Authorization: AUTH
},
body:JSON.stringify({email})
});

const data = await res.json();

showPopup(data.msg || "Deleted","#dc2626");
loadUsers();
}

// 🔍 SEARCH
function searchUser(){

const val =
document.getElementById("searchEmail")
.value
.toLowerCase();

const rows =
document.querySelectorAll("#userTable tr");

rows.forEach(row=>{
row.style.display =
row.innerText.toLowerCase().includes(val)
? ""
: "none";
});
}

// 🚪 LOGOUT
function logoutAdmin(){
window.location.href = "/";
}

// AUTO LOAD
loadUsers();
setInterval(loadUsers,10000);
