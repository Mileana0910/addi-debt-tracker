// Importa las funciones necesarias de Firebase
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore"; // Añade esta importación

// Configuración de Firebase (usa variables de entorno en producción)
const firebaseConfig = {
  apiKey: "AIzaSyBrlkwwhxokf1mk9Xn4zDoOAH7tZjsstE0",
  authDomain: "cuentas-addi-mj.firebaseapp.com",
  projectId: "cuentas-addi-mj",
  storageBucket: "cuentas-addi-mj.firebasestorage.app",
  messagingSenderId: "678584602015",
  appId: "1:678584602015:web:f3428d8b6f6f6ee25b41aa",
  measurementId: "G-V0QNBK46VM"
};

// Inicializa Firebase
const app = initializeApp(firebaseConfig);

// Obtiene la instancia de Firestore
const db = getFirestore(app); // Esta línea es crucial para tu aplicación

// Exporta solo lo que necesitas (db para Firestore)
export { db }; // Exportación necesaria para que otros archivos puedan usar Firestore