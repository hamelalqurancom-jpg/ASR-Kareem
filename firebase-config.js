// Firebase configuration - REPLACE WITH YOUR OWN CONFIG
const firebaseConfig = {
    apiKey: "AIzaSyAwE_1Sgh5kLICOOO-oj2ShxmHWJBHbzgQ",
    authDomain: "aser-90783.firebaseapp.com",
    projectId: "aser-90783",
    storageBucket: "aser-90783.firebasestorage.app",
    messagingSenderId: "269436668057",
    appId: "1:269436668057:web:586d9791c55ebdf4c1d008",
    measurementId: "G-S9VXQKYY6C"
};

// Initialize Firebase
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getFirestore, collection, addDoc, onSnapshot, query, deleteDoc, doc, getDocs } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

export { db, collection, addDoc, onSnapshot, query, deleteDoc, doc, getDocs };
