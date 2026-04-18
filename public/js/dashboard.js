console.log("🔥 FINAL CLEAN DASHBOARD LOADED");

/* ===============================
FIREBASE
================================= */
const firebaseConfig = {
apiKey: "AIzaSyCewm0z-8PA4JIvHR6WZ5QJZ1cTVfRPvXo",
authDomain: "g-save-investment.firebaseapp.com",
projectId: "g-save-investment",
appId: "1:223920210175:web:719631a9fa002e17a98cca"
};

if (!firebase.apps.length) firebase.initializeApp(firebaseConfig);

/* ===============================
GLOBAL STATE
================================= */
let currentUser = null;
let history = [];
let investments = [];
let chart = null;

window.balance = 0;       // peso wallet
window.cyt = 0;           // cyber token
window.withdrawable = 0;  // ready to withdraw

/* ===============================
SETTINGS
================================= */
const CYT_RATE = 3000000; // ₱3,000,000 = 1 CYT

const PACKAGES = [
{id:1, peso:1000,  profit:50000,   hours:6},
{id:2, peso:2000,  profit:100500,  hours:8},
{id:3, peso:3000,  profit:140000,  hours:10},
{id:4, peso:4000,  profit:210000,  hours:12},
{id:5, peso:5000,  profit:300000,  hours:16},
{id:6, peso:6000,  profit:370000,  hours:18},
{id:7, peso:7000,  profit:460000,  hours:24},
{id:8, peso:8000,  profit:580000,  hours:36},
{id:9, peso:9000,  profit:670000,  hours:48},
{id:10,peso:10000, profit:750000,  hours:60},
{id:11,peso:20000, profit:8300000, hours:72}
];

/* ===============================
HELPERS
================================= */
function php(n){
return "₱" + Number(n).toLocaleString(undefined,{
minimumFractionDigits:2,
maximumFractionDigits:2
});
}

function phpToCYT(v){
return Number(v) / CYT_RATE;
}

function cytToPHP(v){
return Number(v) * CYT_RATE;
}

function showPopup(msg,color="#16a34a"){
const el = document.getElementById("popup");
if(!el) return;
el.innerText = msg;
el.style.background = color;
el.classList.add("show");
setTimeout(()=>el.classList.remove("show"),2500);
}

function showReceipt(title,text){
const wrap = document.getElementById("receipt");
const box = document.getElementById("receiptBox");

box.innerHTML = `

   <h2>${title}</h2>
   <p style="margin:10px 0 18px;">${text}</p>
   <button class="primary" onclick="closeReceipt()">OK</button>
 `;
 wrap.classList.add("show");
}function closeReceipt(){
document.getElementById("receipt").classList.remove("show");
}

function closeModal(){
document.querySelectorAll(".modal").forEach(m=>m.classList.remove("show"));
}

function addHistory(type,details){
history.unshift({
type,
details,
time:new Date().toLocaleString()
});
if(history.length > 50) history.pop();
}

/* ===============================
LOAD PACKAGES
================================= */
function loadPlans(){
const select = document.getElementById("planSelect");
if(!select) return;

select.innerHTML = "";

PACKAGES.forEach(p=>{
const option = document.createElement("option");
option.value = p.id;

const token = phpToCYT(p.peso);

option.textContent =
"${php(p.peso)} (${token.toFixed(6)} CYT) → ${php(p.profit)} / ${p.hours}h";

select.appendChild(option);
});
}

/* ===============================
SERVER SYNC
================================= */
async function syncUser(firebaseUser){
try{
const res = await fetch("/api/user/login",{
method:"POST",
headers:{ "Content-Type":"application/json" },
body:JSON.stringify({
name:firebaseUser.displayName || "User",
email:firebaseUser.email
})
});

return await res.json();

}catch(err){
showPopup("Server error","#dc2626");
return null;
}
}

async function saveUserData(){
if(!currentUser) return;

await fetch("/api/user/update",{
method:"POST",
headers:{ "Content-Type":"application/json" },
body:JSON.stringify({
email:currentUser.email,
balance:window.balance,
cyt:window.cyt,
withdrawable:window.withdrawable,
investments,
history
})
});
}

/* ===============================
AUTH
================================= */
firebase.auth().onAuthStateChanged(async user=>{

if(!user){
location.href = "login.html";
return;
}

document.getElementById("userEmail").innerText = user.email;

const data = await syncUser(user);
if(!data) return;

currentUser = data;

window.balance      = Number(data.balance || 0);
window.cyt          = Number(data.cyt || 0);
window.withdrawable = Number(data.withdrawable || 0);

history = Array.isArray(data.history) ? data.history : [];
investments = Array.isArray(data.investments) ? data.investments : [];

loadPlans();
updateUI();
initChart();
});

/* ===============================
UI
================================= */
function updateUI(){

document.getElementById("balance").innerText = php(window.balance);
document.getElementById("cytBalance").innerText =
"CYT Balance: " + window.cyt.toFixed(6);

document.getElementById("withdrawable").innerText =
"Withdrawable: " + php(window.withdrawable);

renderInvestments();
renderHistory();
updateChart();
}

/* ===============================
DEPOSIT
================================= */
function requestDeposit(){

const amount = Number(
document.getElementById("depositAmount").value
);

if(amount < 1000){
showPopup("Minimum ₱1,000","#dc2626");
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
showReceipt("Request Sent","Admin will approve deposit soon.");
}

/* ===============================
BUY TOKEN
================================= */
function buyCYT(){

const amount = Number(
document.getElementById("amount").value
);

if(amount <= 0){
showPopup("Invalid amount","#dc2626");
return;
}

if(amount > window.balance){
showPopup("Insufficient balance","#dc2626");
return;
}

const token = phpToCYT(amount);

setTimeout(async ()=>{

window.balance -= amount;
window.cyt += token;

addHistory(
"Buy CYT",
"${php(amount)} → ${token.toFixed(6)} CYT"
);

await saveUserData();
updateUI();
closeModal();

showReceipt(
"Purchase Successful",
token.toFixed(6) + " CYT added"
);

},1000);
}

/* ===============================
INVEST
================================= */
function invest(){

const id = Number(
document.getElementById("planSelect").value
);

const pack = PACKAGES.find(x=>x.id===id);

if(!pack) return;

const tokenNeed = phpToCYT(pack.peso);

if(window.cyt < tokenNeed){
showPopup("Not enough CYT","#dc2626");
return;
}

setTimeout(async ()=>{

window.cyt -= tokenNeed;

const start = Date.now();
const end   = start + (pack.hours * 60 * 60 * 1000);

investments.unshift({
id:Date.now(),
packageId:pack.id,
principal:pack.peso,
profit:pack.profit,
tokenSpent:tokenNeed,
startTime:start,
endTime:end,
status:"active",
paid:false
});

addHistory(
"Investment",
"${php(pack.peso)} package started"
);

await saveUserData();
updateUI();
closeModal();

showReceipt(
"Investment Started",
"${php(pack.peso)} is now growing"
);

},1200);
}

/* ===============================
INVESTMENTS UI
================================= */
function renderInvestments(){

const box = document.getElementById("investmentList");
if(!box) return;

if(!investments.length){
box.innerHTML = "<div class="item">No investments yet</div>";
return;
}

box.innerHTML = "";

investments.forEach(inv=>{

const now = Date.now();
const total = inv.endTime - inv.startTime;
const left = inv.endTime - now;

let progress =
Math.min(
((now - inv.startTime) / total) * 100,
100
);

if(progress < 0) progress = 0;

const liveProfit =
(inv.profit * progress / 100);

if(progress >= 100 && !inv.paid){

 inv.status = "completed";
 inv.paid = true;

 window.withdrawable +=
 inv.principal + inv.profit;

 addHistory(
   "Completed",
   `${php(inv.principal)} package matured`
 );

 saveUserData();

}

const div = document.createElement("div");
div.className = "item";

div.innerHTML = `
<strong>${php(inv.principal)} Package</strong><br>
Status: ${inv.status}<br>
Profit: ${php(liveProfit)}<br>
Ends: ${new Date(inv.endTime).toLocaleString()}

   <div class="progress">
     <div class="bar" style="width:${progress}%"></div>
   </div>
   <small>${timeLeft(left)}</small>
   `;box.appendChild(div);
});
}

function timeLeft(ms){

if(ms <= 0) return "Completed";

let s = Math.floor(ms/1000);
let d = Math.floor(s/86400); s%=86400;
let h = Math.floor(s/3600); s%=3600;
let m = Math.floor(s/60); s%=60;

return "${d}d ${h}h ${m}m ${s}s";
}

/* ===============================
HISTORY
================================= */
function renderHistory(){

const box = document.getElementById("historyList");

if(!history.length){
box.innerHTML = "<div class="item">No history yet</div>";
return;
}

box.innerHTML = "";

history.slice(0,15).forEach(h=>{
box.innerHTML += `

   <div class="item">
   <strong>${h.type}</strong><br>
   ${h.details}<br>
   <small>${h.time}</small>
   </div>`;
 });
}/* ===============================
WITHDRAW
================================= */
function withdrawAll(){

if(window.withdrawable <= 0){
showPopup("No withdrawable balance","#dc2626");
return;
}

const msg =
`G-SAVE INVESTMENT

Withdrawal Request
Amount: ${php(window.withdrawable)}
Email: ${currentUser.email}`;

window.open(
"https://wa.me/239167404311?text=" +
encodeURIComponent(msg),
"_blank"
);

showReceipt(
"Withdrawal Request Sent",
"Admin will process shortly."
);
}

/* ===============================
LIVE FEED
================================= */
const names = [
"John","Maria","Kevin","Grace","Pedro",
"Anna","Mark","Liza","Paul","James"
];

function fakeFeed(){

const box = document.getElementById("activityFeed");
if(!box) return;

const actions = [
"invested",
"withdrew",
"earned"
];

const item = document.createElement("div");
item.className = "item";

const name =
names[Math.floor(Math.random()*names.length)];

const action =
actions[Math.floor(Math.random()*actions.length)];

const amt =
php(Math.floor(Math.random()*90000)+10000);

item.innerHTML =
"${name} ${action} ${amt}";

box.prepend(item);

while(box.children.length > 6){
box.removeChild(box.lastChild);
}
}

setInterval(fakeFeed,4000);

/* ===============================
CHART
================================= */
function initChart(){

const ctx =
document.getElementById("profitChart");

if(!ctx) return;

chart = new Chart(ctx,{
type:"line",
data:{
labels:[],
datasets:[{
data:[],
borderColor:"#007dff",
backgroundColor:"rgba(0,125,255,.15)",
fill:true,
tension:.4
}]
},
options:{
responsive:true,
plugins:{legend:{display:false}},
scales:{
x:{display:false},
y:{display:false}
}
}
});
}

function updateChart(){

if(!chart) return;

let total = 0;

investments.forEach(inv=>{

const now = Date.now();
const totalMs = inv.endTime - inv.startTime;

let progress =
Math.min(
((now - inv.startTime)/totalMs)*100,
100
);

if(progress < 0) progress = 0;

total += inv.profit * progress / 100;
});

chart.data.labels.push("");
chart.data.datasets[0].data.push(total);

if(chart.data.labels.length > 12){
chart.data.labels.shift();
chart.data.datasets[0].data.shift();
}

chart.update();
}

/* ===============================
AUTO LOOP
================================= */
setInterval(async ()=>{
updateUI();
await saveUserData();
},3000);
