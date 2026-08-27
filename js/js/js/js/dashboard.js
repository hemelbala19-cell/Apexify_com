import { auth, db } from './firebase.js';
import { onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { doc, getDoc } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

onAuthStateChanged(auth, async (user) => {
    if (user) {
        const docRef = doc(db, "users", user.uid);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
            document.getElementById('userName').innerText = docSnap.data().name;
        }
    } else {
        window.location.href = "login.html";
    }
});

document.getElementById('logoutBtn').addEventListener('click', () => {
    signOut(auth).then(() => {
        window.location.href = "login.html";
    });
});
