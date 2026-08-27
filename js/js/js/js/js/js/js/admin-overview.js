import { db } from './firebase.js';
import { collection, getDocs, query, where } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

async function loadStats() {
    const usersSnap = await getDocs(collection(db, "users"));
    document.getElementById('statTotalUsers').textContent = usersSnap.size;
    let active = 0;
    usersSnap.forEach(d => { if (d.data().accountStatus === 'active') active++; });
    document.getElementById('statActiveUsers').textContent = active;
}
window.addEventListener('DOMContentLoaded', loadStats);

document.getElementById('searchUserBtn')?.addEventListener('click', async () => {
    const queryVal = document.getElementById('searchUserInput').value.trim();
    const resultArea = document.getElementById('searchResultArea');
    if (!queryVal) return;

    resultArea.innerHTML = "<p>Searching...</p>";
    try {
        const q = query(collection(db, "users"), where("phone", "==", queryVal));
        const snap = await getDocs(q);

        if (snap.empty) {
            resultArea.innerHTML = "<p style='color:#EF4444;'>No user found.</p>";
            return;
        }

        snap.forEach(d => {
            const u = d.data();
            resultArea.innerHTML = `
                <div style="background:#1F2937; padding:15px; border-radius:8px;">
                    <p><strong>Name:</strong> ${u.name}</p>
                    <p><strong>Email:</strong> ${u.email}</p>
                    <p><strong>Phone:</strong> ${u.phone}</p>
                    <p><strong>Status:</strong> ${u.accountStatus.toUpperCase()}</p>
                    <p><strong>Balance:</strong> ৳ ${u.balance || 0}</p>
                    <p><strong>Referral Code:</strong> ${u.referralCode}</p>
                    <p><strong>Qualified Referrals:</strong> ${u.qualifiedReferralCount || 0}</p>
                </div>
            `;
        });
    } catch (err) {
        resultArea.innerHTML = `<p style='color:#EF4444;'>Error: ${err.message}</p>`;
    }
});
