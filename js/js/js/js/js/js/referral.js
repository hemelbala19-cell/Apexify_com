import { auth, db } from './firebase.js';
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { doc, getDoc } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

onAuthStateChanged(auth, async (user) => {
    if (!user) return;
    const userSnap = await getDoc(doc(db, "users", user.uid));
    if (userSnap.exists()) {
        const data = userSnap.data();
        const code = data.referralCode || '';
        document.getElementById('refCodeDisplay').textContent = code;
        
        const refLink = `${window.location.origin}/register.html?ref=${code}`;
        document.getElementById('refLinkInput').value = refLink;
        document.getElementById('qualifiedCount').textContent = data.qualifiedReferralCount || 0;
    }
});

document.getElementById('copyRefBtn')?.addEventListener('click', () => {
    const input = document.getElementById('refLinkInput');
    navigator.clipboard.writeText(input.value);
    alert("Referral link copied successfully!");
});
