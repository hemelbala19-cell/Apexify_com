import { auth } from './firebase.js';
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";

// ইউজার আগে থেকেই লগইন করা থাকলে সরাসরি ড্যাশবোর্ডে পাঠিয়ে দিবে, না হলে লগইন পেজে রাখবে
onAuthStateChanged(auth, (user) => {
    if (user) {
        window.location.href = "dashboard.html";
    } else {
        window.location.href = "login.html";
    }
});
