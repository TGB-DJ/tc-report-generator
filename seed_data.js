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
        class: "3rd Year",
        phone: "7777777777",
        dob: "2003-05-15",
        admissionDate: "2023-06-01",
        academicYear: "2025-2026",
        conduct: "Good",
        fees: {
            total: 45000,
            paid: 45000,
            balance: 0,
            registration: {
                total: 5000,
                paid: 5000,
                balance: 0,
                billNo: "REG-23001",
                billDate: "2023-06-01"
            },
            semester: {
                "Sem 1": {
                    total: 20000,
                    paid: 20000,
                    balance: 0,
                    billNo: "SEM1-456",
                    billDate: "2023-08-15"
                },
                "Sem 2": {
                    total: 20000,
                    paid: 20000,
                    balance: 0,
                    billNo: "SEM2-789",
                    billDate: "2024-01-10"
                }
            }
        },
        academicRecords: {
            universityExams: [
                {
                    semester: "1",
                    examSession: "April-2025 - All UG Examination Results",
                    results: [
                        { subjectCode: "200L4E", ue: "060", ia: "025", total: "085", result: "PASS", remark: "" },
                        { subjectCode: "200L4Z", ue: "058", ia: "025", total: "083", result: "PASS", remark: "" },
                        { subjectCode: "200V4D", ue: "040", ia: "025", total: "065", result: "PASS", remark: "" },
                        { subjectCode: "200V4Q", ue: "060", ia: "025", total: "085", result: "PASS", remark: "" },
                        { subjectCode: "225C41", ue: "060", ia: "040", total: "100", result: "PASS", remark: "" },
                        { subjectCode: "225C4A", ue: "062", ia: "025", total: "087", result: "PASS", remark: "" },
                        { subjectCode: "225E4B", ue: "061", ia: "025", total: "086", result: "PASS", remark: "" },
                        { subjectCode: "225S4A", ue: "067", ia: "025", total: "092", result: "PASS", remark: "" },
                        { subjectCode: "NMU63", ue: "074", ia: "025", total: "099", result: "PASS", remark: "" }
                    ]
                }
            ],
            monthlyTests: {
                "July 2025": {
                    subjects: [
                        { name: "Tamil", mark: 45, total: 50 },
                        { name: "English", mark: 42, total: 50 },
                        { name: "Maths", mark: 48, total: 50 }
                    ],
                    attendance: 22,
                    totalDays: 24,
                    attPercentage: 91.6
                }
            }
        }
    });

    // 4. Try to fix the user's specific account
    console.log("Attempting to fix user '12256@ksk.edu.in'...");
    // Try with password '122560'
    await createOrUpdateUser("12256@ksk.edu.in", "122560", "student", "students", {
        name: "Test Student 12256",
        regno: "12256",
        dept: "B.Sc CS",
        class: "2nd Year",
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
