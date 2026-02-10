// Script to create admin profile in Firestore
import { initializeApp } from 'firebase/app';
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'firebase/auth';
import { getFirestore, doc, setDoc } from 'firebase/firestore';

// Firebase config from .env
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
const db = getFirestore(app);

async function createAdmin() {
    try {
        console.log('🔧 Creating admin account...');

        // Try to create the user (will fail if already exists)
        let userCredential;
        try {
            userCredential = await createUserWithEmailAndPassword(auth, 'admin@ksk.edu.in', 'admin123');
            console.log('✅ Created new Firebase Auth user');
        } catch (error) {
            if (error.code === 'auth/email-already-in-use') {
                console.log('ℹ️  User already exists in Auth, signing in...');
                userCredential = await signInWithEmailAndPassword(auth, 'admin@ksk.edu.in', 'admin123');
            } else {
                throw error;
            }
        }

        const uid = userCredential.user.uid;
        console.log('📝 User UID:', uid);

        // Create user mapping in 'users' collection
        await setDoc(doc(db, "users", uid), {
            uid: uid,
            email: 'admin@ksk.edu.in',
            role: 'admin',
            phone: '9999999999',
            createdAt: new Date().toISOString()
        });
        console.log('✅ Created user mapping in "users" collection');

        // Create admin profile in 'admins' collection
        await setDoc(doc(db, "admins", uid), {
            uid: uid,
            email: 'admin@ksk.edu.in',
            name: 'Super Admin',
            phone: '9999999999',
            createdAt: new Date().toISOString()
        });
        console.log('✅ Created admin profile in "admins" collection');

        console.log('\n🎉 SUCCESS! Admin account created!');
        console.log('📧 Email: admin@ksk.edu.in');
        console.log('🔑 Password: admin123');
        console.log('\n👉 Now refresh your browser and login!');

        process.exit(0);
    } catch (error) {
        console.error('❌ Error:', error.message);
        process.exit(1);
    }
}

createAdmin();
