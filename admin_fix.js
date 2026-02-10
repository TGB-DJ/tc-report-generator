import { initializeApp } from 'firebase/app';
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth';
import { initializeFirestore, doc, setDoc, getDoc } from 'firebase/firestore';

// Hardcoded config matching seedAdmin.js
const firebaseConfig = {
    apiKey: "AIzaSyAWcWQFeVjg99WyZYpVlZjpbAU5qBu60-w",
    authDomain: "ksk-college-cj.firebaseapp.com",
    projectId: "ksk-college-cj",
    storageBucket: "ksk-college-cj.firebasestorage.app",
    messagingSenderId: "95984629669",
    appId: "1:95984629669:web:d46d8dd4e2731c06bcda4c"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
// Force long polling to avoid gRPC issues
const db = initializeFirestore(app, { experimentalForceLongPolling: true });

async function fixAdmin() {
    console.log(" Network Check: Pinging Google...");
    try {
        await fetch('https://www.google.com', { mode: 'no-cors' });
        console.log(" Network Check: Online.");
    } catch (e) {
        console.warn(" Network Check: Offline? " + e.message);
    }

    const email = "admin@ksk.edu.in";
    const password = "admin123";

    console.log(` Attempting to fix admin: ${email}...`);

    try {
        // 1. Sign In
        console.log(" Signing in...");
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;
        console.log(` Signed in as ${user.email} (UID: ${user.uid})`);

        // Wait for connection to stabilize
        console.log(" Waiting 5 seconds for Firestore connection...");
        await new Promise(resolve => setTimeout(resolve, 5000));

        // 2. Check Existing Profile
        const userRef = doc(db, "users", user.uid);
        const userSnap = await getDoc(userRef);

        if (userSnap.exists()) {
            console.log(" Existing 'users' profile found:", userSnap.data());
        } else {
            console.log(" No 'users' profile found. Creating now...");
        }

        // 3. Force Write User Profile
        console.log(" Writing to 'users' collection...");
        await setDoc(userRef, {
            uid: user.uid,
            email: user.email,
            role: "admin",
            phone: "9999999999",
            updatedAt: new Date().toISOString()
        }, { merge: true });
        console.log(" Successfully wrote to 'users' collection.");

        // 4. Force Write Admin Profile
        console.log(" Writing to 'admins' collection...");
        await setDoc(doc(db, "admins", user.uid), {
            uid: user.uid,
            email: user.email,
            name: "Super Admin",
            updatedAt: new Date().toISOString()
        }, { merge: true });
        console.log(" Successfully wrote to 'admins' collection.");

        console.log(" ADMIN FIX COMPLETE. Please try logging in now.");
        process.exit(0);

    } catch (error) {
        console.error(" ERROR:", error);
        if (error.code) console.error(" Error Code:", error.code);
        if (error.message) console.error(" Error Message:", error.message);
        process.exit(1);
    }
}

fixAdmin();
