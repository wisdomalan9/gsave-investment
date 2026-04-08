const firebaseConfig = {
  apiKey: "AIzaSyCewm0z-8PA4JIvHR6WZ5QJZ1cTVfRPvXo",
  authDomain: "g-save-investment.firebaseapp.com",
  projectId: "g-save-investment",
  appId: "1:223920210175:web:719631a9fa002e17a98cca"
};

// Prevent double initialization
if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
}

// 🔐 GOOGLE LOGIN
function googleLogin() {
    const provider = new firebase.auth.GoogleAuthProvider();

    // 🔥 FORCE ACCOUNT SELECTION EVERY TIME
    provider.setCustomParameters({
        prompt: "select_account"
    });

    firebase.auth().signInWithPopup(provider)
    .then((result) => {
        console.log("Login success:", result.user.email);
    })
    .catch((error) => {
        console.log("Login error:", error);
        alert("Login failed. Try again.");
    });
}

// 🔁 AUTH STATE CHECK
firebase.auth().onAuthStateChanged((user) => {
    if (user) {
        console.log("User logged in:", user.email);

        // ✅ REDIRECT TO DASHBOARD
        window.location.href = "dashboard.html";
    } else {
        console.log("No user logged in");
    }
});

// 🔓 LOGOUT FUNCTION (optional but useful)
function logout() {
    firebase.auth().signOut().then(() => {
        console.log("User logged out");
        window.location.href = "login.html";
    });
}
