import { initializeApp } from "https://www.gstatic.com/firebasejs/12.0.0/firebase-app.js";
import { getAuth, signInWithEmailAndPassword, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/12.0.0/firebase-auth.js";
import { getFirestore, doc, getDoc } from "https://www.gstatic.com/firebasejs/12.0.0/firebase-firestore.js";

document.addEventListener("DOMContentLoaded", () => {
  const emailInput = document.getElementById("loginEmail");
  const passwordInput = document.getElementById("loginPassword");
  const info = document.getElementById("info");
  const loginBtn = document.getElementById("loginBtn");
  const togglePassword = document.getElementById("togglePassword");

  emailInput.addEventListener("focus", () => {
    info.textContent = "";
  });
  passwordInput.addEventListener("focus", () => {
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

  // 🔹 Password toggle
  togglePassword.addEventListener("click", () => {
    const isPassword = passwordInput.type === "password";
    passwordInput.type = isPassword ? "text" : "password";

    // Switch icon
    togglePassword.innerHTML = isPassword
      ? `
        <!-- eye with slash -->
        <svg xmlns="http://www.w3.org/2000/svg" width="1.5em" height="1.5em" viewBox="0 0 256 256">
          <path fill="#2563ea" d="M53.82 34.62a4 4 0 0 0-5.64 5.66l23 22.93C41.67 75.12 28.26 95.39 20.34 111.62a11.9 11.9 0 0 0 0 10.77c.34.76 8.52 18.89 26.83 37.2c23.07 23 51 34.62 83 34.62a124.6 124.6 0 0 0 54.33-12.19l18.51 18.51a4 4 0 1 0 5.66-5.66ZM128 76a52.06 52.06 0 0 1 52 52a51.7 51.7 0 0 1-7.07 25.87l-70.8-70.8A51.75 51.75 0 0 1 128 76m0 104a52 52 0 0 1-52-52a51.7 51.7 0 0 1 7.07-25.87l70.8 70.8A51.75 51.75 0 0 1 128 180m107.66-55.61c-.34.77-8.52 18.89-26.83 37.2c-8.36 8.36-17.91 15.36-28.33 20.86a4 4 0 0 1-3.62-7.12c9.71-4.94 18.61-11.4 26.46-19.25A135.7 135.7 0 0 0 235.56 128a135.7 135.7 0 0 0-24.51-33.37C187 71.65 159 60 128 60a123.8 123.8 0 0 0-32.51 4.36a4 4 0 0 1-2.14-7.7A131.84 131.84 0 0 1 128 52c42.7 0 71.87 20.22 88.83 37.18c18.31 18.31 26.49 36.44 26.83 37.2a11.9 11.9 0 0 1 0 10.77"/>
        </svg>
      `
      : `
        <!-- open eye -->
        <svg xmlns="http://www.w3.org/2000/svg" width="1.5em" height="1.5em" viewBox="0 0 256 256">
          <path fill="#2563ea" d="M243.66 126.38c-.34-.76-8.52-18.89-26.83-37.2C199.87 72.22 170.7 52 128 52S56.13 72.22 39.17 89.18c-18.31 18.31-26.49 36.44-26.83 37.2a4.08 4.08 0 0 0 0 3.25c.34.77 8.52 18.89 26.83 37.2c17 17 46.14 37.17 88.83 37.17s71.87-20.21 88.83-37.17c18.31-18.31 26.49-36.43 26.83-37.2a4.08 4.08 0 0 0 0-3.25m-32.7 35c-23.07 23-51 34.62-83 34.62s-59.89-11.65-83-34.62A135.7 135.7 0 0 1 20.44 128A135.7 135.7 0 0 1 45 94.62C68.11 71.65 96 60 128 60s59.89 11.65 83 34.62A135.8 135.8 0 0 1 235.56 128A135.7 135.7 0 0 1 211 161.38ZM128 84a44 44 0 1 0 44 44a44.05 44.05 0 0 0-44-44m0 80a36 36 0 1 1 36-36a36 36 0 0 1-36 36"/>
        </svg>
      `;
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

    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // ✅ Fetch Firestore user data
      const userDocRef = doc(db, "users", user.uid);
      const userDocSnap = await getDoc(userDocRef);
      
      // Show success banner
const banner = document.getElementById("loginSuccessBanner");
banner.textContent = "✅ Login successful! Welcome " + user.email;
banner.style.display = "block";

// Hide banner after 3 seconds, then redirect
setTimeout(() => {
  banner.style.display = "none";
  window.location.href = "./palmpay.html";
}, 3000);

      // alert("✅ Login successful! Welcome " + user.email);
      // window.location.href = "/JS-project/palmpay.html";
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
    }
  });
});

// const auth = getAuth();
// onAuthStateChanged(auth, (user) => {
//   if (!user) {
//     // Not logged in, go back to login
//     window.location.href = "../JS-project/palmpay.html";
//   }
// });

//Firebase: Error (auth/invalid-email).
