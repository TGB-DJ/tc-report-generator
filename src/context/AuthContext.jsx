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

        // GLOBAL SAFETY NET: Force loading to false after 8 seconds if nothing else does.
        // This prevents the infinite "Loading Application..." screen if Firebase hangs.
        const globalSafetyTimeout = setTimeout(() => {
            setLoading((prevLoading) => {
                if (prevLoading) {
                    console.error('[AuthContext] Global safety timeout triggered. Forcing app to load.');
                    return false;
                }
                return prevLoading;
            });
        }, 8000);

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
                        console.log('[AuthContext] User data:', data);
                        setUserData(data);
                        setLoading(false); // <--- CRITICAL FIX: Stop loading immediately on success
                    } else {
                        console.warn('[AuthContext] No user document found for UID:', currentUser.uid);

                        // --- SELF REPAIR MECHANISM ---
                        // If user exists in Auth but not in 'users' collection, try to find them in role-specific collections and restore.
                        const restoreUser = async () => {
                            try {
                                console.log('[AuthContext] Attempting to restore user profile...');

                                // Safety Timeout for Restore operation
                                const restorePromise = async () => {
                                    let role = null;
                                    let profileData = null;

                                    // Check Students
                                    const studentSnap = await getDoc(doc(db, "students", currentUser.uid));
                                    if (studentSnap.exists()) {
                                        role = 'student';
                                        profileData = studentSnap.data();
                                    } else {
                                        // Check Teachers
                                        const teacherSnap = await getDoc(doc(db, "teachers", currentUser.uid));
                                        if (teacherSnap.exists()) {
                                            role = teacherSnap.data().role === 'hod' ? 'hod' : 'teacher';
                                            profileData = teacherSnap.data();
                                        } else {
                                            // Check Admins
                                            const adminSnap = await getDoc(doc(db, "admins", currentUser.uid));
                                            if (adminSnap.exists()) {
                                                role = 'admin';
                                                profileData = adminSnap.data();
                                            }
                                        }
                                    }

                                    if (role && profileData) {
                                        console.log(`[AuthContext] Found user in ${role}s collection. Restoring 'users' record...`);
                                        const restoredData = {
                                            uid: currentUser.uid,
                                            email: currentUser.email,
                                            role: role,
                                            phone: profileData.phone || "",
                                            photoUrl: profileData.photoUrl || "",
                                            name: profileData.name || "",
                                            restoredAt: new Date().toISOString()
                                        };

                                        await setDoc(doc(db, "users", currentUser.uid), restoredData);
                                        setUserData(restoredData);
                                        console.log('[AuthContext] Restoration successful.');
                                    } else {
                                        console.error('[AuthContext] User not found in any collection. Cannot restore.');
                                        setUserData(null);
                                    }
                                };

                                // Race between restore and a 5s timeout
                                await Promise.race([
                                    restorePromise(),
                                    new Promise((_, reject) => setTimeout(() => reject(new Error("Restore operation timed out")), 5000))
                                ]);

                            } catch (err) {
                                console.error('[AuthContext] Restoration failed:', err);
                                setUserData(null);
                            } finally {
                                console.log('[AuthContext] restoreUser finished. Setting loading false.');
                                setLoading(false);
                            }
                        };

                        restoreUser();
                        // -----------------------------
                    }
                });
            } else {
                // User is not logged in
                setUserData(null);
                setLoading(false);
            }
        });

        return () => {
            console.log('[AuthContext] Cleanup - unsubscribing listeners');
            unsubscribeAuth();
            if (unsubscribeFirestore) unsubscribeFirestore();
            if (loadingTimeout) clearTimeout(loadingTimeout);
            clearTimeout(globalSafetyTimeout);
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
            }, 5 * 60 * 1000); // 5 minutes
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
            if (error.code === 'auth/account-exists-with-different-credential') {
                // This happens if the user has a password account but tries to sign in with Google
                // and "One account per email address" is enabled in Firebase Console.
                // We can't automatically link without the password, but we can notify the user.
                throw new Error("An account with this email already exists. Please login with your password.");
            }
            // Handle the specific case where we want to allow Google Login to takeover/link
            // For a school app, if the email matches, we generally trust the Google Account.
            // However, Firebase security requires successful login with the FIRST method before linking.

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
                        <button
                            onClick={() => window.location.reload()}
                            className="text-xs text-blue-500 underline mt-4"
                        >
                            Taking too long? Reload
                        </button>
                        <button
                            onClick={() => signOut(auth)}
                            className="text-xs text-red-400 hover:text-red-600 underline"
                        >
                            Sign Out
                        </button>
                    </div>
                </div>
            ) : (
                children
            )}
        </AuthContext.Provider>
    );
};
