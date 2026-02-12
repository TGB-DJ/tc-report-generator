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
    const [identifier, setIdentifier] = useState(''); // Email, Phone, RegNo, CID
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const { login, loginWithGoogle, userData, user, loading: authLoading } = useAuth();
    const navigate = useNavigate();

    useEffect(() => {
        if (userData) {
            if (userData.role === 'admin') {
                navigate('/admin'); // Always go to Dashboard first
            }
            else if (['teacher', 'hod'].includes(userData.role)) {
                navigate('/teacher');
            }
            else if (userData.role === 'student') navigate('/student');
        } else if (user && !authLoading && !userData) {
            setError('Login successful but no account profile found. Please contact admin.');
        }
    }, [userData, user, authLoading, navigate]);

    const handleLogin = async (e) => {
        e.preventDefault();
        console.log("Sign In button clicked. Identifier:", identifier); // DEBUG

        setError('');
        setLoading(true);

        try {
            let loginEmail = identifier.trim();
            const inputLower = loginEmail.toLowerCase();
            console.log("Analyzing identifier:", inputLower); // DEBUG

            // 1. Check if Email
            const isEmail = inputLower.includes('@');

            if (!isEmail) {
                // 2. Check if Phone (Digits only > 6)
                const cleanPhone = identifier.replace(/[\s-]/g, '');
                const isPhone = /^\d{7,}$/.test(cleanPhone);
                console.log("Is Phone?", isPhone); // DEBUG

                if (isPhone) {
                    // Try 'users' collection first
                    const q = query(collection(db, "users"), where("phone", "==", identifier));
                    let querySnapshot = await getDocs(q);

                    if (!querySnapshot.empty) {
                        loginEmail = querySnapshot.docs[0].data().email;
                        console.log("Found email in Users:", loginEmail); // DEBUG
                    } else {
                        // Check Students
                        const qStudentPhone = query(collection(db, "students"), where("phone", "==", identifier));
                        const studentPhoneSnap = await getDocs(qStudentPhone);

                        if (!studentPhoneSnap.empty) {
                            loginEmail = studentPhoneSnap.docs[0].data().email;
                            console.log("Found email in Students:", loginEmail); // DEBUG
                        } else {
                            // Check Teachers
                            const qTeacherPhone = query(collection(db, "teachers"), where("phone", "==", identifier));
                            const teacherPhoneSnap = await getDocs(qTeacherPhone);

                            if (!teacherPhoneSnap.empty) {
                                loginEmail = teacherPhoneSnap.docs[0].data().email;
                                console.log("Found email in Teachers:", loginEmail); // DEBUG
                            } else {
                                throw new Error("Phone number not found in any database records.");
                            }
                        }
                    }
                } else {
                    // 3. Check Register Number (Student)
                    console.log("Checking Register Number / Staff ID..."); // DEBUG
                    const studentsRef = collection(db, "students");
                    const qStudent = query(studentsRef, where("regno", "==", identifier));
                    const studentSnap = await getDocs(qStudent);

                    if (!studentSnap.empty) {
                        loginEmail = studentSnap.docs[0].data().email;
                        console.log("Found student email:", loginEmail); // DEBUG
                    } else {
                        // 4. Check Staff ID (CID) -> Teachers
                        const teachersRef = collection(db, "teachers");
                        const qTeacher = query(teachersRef, where("cid", "==", identifier));
                        const teacherSnap = await getDocs(qTeacher);

                        if (!teacherSnap.empty) {
                            loginEmail = teacherSnap.docs[0].data().email;
                            console.log("Found teacher email:", loginEmail); // DEBUG
                        } else {
                            throw new Error("ID / Register Number not found.");
                        }
                    }
                }
            }

            console.log("Attempting Firebase Auth with:", loginEmail); // DEBUG
            await login(loginEmail, password);
            console.log("Firebase Auth successful"); // DEBUG

        } catch (err) {
            console.error("Login Error:", err);
            setError(err.message || 'Authentication failed. Please check your credentials.');
        } finally {
            console.log("Login attempt finished. Loading: false"); // DEBUG
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

                <Card className="backdrop-blur-xl bg-white/80 p-0 overflow-hidden">
                    <div className="p-8 space-y-6">
                        <div className="text-center">
                            <h2 className="text-xl font-semibold text-slate-800">Sign In</h2>
                            <p className="text-sm text-slate-500 mt-1">Enter your credentials to access the portal</p>
                        </div>

                        <form onSubmit={handleLogin} className="space-y-6">
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

                            <div className="space-y-4">
                                <Input
                                    label="Email / Phone / Reg No / Staff ID"
                                    icon={User}
                                    type="text"
                                    placeholder="Enter ID, Email or Phone"
                                    value={identifier}
                                    onChange={(e) => setIdentifier(e.target.value)}
                                    required
                                />

                                <div className="relative">
                                    <Input
                                        label="Password"
                                        icon={Lock}
                                        type={showPassword ? "text" : "password"}
                                        placeholder="Enter your password"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        required
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-3 top-[38px] text-slate-400 hover:text-slate-600"
                                    >
                                        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                    </button>
                                </div>
                            </div>

                            <div className="flex justify-between items-center text-sm">
                                <a href="#" onClick={(e) => {
                                    e.preventDefault();
                                    alert("Please contact the Admin Office to reset your password.");
                                }} className="text-brand-orange hover:underline">
                                    Forgot Password?
                                </a>
                            </div>

                            <Button
                                type="submit"
                                className="w-full py-3 text-lg shadow-lg shadow-orange-500/20"
                                disabled={loading}
                            >
                                {loading ? (
                                    <motion.div
                                        animate={{ rotate: 360 }}
                                        transition={{ repeat: Infinity, duration: 1 }}
                                        className="w-6 h-6 border-2 border-white border-t-transparent rounded-full mx-auto"
                                    />
                                ) : (
                                    <span className="flex items-center justify-center gap-2">
                                        <LogIn size={20} />
                                        Sign In
                                    </span>
                                )}
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
                        </form>
                    </div>
                </Card>
            </div>
        </div >
    );
};

export default Login;
