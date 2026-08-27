import { db } from './firebase.js';
import { doc, setDoc, getDoc } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

window.addEventListener('DOMContentLoaded', async () => {
    const snap = await getDoc(doc(db, "settings", "financialLimits"));
    if (snap.exists()) {
        const d = snap.data();
        document.getElementById('minDeposit').value = d.minDeposit || 10;
        document.getElementById('minWithdraw').value = d.minWithdraw || 50;
        document.getElementById('csAgentLink').value = d.csAgentLink || '';
    }
});

document.getElementById('settingsForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    try {
        await setDoc(doc(db, "settings", "financialLimits"), {
            minDeposit: Number(document.getElementById('minDeposit').value),
            minWithdraw: Number(document.getElementById('minWithdraw').value),
            csAgentLink: document.getElementById('csAgentLink').value
        }, { merge: true });
        alert("Settings updated successfully!");
    } catch (err) {
        alert("Error: " + err.message);
    }
});
