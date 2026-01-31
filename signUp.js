import { initializeApp } from "https://www.gstatic.com/firebasejs/12.0.0/firebase-app.js";
import { getFirestore, setDoc, doc, collection, getDocs, query, where } from "https://www.gstatic.com/firebasejs/12.0.0/firebase-firestore.js";
import { getAuth, createUserWithEmailAndPassword, updateProfile } from "https://www.gstatic.com/firebasejs/12.0.0/firebase-auth.js";

const info = document.getElementById("info");

document.addEventListener("DOMContentLoaded", () => {
  // === Animation ===
    const logoDiv = document.getElementById('logo-div');
  const siteName = document.getElementById('site-name');
  const form = document.querySelector('.form');

  // Show logo first
  logoDiv.classList.add('show');

  // After 3s, hide logo and show site name
  setTimeout(() => {
    logoDiv.classList.remove('show');
    siteName.classList.add('show');
  }, 3000);

  // After 6s, hide site name and show form
  setTimeout(() => {
    siteName.classList.remove('show');
    form.classList.add('show');
  }, 6000);
  // const logoDiv = document.querySelector('.logo-div');
  // const siteName = document.querySelector('.site-name');
  // const form = document.querySelector('.form');

  // logoDiv.classList.add('show');
  // setTimeout(() => {
  //   logoDiv.classList.remove('show');
  //   siteName.classList.add('show');
  // }, 3000);

  // setTimeout(() => {
  //   siteName.classList.remove('show');
  //   form.classList.add('show');
  // }, 6000);

  // === Firebase Config ===
  const firebaseConfig = {
    apiKey: "AIzaSyBuvswQZQuVSr3q5gRtFtax07kj5SDrHuU",
    authDomain: "testing-firebase-d7f88.firebaseapp.com",
    projectId: "testing-firebase-d7f88",
    storageBucket: "testing-firebase-d7f88.firebasestorage.app",
    messagingSenderId: "339099724691",
    appId: "1:339099724691:web:83ead43e1d41d2e131d666"
  };

  const app = initializeApp(firebaseConfig);
  const db = getFirestore(app);
  const auth = getAuth(app);

  // === DOM Inputs ===
  const submitDataBtn = document.getElementById("submitData");
  const firstNameInput = document.getElementById("firstName");
  const lastNameInput = document.getElementById("lastName");
  const phoneInput = document.getElementById("phoneNumber");
  const emailInput = document.getElementById("emailAddress");
  const passwordInput = document.getElementById("password");
  const confirmPasswordInput = document.getElementById("confirmPassword");
  const pinInput = document.getElementById("transactionPin");

  // === Validation Functions ===
  const isAlpha = str => /^[A-Za-z]+$/.test(str);
  const isValidPhone = str => /^\d{11}$/.test(str);
  const isValidPassword = str => /[a-z]/.test(str) && /[A-Z]/.test(str) && /\d/.test(str) && /^[A-Za-z0-9]+$/.test(str);
  const isValidEmail = str => /\S+@\S+\.\S+/.test(str);
  const isValidPin = str => /^\d{6}$/.test(str);

  // === Live Input Restrictions ===
  phoneInput.addEventListener("input", () => {
    phoneInput.value = phoneInput.value.replace(/\D/g, "").slice(0, 11);
    info.textContent = "";
  });

  pinInput.addEventListener("input", () => {
    pinInput.value = pinInput.value.replace(/\D/g, "").slice(0, 6);
    info.textContent = "";
  });

  // Clear error when typing in any input
  [firstNameInput, lastNameInput, emailInput, passwordInput, confirmPasswordInput, pinInput].forEach(input => {
    input.addEventListener("input", () => info.textContent = "");
  });

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

  // === Form Submission ===
  submitData.addEventListener("click", async (e) => {
  e.preventDefault();

  const firstName = firstNameInput.value.trim();
  const lastName = lastNameInput.value.trim();
  const phoneNumber = phoneInput.value.trim();
  const email = emailInput.value.trim();
  const password = passwordInput.value;
  const confirmPassword = confirmPasswordInput.value;
  const transactionPin = pinInput.value;

  info.style.color = "red";
  info.textContent = "";

  // === VALIDATION ===
  const validationError = (() => {
    if (!firstName || !lastName || !phoneNumber || !email || !password || !confirmPassword || !transactionPin) return "Please fill in all fields.";
    if (!isAlpha(firstName) || !isAlpha(lastName)) return "Names should contain only letters.";
    if (!isValidPhone(phoneNumber) || !phoneNumber.startsWith("0")) return "Phone number must be 11 digits and start with 0.";
    if (!isValidEmail(email)) return "Invalid email format.";
    if (!isValidPassword(password)) return "Password must contain uppercase, lowercase, and number (no symbols).";
    if (password !== confirmPassword) return "Password and Confirm Password do not match.";
    if (!isValidPin(transactionPin)) return "Transaction PIN must be exactly 6 digits.";
    return null;
  })();

  if (validationError) {
    info.textContent = validationError;
    return; // Exit early, but submit button is still enabled
  }

  // === VALIDATION PASSED ===
  submitData.disabled = true;
  submitData.textContent = "Processing...";

  try {
    // Check if phone number exists
    const usersRef = collection(db, "users");
    const q = query(usersRef, where("phoneNumber", "==", phoneNumber));
    const querySnapshot = await getDocs(q);
    if (!querySnapshot.empty) {
      info.textContent = "Phone number already exists.";
      return;
    }

    // Create Firebase Auth User
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    await updateProfile(user, {
      displayName: `${firstName} ${lastName}`,
      photoURL: "default.png"
    });

    // Hash PIN
    const salt = dcodeIO.bcrypt.genSaltSync(10);
    const hashedPin = dcodeIO.bcrypt.hashSync(transactionPin, salt);

    const accountNumber = phoneNumber.slice(1); // Preserve leading zeros

    await setDoc(doc(db, "users", user.uid), {
      uid: user.uid,
      firstName,
      lastName,
      phoneNumber,
      email,
      transactionPin: hashedPin,
      accountBalance: 0,
      // accountNumber,
      recipientAccountNumber,
      createdAt: new Date()
    });

    info.style.color = "green";
    info.textContent = "✅ Account created successfully!";
    setTimeout(() => window.location.href = "./index.html", 2000);

  } catch (error) {
    info.style.color = "red";
    if (error.code === 'auth/email-already-in-use') {
      info.textContent = "This email is already registered. Try logging in.";
    } else if (error.code === 'auth/invalid-email') {
      info.textContent = "Invalid email address.";
    } else if (error.code === 'auth/weak-password') {
      info.textContent = "Password must be at least 6 characters.";
    } else {
      info.textContent = "Error: " + error.message;
    }
  } finally {
    submitData.disabled = false;
    submitData.textContent = "Sign Up";
  }
});
});