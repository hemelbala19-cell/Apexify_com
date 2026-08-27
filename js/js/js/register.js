import { auth, db } from './firebase.js';
import { createUserWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { doc, setDb, setDoc } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

document.getElementById('registerForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const name = document.getElementById('name').value;
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;

    try {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;

        // ডেটাবেজে ইউজারের তথ্য সেভ করা
        await setDoc(doc(db, "users", user.uid), {
            name: name,
            email: email,
            isAdmin: false,
            createdAt: new Date()
        });

        alert("Registration Successful!");
        window.location.href = "dashboard.html";
    } catch (error) {
        alert("Registration Failed: " + error.message);
    }
});
