import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const ProtectedRoute = ({ allowedRoles }) => {
    const { user, userData, loading } = useAuth();

    if (loading) return <div className="flex h-screen items-center justify-center">Loading...</div>;

    if (!user) {
        return <Navigate to="/login" replace />;
    }

    // specific check: if user is logged in but userData is still null, 
    // we might need to wait or it means the profile doesn't exist. 
    // If we simply return Outlet, the Dashboard might crash accessing userData variables.
    if (user && !userData) {
        return (
            <div className="flex h-screen flex-col items-center justify-center gap-4 bg-slate-50">
                <div className="w-10 h-10 border-4 border-brand-orange border-t-transparent rounded-full animate-spin"></div>
                <p className="text-slate-600 font-medium">Loading User Profile...</p>
                <p className="text-xs text-slate-400">UID: {user.uid}</p>
                <button
                    onClick={() => window.location.reload()}
                    className="text-sm text-blue-600 hover:underline"
                >
                    Reload Page
                </button>
                {/* Emergency Logout in case of stuck state */}
                <button
                    onClick={() => {
                        import('../lib/firebase').then(({ auth }) => auth.signOut());
                        window.location.href = '/login';
                    }}
                    className="text-sm text-red-500 hover:underline"
                >
                    Logout & Try Again
                </button>
            </div>
        );
    }

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
