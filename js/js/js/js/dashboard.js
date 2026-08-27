import { auth, db } from './firebase.js';
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { doc, getDoc } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

onAuthStateChanged(auth, async (user) => {
    if (!user) {
        window.location.href = "login.html";
        return;
    }

    try {
        const userSnap = await getDoc(doc(db, "users", user.uid));
        if (userSnap.exists()) {
            const data = userSnap.data();
            document.getElementById('totalAssetValue').textContent = `৳ ${data.balance || '0.00'}`;
            document.getElementById('availableBalance').textContent = `৳ ${data.balance || '0.00'}`;

            if (data.accountStatus === "active") {
                document.getElementById('actionRequiredCard').classList.add('hidden');
                document.getElementById('activeButtonsContainer').classList.remove('hidden');
            } else {
                document.getElementById('actionRequiredCard').classList.remove('hidden');
                document.getElementById('activeButtonsContainer').classList.add('hidden');
            }
        }
    } catch (err) {
        console.error("Dashboard error:", err);
    }
});

document.getElementById('activateAccountBtn')?.addEventListener('click', () => {
    window.location.href = "activation.html";
});
