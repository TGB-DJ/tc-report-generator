import { initializeApp } from 'firebase/app';
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'firebase/auth';
import { getFirestore, doc, setDoc } from 'firebase/firestore';

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
// const db = getFirestore(app);

// Force Long Polling to avoid gRPC NOT_FOUND errors in some environments
import { initializeFirestore } from 'firebase/firestore';
const db = initializeFirestore(app, { experimentalForceLongPolling: true });

const email = "12256@ksk.edu.in";
const password = "122560"; // Firebase requires min 6 chars

async function seed() {
    let user;
    try {
        console.log(`Creating user: ${email}...`);
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        user = userCredential.user;
        console.log(`User created with UID: ${user.uid}`);
    } catch (error) {
        if (error.code === 'auth/email-already-in-use') {
            console.log("User already exists. Attempting to sign in to update Firestore...");
            try {
                const userCredential = await signInWithEmailAndPassword(auth, email, password);
                user = userCredential.user;
                console.log(`Signed in with UID: ${user.uid}`);
            } catch (loginError) {
                console.error("Could not sign in with provided credentials:", loginError);
                process.exit(1);
            }
        } else {
            console.error("Error creating/signing in admin:", error);
            process.exit(1);
        }
    }

    try {
        console.log("Creating/Updating Firestore documents...");

        // 1. Create in 'users' collection (for role mapping)
        await setDoc(doc(db, "users", user.uid), {
            uid: user.uid,
            email: user.email,
            role: "admin",
            phone: "9876543210", // Default phone for testing
            createdAt: new Date().toISOString()
        }, { merge: true }); // Merge to avoid overwriting existing data completely if not needed

        // 2. Create in 'admins' collection (for profile)
        await setDoc(doc(db, "admins", user.uid), {
            uid: user.uid,
            email: user.email,
            name: "Chirenjeevi", // Default name
            createdAt: new Date().toISOString()
        }, { merge: true });

        console.log("Admin account successfully configured!");
        process.exit(0);
    } catch (error) {
        console.error("Error writing to Firestore:", error);
        process.exit(1);
    }
}

seed();
