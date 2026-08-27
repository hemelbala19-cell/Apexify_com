import { auth, db } from './firebase.js';
import { collection, addDoc, serverTimestamp, doc, getDoc } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

document.getElementById('activationForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const user = auth.currentUser;
    if (!user) return;

    const paymentMethod = document.getElementById('paymentMethod').value;
    const trxId = document.getElementById('trxId').value.trim();

    try {
        const userSnap = await getDoc(doc(db, "users", user.uid));
        const userData = userSnap.exists() ? userSnap.data() : {};

        await addDoc(collection(db, "transactions"), {
            uid: user.uid,
            email: user.email,
            method: paymentMethod,
            trxId: trxId,
            type: "activation",
            status: "pending",
            referredByCode: userData.referredBy || null,
            createdAt: serverTimestamp()
        });

        alert("Activation request submitted successfully!");
        window.location.href = "dashboard.html";
    } catch (err) {
        alert("Error: " + err.message);
    }
});
