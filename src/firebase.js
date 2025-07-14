// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyBrlkwwhxokf1mk9Xn4zDoOAH7tZjsstE0",
  authDomain: "cuentas-addi-mj.firebaseapp.com",
  projectId: "cuentas-addi-mj",
  storageBucket: "cuentas-addi-mj.firebasestorage.app",
  messagingSenderId: "678584602015",
  appId: "1:678584602015:web:f3428d8b6f6f6ee25b41aa",
  measurementId: "G-V0QNBK46VM"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);