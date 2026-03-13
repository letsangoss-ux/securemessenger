// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyDy4h_VCmDwMl5hAOPMkiHV2YYq6JkK4Iw",
  authDomain: "messenger-c2da7.firebaseapp.com",
  projectId: "messenger-c2da7",
  storageBucket: "messenger-c2da7.firebasestorage.app",
  messagingSenderId: "173412673396",
  appId: "1:173412673396:web:f4bb795eeeddbd383bee21",
  measurementId: "G-L6RY65X755"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);