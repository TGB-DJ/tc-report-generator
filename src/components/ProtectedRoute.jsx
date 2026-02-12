import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const ProtectedRoute = ({ allowedRoles }) => {
    const { user, userData, loading } = useAuth();

    if (loading) return <div className="flex h-screen items-center justify-center">Loading...</div>;

    if (!user) {
        return <Navigate to="/login" replace />;
    }

    // If user is logged in, but userData is still missing AFTER loading is done:
    // This means the profile doesn't exist and Auto-Repair failed.
    if (user && !userData && !loading) {
        return (
            <div className="flex h-screen flex-col items-center justify-center gap-4 bg-slate-50 p-4 text-center">
                <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-2">
                    <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                </div>
                <h2 className="text-xl font-bold text-slate-800">Profile Not Found</h2>
                <p className="text-slate-500 max-w-md">
                    We could not find your user profile. This usually happens if your account data was deleted or corrupted.
                    <br /><br />
                    Please contact the Administrator.
                </p>
                <div className="flex gap-4 mt-4">
                    <button
                        onClick={() => window.location.reload()}
                        className="px-4 py-2 text-sm font-medium text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
                    >
                        Try Reloading
                    </button>
                    <button
                        onClick={() => {
                            import('../lib/firebase').then(({ auth }) => auth.signOut());
                            window.location.href = '/login';
                        }}
                        className="px-4 py-2 text-sm font-medium text-white bg-red-500 rounded-lg hover:bg-red-600 transition-colors shadow-lg shadow-red-500/30"
                    >
                        Logout & Sign In Again
                    </button>
                </div>
                <p className="text-xs text-slate-400 mt-6">UID: {user.uid}</p>
            </div>
        );
    }

    // (Previous dead code block removed)

    if (allowedRoles && !allowedRoles.includes(userData?.role)) {
        // Redirect based on role if they try to access unauthorized page
        if (userData?.role === 'admin') return <Navigate to="/admin" replace />;
        if (userData?.role === 'teacher') return <Navigate to="/teacher" replace />;
        if (userData?.role === 'student') return <Navigate to="/student" replace />;
        return <Navigate to="/login" replace />;
    }

    return <Outlet />;
};

export default ProtectedRoute;
