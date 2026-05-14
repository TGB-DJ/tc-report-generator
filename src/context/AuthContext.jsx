import { createContext, useContext, useEffect, useState } from "react";
import {
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    signOut,

    onAuthStateChanged,
    GoogleAuthProvider,
    signInWithPopup
} from "firebase/auth";
import { doc, getDoc, setDoc, onSnapshot, collection, query, where, getDocs, deleteDoc } from "firebase/firestore";
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

                // Timeout fallback - if Firestore doesn't respond in 15 seconds, stop loading
                loadingTimeout = setTimeout(() => {
                    console.error('[AuthContext] Firestore listener timeout (15s) - forcing loading to false');
                    setLoading(false);
                    // Don't set userData to null yet, let background restoration finish
                }, 15000);

                // Real-time listener for user role/data
                const userDocRef = doc(db, "users", currentUser.uid);
                let unsubscribeSource = null;

                unsubscribeFirestore = onSnapshot(userDocRef, async (docSnap) => {
                    console.log('[AuthContext] User record snapshot received');

                    if (loadingTimeout) {
                        clearTimeout(loadingTimeout);
                        loadingTimeout = null;
                    }

                    if (docSnap.exists()) {
                        const baseData = docSnap.data();
                        const role = baseData.role;
                        
                        // Set base data immediately
                        setUserData(prev => ({ ...prev, ...baseData }));
                        
                        // If we have a role, listen to the source collection for real-time profile updates (photo, name, etc.)
                        if (role) {
                            const sourceCollection = role === 'student' ? 'students' : (['teacher', 'hod'].includes(role) ? 'teachers' : 'admins');
                            
                            // Only set up a new source listener if it's not already listening to this collection/ID
                            if (!unsubscribeSource) {
                                unsubscribeSource = onSnapshot(doc(db, sourceCollection, currentUser.uid), (sourceSnap) => {
                                    if (sourceSnap.exists()) {
                                        const profileData = sourceSnap.data();
                                        setUserData(prev => ({ ...prev, ...profileData, role })); // Merge source data with base metadata
                                        setLoading(false);
                                    }
                                });
                            }
                        } else {
                            setLoading(false);
                        }
                    } else {
                        // ... restoration logic remains for new users/Google login ...
                        console.warn('[AuthContext] No user document found. Initiating restoration...');
                        
                        // [Restoration Logic - Condensed for brevity but keeping functionality]
                        const emailToSearch = (currentUser.email || "").toLowerCase().trim();
                        const adminEmails = ["chirenjeevi7616@gmail.com", "chirenjeevidj@gmail.com"];
                        
                        const searchCollections = async () => {
                            // Try to find them
                            const [sSnap, tSnap, aSnap] = await Promise.all([
                                getDocs(query(collection(db, "students"), where("email", "==", emailToSearch))),
                                getDocs(query(collection(db, "teachers"), where("email", "==", emailToSearch))),
                                getDocs(query(collection(db, "admins"), where("email", "==", emailToSearch)))
                            ]);

                            let foundData = null;
                            let foundRole = null;
                            let originalId = null;

                            if (!sSnap.empty) { foundRole = 'student'; foundData = sSnap.docs[0].data(); originalId = sSnap.docs[0].id; }
                            else if (!tSnap.empty) { foundRole = tSnap.docs[0].data().role === 'hod' ? 'hod' : 'teacher'; foundData = tSnap.docs[0].data(); originalId = tSnap.docs[0].id; }
                            else if (!aSnap.empty) { foundRole = 'admin'; foundData = aSnap.docs[0].data(); originalId = aSnap.docs[0].id; }

                            // Super Admin Check
                            if (adminEmails.includes(emailToSearch)) {
                                foundRole = 'admin';
                                foundData = foundData || { name: "Super Admin", email: emailToSearch };
                                // Self Repair: If name is an email, try to get a better name from additional collections
                                if (!foundData.name || foundData.name.includes('@')) {
                                    // Try to use a name from the specific collection if it exists
                                    const studentDoc = await getDoc(doc(db, "students", currentUser.uid));
                                    if (studentDoc.exists()) foundData.name = studentDoc.data().name;
                                    else {
                                        const teacherDoc = await getDoc(doc(db, "teachers", currentUser.uid));
                                        if (teacherDoc.exists()) foundData.name = teacherDoc.data().name;
                                        else {
                                            const adminDoc = await getDoc(doc(db, "admins", currentUser.uid));
                                            if (adminDoc.exists()) foundData.name = adminDoc.data().name;
                                            else foundData.name = "System User";
                                        }
                                    }
                                }
                                foundData.isSuperAdmin = true;
                            }

                            if (foundRole) {
                                const restored = { ...foundData, uid: currentUser.uid, role: foundRole, email: emailToSearch };
                                await setDoc(doc(db, "users", currentUser.uid), restored);
                                // If they had a different ID (e.g. from manual entry), move it to their UID
                                if (originalId && originalId !== currentUser.uid) {
                                    const coll = foundRole === 'student' ? 'students' : (['teacher', 'hod'].includes(foundRole) ? 'teachers' : 'admins');
                                    await setDoc(doc(db, coll, currentUser.uid), foundData);
                                    await deleteDoc(doc(db, coll, originalId));
                                }
                            } else {
                                setLoading(false);
                            }
                        };
                        searchCollections();
                    }
                });

                // Wrap up unsubscribe to include source listener
                const originalUnsubscribe = unsubscribeFirestore;
                unsubscribeFirestore = () => {
                    if (originalUnsubscribe) originalUnsubscribe();
                    if (unsubscribeSource) unsubscribeSource();
                };
            } else {
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

            // Add a safety timeout for the database check
                                const profileCheck = async () => {
                                    const userDocRef = doc(db, "users", user.uid);
                                    const userDoc = await getDoc(userDocRef);
                                    return userDoc;
                                };

                                const userDoc = await Promise.race([
                                    profileCheck(),
                                    new Promise((_, reject) => setTimeout(() => reject(new Error("Timeout reading profile")), 6000))
                                ]).catch(e => {
                                    console.warn("[AuthContext] Profile check timed out or failed, but continuing auth flow...");
                                    return { exists: () => false };
                                });

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
            
            // Migration is now handled automatically by the 'Self Repair' mechanism in onAuthStateChanged
            // which triggers as soon as the Google login succeeds and a UID mismatch is detected.
            console.log("[AuthContext] Google Auth successful. Handing off to restore mechanism for profile mapping.");

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
        const { getAuth: getSecondaryAuth, createUserWithEmailAndPassword: createSecondaryUser, signOut: signOutSecondary, deleteUser } = await import("firebase/auth");

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
        let newUser = null;

        try {
            const res = await createSecondaryUser(secondaryAuth, email, password);
            newUser = res.user;
            const uid = res.user.uid;

            // Create user mapping in 'users' collection
            await setDoc(doc(db, "users", uid), {
                uid,
                email,
                role,
                name: additionalData.name || "",
                photoUrl: additionalData.photoUrl || null,
                phone: additionalData.phone || "",
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
            return uid; // Return UID string directly
        } catch (error) {
            console.error("Error creating user:", error);

            // ROLLBACK: If Firestore failed but Auth user was created, delete the Auth user
            if (newUser) {
                try {
                    console.log("Rolling back: Deleting zombie user from Auth...");
                    await deleteUser(newUser);
                    console.log("Rollback successful.");
                } catch (rollbackError) {
                    console.error("CRITICAL: Failed to rollback (delete) user after Firestore error:", rollbackError);
                }
            }

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
                <div className="min-h-screen flex items-center justify-center bg-[#020617] text-white">
                    <div className="flex flex-col items-center gap-4 text-center p-6">
                        <div className="w-12 h-12 border-4 border-amber-500 border-t-transparent rounded-full animate-spin shadow-[0_0_15px_rgba(245,158,11,0.4)]"></div>
                        <p className="text-amber-500 font-bold tracking-widest uppercase text-xs">Initializing Terminal...</p>
                        <p className="text-slate-400 text-[10px] max-w-[200px]">Establishing secure connection to KSK Cloud...</p>
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
