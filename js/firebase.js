import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-analytics.js";

const firebaseConfig = {
    apiKey: "AIzaSyDsgQJgZ64-ARLqKa3vcdQpu_xVupD90W4",
    authDomain: "apexify-72bc2.firebaseapp.com",
    projectId: "apexify-72bc2",
    storageBucket: "apexify-72bc2.firebasestorage.app",
    messagingSenderId: "114061131405",
    appId: "1:114061131405:web:ffd00b701d70c164976cc4",
    measurementId: "G-RB6KW4S7JL"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const analytics = getAnalytics(app);
  
