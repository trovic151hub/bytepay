import { initializeApp } from "https://www.gstatic.com/firebasejs/12.0.0/firebase-app.js";
import { getAuth, signInWithEmailAndPassword, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/12.0.0/firebase-auth.js";
import { getFirestore, doc, getDoc } from "https://www.gstatic.com/firebasejs/12.0.0/firebase-firestore.js";

document.addEventListener("DOMContentLoaded", () => {
  const emailInput = document.getElementById("loginEmail");
  const passwordInput = document.getElementById("password");
  const info = document.getElementById("info");
  const loginBtn = document.getElementById("loginBtn");
  const togglePassword = document.getElementById("togglePassword");

  emailInput.addEventListener("focus", () => {
    info.textContent = "";
  });

  const firebaseConfig = {
  apiKey: "AIzaSyBuvswQZQuVSr3q5gRtFtax07kj5SDrHuU",
  authDomain: "testing-firebase-d7f88.firebaseapp.com",
  projectId: "testing-firebase-d7f88",
  storageBucket: "testing-firebase-d7f88.firebasestorage.app",
  messagingSenderId: "339099724691",
  appId: "1:339099724691:web:83ead43e1d41d2e131d666"
};

  const app = initializeApp(firebaseConfig);
  const auth = getAuth(app);
const db = getFirestore(app);

// Select all password fields with their toggle icons
document.querySelectorAll(".togglePassword").forEach((toggle) => {
  toggle.addEventListener("click", () => {
    const input = toggle.previousElementSibling; // the input field
    if (input.type === "password") {
      input.type = "text";
      toggle.classList.replace("fa-eye", "fa-eye-slash");
    } else {
      input.type = "password";
      toggle.classList.replace("fa-eye-slash", "fa-eye");
    }
  });
});

// 🔹 Login button
loginBtn.addEventListener("click", async (e) => {
  e.preventDefault();

  const email = emailInput.value.trim();
  const password = passwordInput.value.trim();

  if (!email || !password) {
    info.innerText = "Field cannot be empty";
    return;
  }

  // 🔄 Show loading state
  loginBtn.disabled = true;
  loginBtn.innerText = "Logging in...";
  info.innerText = "";

  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    // ✅ Fetch Firestore user data (optional but fine)
    const userDocRef = doc(db, "users", user.uid);
    await getDoc(userDocRef);

    // ✅ Show success banner
    const banner = document.getElementById("loginSuccessBanner");
    banner.textContent = "✅ Login successful! Welcome " + user.email;
    banner.style.display = "block";

    // Redirect after 3 seconds
    setTimeout(() => {
      banner.style.display = "none";
      window.location.href = "./palmpay.html";
    }, 3000);

  } catch (error) {
    console.error("❌ Login error:", error.message);

    if (
      error.code === "auth/invalid-credential" ||
      error.code === "auth/user-not-found" ||
      error.code === "auth/invalid-email" ||
      error.code === "auth/wrong-password"
    ) {
      info.innerText = "Incorrect email or password";
    } else {
      info.innerText = "Login failed: " + error.message;
    }

    // ❌ Restore button on error
    loginBtn.disabled = false;
    loginBtn.innerText = "Login In";
  }
});
});