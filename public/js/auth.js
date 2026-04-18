// FINAL auth.js
// Firebase Google Login (Popup + Redirect Fallback)

console.log("✅ FINAL AUTH LOADED");

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
   HELPERS
=================================== */
function setLoginLoading(state){

  const btn = document.querySelector(".google-btn");

  if(!btn) return;

  if(state){
    btn.disabled = true;
    btn.innerText = "Signing in...";
    btn.style.opacity = "0.7";
  }else{
    btn.disabled = false;
    btn.innerText = "Continue with Google";
    btn.style.opacity = "1";
  }
}

function showMsg(msg){
  console.log(msg);
}

/* ===================================
   GOOGLE LOGIN
=================================== */
function googleLogin(){

  const provider =
    new firebase.auth.GoogleAuthProvider();

  provider.setCustomParameters({
    prompt:"select_account"
  });

  setLoginLoading(true);

  firebase.auth()
  .signInWithPopup(provider)

  .then(result=>{
    showMsg("✅ Popup login success");
  })

  .catch(error=>{

    console.log("Popup failed:", error.code);

    // Mobile fallback
    firebase.auth()
    .signInWithRedirect(provider);
  })

  .finally(()=>{
    setLoginLoading(false);
  });
}

/* ===================================
   REDIRECT RESULT
=================================== */
firebase.auth()
.getRedirectResult()

.then(result=>{

  if(result.user){
    console.log(
      "✅ Redirect login success:",
      result.user.email
    );
  }

})

.catch(error=>{
  console.log(
    "Redirect error:",
    error.message
  );
});

/* ===================================
   AUTH STATE
=================================== */
firebase.auth()
.onAuthStateChanged(user=>{

  const page =
    window.location.pathname
    .split("/")
    .pop();

  if(user){

    console.log(
      "Logged in:",
      user.email
    );

    // Only redirect if on login page
    if(
      page === "login.html" ||
      page === ""
    ){
      window.location.href =
        "dashboard.html";
    }

  }else{

    console.log("No user");

    // If on dashboard without login
    if(page === "dashboard.html"){
      window.location.href =
        "login.html";
    }
  }
});

/* ===================================
   LOGOUT
=================================== */
function logout(){

  firebase.auth()
  .signOut()

  .then(()=>{
    window.location.href =
      "login.html";
  })

  .catch(()=>{
    alert("Logout failed");
  });
}
