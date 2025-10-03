import { initializeApp } from "https://www.gstatic.com/firebasejs/12.0.0/firebase-app.js";
import { getFirestore, setDoc, doc, collection, getDocs, query, where } from "https://www.gstatic.com/firebasejs/12.0.0/firebase-firestore.js";
import { getAuth, createUserWithEmailAndPassword, updateProfile } from "https://www.gstatic.com/firebasejs/12.0.0/firebase-auth.js";

const info = document.getElementById("info");

document.addEventListener("DOMContentLoaded", () => {
  // === Animation ===
  const logoDiv = document.querySelector('.logo-div');
  const siteName = document.querySelector('.site-name');
  const form = document.querySelector('.form');

  logoDiv.classList.add('show');
  setTimeout(() => {
    logoDiv.classList.remove('show');
    siteName.classList.add('show');
  }, 3000);

  setTimeout(() => {
    siteName.classList.remove('show');
    form.classList.add('show');
  }, 6000);

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

  // === Validation Functions ===
  const isAlpha = (str) => /^[A-Za-z]+$/.test(str);
  const isValidPhone = (str) => /^\d{11}$/.test(str);
  const isValidPassword = (str) =>
    /[a-z]/.test(str) && /[A-Z]/.test(str) && /\d/.test(str) && /^[A-Za-z0-9]+$/.test(str);
  const isValidEmail = (str) => /\S+@\S+\.\S+/.test(str);
  const isValidPin = (str) => /^\d{6}$/.test(str);

  // === Enforce Live Restrictions ===
  const phoneInput = document.getElementById("phoneNumber");
  phoneInput.addEventListener("input", () => {
    phoneInput.value = phoneInput.value.replace(/\D/g, "");
    if (phoneInput.value.length > 11) {
      phoneInput.value = phoneInput.value.slice(0, 11);
    }
  });

  const pinInput = document.getElementById("transactionPin");
  pinInput.addEventListener("input", () => {
    pinInput.value = pinInput.value.replace(/\D/g, "");
    if (pinInput.value.length > 6) {
      pinInput.value = pinInput.value.slice(0, 6);
    }
  });

  // === Form Submission ===
  const submitData = document.getElementById("submitData");
  submitData.addEventListener("click", async (e) => {
    e.preventDefault();
    submitData.disabled = true;
    submitData.textContent = "Processing...";

    try {
      const firstName = document.getElementById("firstName").value.trim();
      const lastName = document.getElementById("lastName").value.trim();
      const phoneNumber = document.getElementById("phoneNumber").value.trim();
      const email = document.getElementById("emailAddress").value.trim();
      const password = document.getElementById("password").value;
      const confirmPassword = document.getElementById("confirmPassword").value;
      const transactionPin = document.getElementById("transactionPin").value;

      info.textContent = "";

      // === Validation Checks ===
      if (!firstName || !lastName || !phoneNumber || !email || !password || !confirmPassword || !transactionPin) {
        info.textContent = "Please fill in all fields.";
        return;
      }
      if (!isAlpha(firstName) || !isAlpha(lastName)) {
        info.textContent = "Names should contain only letters.";
        return;
      }
      if (!isValidPhone(phoneNumber)) {
        info.textContent = "Phone number must be digits only (max 11).";
        return;
      }
      if (!phoneNumber.startsWith("0")) {
        info.textContent = "Phone number must start with 0";
        return;
      }
      if (!isValidEmail(email)) {
        info.textContent = "Invalid email format.";
        return;
      }
      if (!isValidPassword(password)) {
        info.textContent = "Password must contain uppercase, lowercase, and number (no symbols).";
        return;
      }
      if (password !== confirmPassword) {
        info.textContent = "Password and Confirm Password do not match.";
        return;
      }
      if (!isValidPin(transactionPin)) {
        info.textContent = "Transaction PIN must be exactly 6 digits.";
        return;
      }

      // Generate account number
      const accountNumber = () => {
        const arrayString = phoneNumber.split('');
        const [firstNumber, ...others] = arrayString;
        const account = others.join('');
        return parseInt(account);
      };

      // Ensure phone number is unique
      const usersRef = collection(db, "users");
      const q = query(usersRef, where("phoneNumber", "==", phoneNumber));
      const querySnapshot = await getDocs(q);
      if (!querySnapshot.empty) {
        info.textContent = "Phone number already exists";
        return;
      }

      // ✅ Create Firebase Auth user
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // ✅ Update Auth profile with displayName + default photo
      await updateProfile(user, {
        displayName: `${firstName} ${lastName}`,
        photoURL: "default.png"
      });

      // ✅ Hash PIN with bcrypt before storing
const salt = dcodeIO.bcrypt.genSaltSync(10);
const hashedPin = dcodeIO.bcrypt.hashSync(transactionPin, salt);

      // ✅ Save user in Firestore (use default.png not "")
await setDoc(doc(db, "users", user.uid), {
  uid: user.uid,
  firstName: firstName,
  lastName: lastName,
  phoneNumber: phoneNumber || "",
  email: user.email,
  transactionPin: hashedPin,
  accountBalance: 0,
  // profilePictureUrl: "",
  accountNumber: accountNumber(),
  createdAt: new Date()
});

      info.textContent = "✅ Account created successfully!";
      setTimeout(() => {
        window.location.href = "./index.html";
      }, 2000);

    } catch (error) {
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

  // === Password Eye Toggle ===
  const eyes = document.querySelectorAll(".eye");
  eyes.forEach((eye) => {
    eye.addEventListener("click", () => {
      const input = eye.previousElementSibling;
      if (input.type === "password") {
        input.type = "text";
        eye.innerHTML = `<svg ... open eye icon ... ></svg>`;
      } else {
        input.type = "password";
        eye.innerHTML = `<svg ... closed eye icon ... ></svg>`;
      }
    });
  });
});