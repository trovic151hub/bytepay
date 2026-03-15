import { initializeApp } from "https://www.gstatic.com/firebasejs/12.0.0/firebase-app.js";
import { getAuth, sendPasswordResetEmail } from "https://www.gstatic.com/firebasejs/12.0.0/firebase-auth.js";
import { getFirestore, collection, query, where, getDocs } from "https://www.gstatic.com/firebasejs/12.0.0/firebase-firestore.js";

document.addEventListener("DOMContentLoaded", () => {
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

  // Make it global so HTML onclick can see it
  window.handleForgotPassword = async () => {
    const email = document.getElementById("email").value;

    try {
      const usersRef = collection(db, "users");
      const q = query(usersRef, where("email", "==", email));
      const querySnapshot = await getDocs(q);

      if (querySnapshot.empty) {
        alert("Email not found in our records.");
        return;
      }

      await sendPasswordResetEmail(auth, email)
  .then(() => {
    // Password reset email sent!
    // ..
    alert ("email sent")
  })
    .catch((error) => {
    const errorCode = error.code;
    const errorMessage = error.message;
    // ..
  });
    } catch (error) {
      alert(error.message, error.code );
    }
  };
});


