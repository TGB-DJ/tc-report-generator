import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { motion } from 'framer-motion';
import { LogIn, User, Lock, AlertCircle, Eye, EyeOff } from 'lucide-react';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../lib/firebase';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Card from '../components/ui/Card';

const Login = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const { login, loginWithGoogle, userData, user, loading: authLoading } = useAuth();
    const navigate = useNavigate();

    useEffect(() => {
        if (userData) {
            if (userData.role === 'admin') navigate('/admin');
            else if (['teacher', 'hod'].includes(userData.role)) navigate('/teacher');
            else if (userData.role === 'student') navigate('/student');
        } else if (user && !authLoading && !userData) {
            // User logged in but no profile found in Firestore
            setError('Login successful but no account profile found. Please contact admin.');
        }
    }, [userData, user, authLoading, navigate]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            let loginEmail = email;

            // Check if input is NOT an email (assume it's a phone number)
            const isEmail = String(email).toLowerCase().match(
                /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/
            );

            if (!isEmail) {
                // Try to find user by phone
                const q = query(collection(db, "users"), where("phone", "==", email));
                const querySnapshot = await getDocs(q);

                if (querySnapshot.empty) {
                    throw new Error("Phone number not found. Please contact admin.");
                }

                // Get the first matching document
                const userDoc = querySnapshot.docs[0].data();
                loginEmail = userDoc.email;
            }

            await login(loginEmail, password);
        } catch (err) {
            console.error(err);
            setError(err.message || 'Failed to sign in. Please check your credentials.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-100 to-orange-50 p-4">
            <div className="w-full max-w-md">
                <div className="text-center mb-8">
                    <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="mb-6 flex justify-center"
                    >
                        <img
                            src="/logo.svg"
                            alt="College Logo"
                            className="w-24 h-24 object-contain filter drop-shadow-xl"
                        />
                    </motion.div>
                    <h1 className="text-3xl font-bold text-slate-900">Welcome Back</h1>
                    <p className="text-slate-500 mt-2">Kanchi Shri Krishna College of Arts and Science</p>
                </div>

                <Card className="backdrop-blur-xl bg-white/80">
                    <form onSubmit={handleSubmit} className="space-y-6">
                        {error && (
                            <motion.div
                                initial={{ opacity: 0, y: -10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="p-3 rounded-lg bg-red-50 text-red-600 text-sm flex items-center gap-2"
                            >
                                <AlertCircle size={16} />
                                {error}
                            </motion.div>
                        )}

                        <div className="relative">
                            <User size={18} className="absolute left-3 top-10 text-slate-400" />
                            <Input
                                label="Email or Phone Number"
                                type="text"
                                placeholder="Required"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="pl-10"
                                required
                                autoComplete="off"
                                name="login_email_field_no_autofill"
                                id="login_email"
                                onFocus={(e) => e.target.removeAttribute('readonly')}
                                readOnly
                            />
                        </div>

                        <div className="relative">
                            <Lock size={18} className="absolute left-3 top-10 text-slate-400" />
                            <Input
                                label="Password"
                                type={showPassword ? "text" : "password"}
                                placeholder="Required"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="pl-10 pr-10"
                                required
                                autoComplete="new-password"
                                name="login_password_field_no_autofill"
                                id="login_password"
                                onFocus={(e) => e.target.removeAttribute('readonly')}
                                readOnly
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-3 top-[2.4rem] text-slate-400 hover:text-slate-600 transition-colors"
                            >
                                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                            </button>
                        </div>

                        <Button type="submit" className="w-full" isLoading={loading}>
                            Sign In
                        </Button>

                        <div className="relative my-4">
                            <div className="absolute inset-0 flex items-center">
                                <div className="w-full border-t border-slate-200"></div>
                            </div>
                            <div className="relative flex justify-center text-sm">
                                <span className="px-2 bg-white text-slate-500">Or continue with</span>
                            </div>
                        </div>

                        <button
                            type="button"
                            onClick={async () => {
                                try {
                                    setLoading(true);
                                    await loginWithGoogle();
                                } catch (err) {
                                    setError(err.message);
                                } finally {
                                    setLoading(false);
                                }
                            }}
                            className="w-full flex items-center justify-center gap-2 px-4 py-2 border border-slate-200 rounded-lg text-slate-700 hover:bg-slate-50 hover:border-slate-300 transition-colors font-medium"
                        >
                            <svg className="w-5 h-5" viewBox="0 0 24 24">
                                <path
                                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                                    fill="#4285F4"
                                />
                                <path
                                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                                    fill="#34A853"
                                />
                                <path
                                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                                    fill="#FBBC05"
                                />
                                <path
                                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                                    fill="#EA4335"
                                />
                            </svg>
                            Google
                        </button>

                        {/* Hint for demo/dev purposes */}
                        <div className="text-xs text-center text-slate-400 mt-6">
                            Powered by <span className="font-bold text-brand-orange">CJ Productions</span>
                        </div>

                        {/* Emergency Repair Tool */}
                        <div className="mt-8 pt-4 border-t border-slate-100 text-center">
                            <button
                                type="button"
                                onClick={async () => {
                                    if (!window.confirm("This will attempt to fix missing Admin/Student accounts. Continue?")) return;
                                    setLoading(true);
                                    try {
                                        // Dynamic import to allow repair actions
                                        const { doc, setDoc, getDoc } = await import('firebase/firestore');
                                        const { signInWithEmailAndPassword } = await import('firebase/auth');
                                        const { auth, db } = await import('../lib/firebase');

                                        const fixUser = async (email, password, role, collectionName, data) => {
                                            try {
                                                console.log(`Fixing ${email}...`);
                                                const cred = await signInWithEmailAndPassword(auth, email, password);
                                                const uid = cred.user.uid;

                                                await setDoc(doc(db, "users", uid), {
                                                    uid, email, role, phone: data.phone || "", createdAt: new Date().toISOString()
                                                }, { merge: true });

                                                await setDoc(doc(db, collectionName, uid), {
                                                    uid, email, ...data, createdAt: new Date().toISOString()
                                                }, { merge: true });
                                                console.log(`Fixed ${email}`);
                                            } catch (e) {
                                                console.error(`Error fixing ${email}:`, e);
                                            }
                                        };

                                        // Fix Admin
                                        await fixUser("admin@ksk.edu.in", "admin123", "admin", "admins", { name: "Super Admin", phone: "9999999999" });
                                        // Fix Specific Admin (Password based fallback)
                                        await fixUser("chirenjeevi7616@gmail.com", "admin123", "admin", "admins", { name: "Chirenjeevi", phone: "9999999999" });

                                        // Fix Student (User's specific account)
                                        await fixUser("12256@ksk.edu.in", "122560", "student", "students", {
                                            name: "Test Student", regno: "12256", dept: "B.Sc CS", class: "II Year",
                                            academicYear: "2025-2026", conduct: "Good",
                                            fees: { total: 30000, paid: 10000, balance: 20000 }
                                        });

                                        alert("Database Repair Attempted! Try logging in now.");
                                        window.location.reload();
                                    } catch (err) {
                                        console.error(err);
                                        alert("Repair failed: " + err.message);
                                        setLoading(false);
                                    }
                                }}
                                className="text-[10px] text-brand-orange hover:underline opacity-50 hover:opacity-100"
                            >
                                🔧 Repair Database (Dev Only)
                            </button>
                        </div>
                    </form>
                </Card>
            </div>
        </div>
    );
};

export default Login;
