// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyDosOBzqvOwhkAutVWeEq3UlHuDWhukPa0",
  authDomain: "fffgy-2baee.firebaseapp.com",
  projectId: "fffgy-2baee",
  storageBucket: "fffgy-2baee.firebasestorage.app",
  messagingSenderId: "556680596203",
  appId: "1:556680596203:web:b203d1f8bcf085c2310cae",
  measurementId: "G-3P5PQFN6YN"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
