const firebaseConfig = {
  apiKey: "AIzaSyCewm0z-8PA4JIvHR6WZ5QJZ1cTVfRPvXo",
  authDomain: "g-save-investment.firebaseapp.com", // ✅ FIXED
  projectId: "g-save-investment",
  appId: "1:223920210175:web:719631a9fa002e17a98cca"
};

if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
}

// 🔐 GOOGLE LOGIN
function googleLogin() {
    const provider = new firebase.auth.GoogleAuthProvider();

    provider.setCustomParameters({
        prompt: "select_account"
    });

    firebase.auth().signInWithPopup(provider)
    .then((result) => {
        console.log("✅ Login success:", result.user.email);
    })
    .catch((error) => {
        console.log("❌ Popup failed, switching to redirect:", error);

        // fallback for mobile
        firebase.auth().signInWithRedirect(provider);
    });
}

// 🔁 REDIRECT RESULT
firebase.auth().getRedirectResult()
.then((result) => {
    if (result.user) {
        console.log("✅ Redirect login success:", result.user.email);
    }
})
.catch((error) => {
    console.log("Redirect error:", error);
});

// 🔁 AUTH STATE
firebase.auth().onAuthStateChanged((user) => {
    if (user) {
        console.log("User logged in:", user.email);
        window.location.href = "dashboard.html";
    } else {
        console.log("No user logged in");
    }
});

// 🔓 LOGOUT
function logout() {
    firebase.auth().signOut().then(() => {
        window.location.href = "login.html";
    });
}
