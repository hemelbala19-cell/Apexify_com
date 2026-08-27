import { auth, db } from './firebase.js';
import { createUserWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { doc, setDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

window.addEventListener('DOMContentLoaded', () => {
    const urlParams = new URLSearchParams(window.location.search);
    const refCode = urlParams.get('ref');
    if (refCode) {
        const refInput = document.getElementById('regReferral');
        if (refInput) {
            refInput.value = refCode;
        }
    }
});

document.getElementById('registerForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const name = document.getElementById('regName').value.trim();
    const email = document.getElementById('regEmail').value.trim();
    const phone = document.getElementById('regPhone').value.trim();
    const password = document.getElementById('regPassword').value;
    const referredBy = document.getElementById('regReferral').value.trim();

    try {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;

        const myReferralCode = "APEX-" + Math.floor(100000 + Math.random() * 900000);

        await setDoc(doc(db, "users", user.uid), {
            uid: user.uid,
            name: name,
            email: email,
            phone: phone,
            balance: 0,
            accountStatus: "inactive",
            referralCode: myReferralCode,
            referredBy: referredBy || null,
            qualifiedReferralCount: 0,
            createdAt: serverTimestamp()
        });

        alert("Registration Successful!");
        window.location.href = "dashboard.html";
    } catch (error) {
        alert("Registration Failed: " + error.message);
    }
});
          
