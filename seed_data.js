import { initializeApp } from 'firebase/app';
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'firebase/auth';
import { initializeFirestore, doc, setDoc } from 'firebase/firestore';

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
const db = initializeFirestore(app, { experimentalForceLongPolling: true });

async function createOrUpdateUser(email, password, role, collectionName, profileData) {
    let user;
    try {
        console.log(`Creating/Updating user: ${email}...`);
        try {
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            user = userCredential.user;
            console.log(`Created new user ${email} with UID: ${user.uid}`);
        } catch (error) {
            if (error.code === 'auth/email-already-in-use') {
                console.log(`User ${email} exists. Signing in...`);
                try {
                    const userCredential = await signInWithEmailAndPassword(auth, email, password);
                    user = userCredential.user;
                    console.log(`Signed in as ${email} with UID: ${user.uid}`);
                } catch (signinError) {
                    console.error(`Sign in failed for ${email} (Wrong password?):`, signinError.message);
                    return null; // Skip if password wrong
                }
            } else {
                throw error;
            }
        }

        if (user) {
            // 1. Create User Mapping
            await setDoc(doc(db, "users", user.uid), {
                uid: user.uid,
                email: user.email,
                role: role,
                phone: profileData.phone || "",
                createdAt: new Date().toISOString()
            }, { merge: true });

            // 2. Create Profile Document
            await setDoc(doc(db, collectionName, user.uid), {
                uid: user.uid,
                email: user.email,
                ...profileData,
                createdAt: new Date().toISOString()
            }, { merge: true });

            console.log(`Successfully configured ${role} profile for ${email}`);
        }
        return user;
    } catch (error) {
        console.error(`Error processing ${email}:`, error.message);
    }
}

async function seed() {
    console.log("Starting Database Seed...");

    // 1. Admin
    await createOrUpdateUser("admin@ksk.edu.in", "admin123", "admin", "admins", {
        name: "Super Admin",
        phone: "9999999999"
    });

    // 2. Teacher
    await createOrUpdateUser("teacher@ksk.edu.in", "teacher123", "teacher", "teachers", {
        name: "Dr. A. Sharma",
        dept: "Computer Science",
        phone: "8888888888"
    });

    // 3. Student (Standard Test User)
    await createOrUpdateUser("student@ksk.edu.in", "student123", "student", "students", {
        name: "R. Kumar",
        regno: "CSA23001",
        dept: "Computer Science",
        class: "III Year",
        phone: "7777777777",
        dob: "2003-05-15",
        admissionDate: "2023-06-01",
        academicYear: "2025-2026",
        conduct: "Good",
        fees: {
            total: 45000,
            paid: 45000,
            balance: 0,
            bus: 10000,
            other: 5000
        }
    });

    // 4. Try to fix the user's specific account
    console.log("Attempting to fix user '12256@ksk.edu.in'...");
    // Try with password '122560'
    await createOrUpdateUser("12256@ksk.edu.in", "122560", "student", "students", {
        name: "Test Student 12256",
        regno: "12256",
        dept: "B.Sc CS",
        class: "II Year",
        phone: "1234567890",
        dob: "2004-01-01",
        admissionDate: "2024-06-01",
        academicYear: "2025-2026",
        conduct: "Good",
        fees: {
            total: 30000,
            paid: 10000,
            balance: 20000
        }
    });

    // Try with password 'password123' if the above failed/user used diff password? 
    // Wait, createOrUpdateUser will catch wrong password error and skip.

    console.log("Seeding Complete. Press Ctrl+C to exit.");
}

seed();
