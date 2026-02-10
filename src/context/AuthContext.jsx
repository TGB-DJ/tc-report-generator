import { createContext, useContext, useEffect, useState } from "react";
import {
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    signOut,

    onAuthStateChanged,
    GoogleAuthProvider,
    signInWithPopup
} from "firebase/auth";
import { doc, getDoc, setDoc, onSnapshot } from "firebase/firestore";
import { auth, db } from "../lib/firebase";

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [userData, setUserData] = useState(null); // Stores role and other details
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let unsubscribeFirestore = null;
        let loadingTimeout = null;

        const unsubscribeAuth = onAuthStateChanged(auth, (currentUser) => {
            console.log('[AuthContext] Auth state changed:', currentUser ? `User: ${currentUser.email}` : 'No user');
            setUser(currentUser);

            // Clean up previous Firestore listener if exists
            if (unsubscribeFirestore) {
                unsubscribeFirestore();
                unsubscribeFirestore = null;
            }

            // Clear any existing timeout
            if (loadingTimeout) {
                clearTimeout(loadingTimeout);
                loadingTimeout = null;
            }

            if (currentUser) {
                setLoading(true);
                console.log('[AuthContext] Setting up Firestore listener for UID:', currentUser.uid);

                // Timeout fallback - if Firestore doesn't respond in 5 seconds, stop loading
                loadingTimeout = setTimeout(() => {
                    console.error('[AuthContext] Firestore listener timeout - forcing loading to false');
                    setLoading(false);
                    setUserData(null);
                }, 5000);

                // Real-time listener for user role/data
                const userDocRef = doc(db, "users", currentUser.uid);
                unsubscribeFirestore = onSnapshot(userDocRef, (docSnap) => {
                    console.log('[AuthContext] Firestore snapshot received:', docSnap.exists() ? 'Document exists' : 'No document');

                    // Clear timeout since we got a response
                    if (loadingTimeout) {
                        clearTimeout(loadingTimeout);
                        loadingTimeout = null;
                    }

                    if (docSnap.exists()) {
                        const data = docSnap.data();
                        console.log('[AuthContext] User data:', data);
                        setUserData(data);
                    } else {
                        console.warn('[AuthContext] No user document found for UID:', currentUser.uid);
                        setUserData(null);
                    }
                    setLoading(false);
                }, (error) => {
                    console.error("[AuthContext] Firestore Listener Error:", error);

                    // Clear timeout on error
                    if (loadingTimeout) {
                        clearTimeout(loadingTimeout);
                        loadingTimeout = null;
                    }

                    setLoading(false);
                    setUserData(null);
                });
            } else {
                console.log('[AuthContext] No user - clearing data');
                setUserData(null);
                setLoading(false);
            }
        });

        return () => {
            console.log('[AuthContext] Cleanup - unsubscribing listeners');
            unsubscribeAuth();
            if (unsubscribeFirestore) unsubscribeFirestore();
            if (loadingTimeout) clearTimeout(loadingTimeout);
        };
    }, []);


    // Auto Logout Logic
    useEffect(() => {
        if (!user) return;

        let logoutTimer;

        const resetTimer = () => {
            if (logoutTimer) clearTimeout(logoutTimer);
            logoutTimer = setTimeout(() => {
                alert("You have been logged out due to inactivity.");
                logout();
            }, 2 * 60 * 1000); // 2 minutes
        };

        const events = ['mousedown', 'keydown', 'scroll', 'touchstart'];
        events.forEach(event => document.addEventListener(event, resetTimer));

        resetTimer(); // Start timer on mount/login

        return () => {
            if (logoutTimer) clearTimeout(logoutTimer);
            events.forEach(event => document.removeEventListener(event, resetTimer));
        };
    }, [user]);

    const login = (email, password) => {
        return signInWithEmailAndPassword(auth, email, password);
    };

    const loginWithGoogle = async () => {
        const provider = new GoogleAuthProvider();
        try {
            const result = await signInWithPopup(auth, provider);
            const user = result.user;

            // Check if user exists in Firestore, if not create a default student profile/user map?
            // Or just check role. If no role, maybe assign 'student' by default or restrict?
            // For now, let's just ensure the user mapping exists so they don't get stuck.

            const userDocRef = doc(db, "users", user.uid);
            const userDoc = await getDoc(userDocRef);

            // Hardcoded Admin Access
            if (user.email === "chirenjeevi7616@gmail.com") {
                await setDoc(doc(db, "users", user.uid), {
                    uid: user.uid,
                    email: user.email,
                    role: "admin",
                    phone: user.phoneNumber || "",
                    createdAt: new Date().toISOString()
                }, { merge: true });

                await setDoc(doc(db, "admins", user.uid), {
                    uid: user.uid,
                    email: user.email,
                    name: user.displayName || "Super Admin",
                    createdAt: new Date().toISOString()
                }, { merge: true });
            }
            else if (!userDoc.exists()) {
                // RESTRICTED ACCESS: 
                // Only allow login if the user already exists in the 'users' collection 
                // (i.e., created by Admin or Seed script)

                // Sign out the unauthorized user immediately
                await signOut(auth);

                throw new Error("Access Denied. Your account has not been created by the Administrator.");
            }

            return user;
        } catch (error) {
            console.error("Google Login Error:", error);
            throw error;
        }
    };

    const logout = () => {
        return signOut(auth);
    };

    // Function to create a user and storing their role (for Admin usage)
    const createUser = async (email, password, role, additionalData = {}) => {
        // Dynamic import to avoid initial load weight and handle Secondary App
        const { initializeApp, getApps, getApp, deleteApp } = await import("firebase/app");
        const { getAuth: getSecondaryAuth, createUserWithEmailAndPassword: createSecondaryUser, signOut: signOutSecondary } = await import("firebase/auth");

        const SECONDARY_APP_NAME = "secondaryApp";
        let secondaryApp;

        if (getApps().some(app => app.name === SECONDARY_APP_NAME)) {
            secondaryApp = getApp(SECONDARY_APP_NAME);
        } else {
            const config = {
                apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
                authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
                projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
                storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
                messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
                appId: import.meta.env.VITE_FIREBASE_APP_ID
            };
            secondaryApp = initializeApp(config, SECONDARY_APP_NAME);
        }

        const secondaryAuth = getSecondaryAuth(secondaryApp);

        try {
            const res = await createSecondaryUser(secondaryAuth, email, password);
            const uid = res.user.uid;

            // Create user mapping in 'users' collection
            await setDoc(doc(db, "users", uid), {
                uid,
                email,
                role,
                phone: additionalData.phone || "", // Save phone for lookup
                createdAt: new Date().toISOString()
            });

            // Create profile in specific collection
            const collectionName = role === 'student' ? 'students' : (['teacher', 'hod'].includes(role) ? 'teachers' : 'admins');
            await setDoc(doc(db, collectionName, uid), {
                uid,
                email,
                password, // Storing password as requested for admin visibility
                ...additionalData,
                createdAt: new Date().toISOString()
            });

            await signOutSecondary(secondaryAuth);
            return uid;
        } catch (error) {
            console.error("Error creating user:", error);
            throw error;
        }
    };

    const value = {
        user,
        userData,
        loading,
        login,
        loginWithGoogle,
        logout,
        createUser
    };

    return (
        <AuthContext.Provider value={value}>
            {loading ? (
                <div className="min-h-screen flex items-center justify-center bg-slate-50">
                    <div className="flex flex-col items-center gap-4">
                        <div className="w-10 h-10 border-4 border-brand-orange border-t-transparent rounded-full animate-spin"></div>
                        <p className="text-slate-500 font-medium">Loading Application...</p>
                    </div>
                </div>
            ) : (
                children
            )}
        </AuthContext.Provider>
    );
};
