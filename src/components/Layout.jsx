import { useState } from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { LogOut, Menu, X, Home, Users, GraduationCap, FileText, Settings } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import clsx from 'clsx';
import GlowingLogo from './ui/GlowingLogo';


const SidebarLink = ({ to, icon: Icon, label, onClick, isCollapsed }) => {
    const location = useLocation();
    // Exact match for dashboard routes, startsWith for others
    const isDashboard = to === '/admin' || to === '/student' || to === '/teacher';
    const isActive = isDashboard
        ? location.pathname === to
        : location.pathname.startsWith(to);

    return (
        <Link
            to={to}
            onClick={onClick}
            className={clsx(
                "flex items-center gap-3 py-3 rounded-xl transition-all duration-200 group relative overflow-hidden",
                isCollapsed ? "justify-center px-2" : "px-4",
                isActive
                    ? "bg-brand-orange text-white shadow-lg shadow-orange-500/30"
                    : "text-slate-600 hover:bg-slate-100 hover:text-brand-orange"
            )}
            title={isCollapsed ? label : ""}
        >
            <Icon size={20} className={clsx("relative z-10 flex-shrink-0", isActive ? "text-white" : "text-slate-500 group-hover:text-brand-orange")} />
            {!isCollapsed && (
                <motion.span
                    initial={{ opacity: 0, width: 0 }}
                    animate={{ opacity: 1, width: "auto" }}
                    exit={{ opacity: 0, width: 0 }}
                    transition={{ duration: 0.2 }}
                    className="relative z-10 font-medium whitespace-nowrap overflow-hidden"
                >
                    {label}
                </motion.span>
            )}
            {isActive && (
                <motion.div
                    layoutId="sidebar-active"
                    className="absolute inset-0 bg-brand-orange z-0"
                    initial={false}
                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                />
            )}
        </Link>
    );
};

const Layout = () => {
    const { userData, logout } = useAuth();
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [isSidebarCollapsed, setSidebarCollapsed] = useState(true); // Default collapsed

    const isTeacherLayout = userData?.role === 'teacher' || userData?.role === 'hod';

    const toggleMenu = () => setIsMobileMenuOpen(!isMobileMenuOpen);

    const renderLinks = () => {
        const commonProps = { isCollapsed: isSidebarCollapsed, onClick: () => setIsMobileMenuOpen(false) };
        switch (userData?.role) {
            case 'admin':
                return (
                    <>
                        <SidebarLink to="/admin" icon={Home} label="Dashboard" {...commonProps} />
                        <SidebarLink to="/admin/students" icon={GraduationCap} label="Students" {...commonProps} />
                        <SidebarLink to="/admin/teachers" icon={Users} label="Teachers" {...commonProps} />
                        <SidebarLink to="/admin/events" icon={FileText} label="Events" {...commonProps} />
                        {(userData?.isSuperAdmin || userData?.email === 'chirenjeevi7616@gmail.com') && (
                            <SidebarLink to="/admin/admins" icon={Settings} label="Admins" {...commonProps} />
                        )}
                    </>
                );
            case 'teacher':
            case 'hod':
                return null;

            case 'student':
                return (
                    <>
                        <SidebarLink to="/student" icon={Home} label="Dashboard" {...commonProps} />
                        <SidebarLink to="/student/tc" icon={FileText} label="TC Format" {...commonProps} />
                    </>
                );
            default:
                return null;
        }
    };

    return (
        <div className="flex h-screen bg-slate-50">
            {/* Mobile Overlay */}
            <AnimatePresence>
                {!isTeacherLayout && isMobileMenuOpen && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={toggleMenu}
                        className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40 lg:hidden"
                    />
                )}
            </AnimatePresence>

            {/* Sidebar - Hidden for Teachers/HODs */}
            {!isTeacherLayout && (
                <motion.aside
                    initial={{ width: "5rem" }}
                    animate={{ width: isSidebarCollapsed ? "5rem" : "16rem" }}
                    transition={{ duration: 0.3, ease: "easeInOut" }}
                    onMouseEnter={() => setSidebarCollapsed(false)}
                    onMouseLeave={() => setSidebarCollapsed(true)}
                    className={clsx(
                        "fixed lg:static inset-y-0 left-0 z-50 bg-white/80 backdrop-blur-xl border-r border-slate-200 transform transition-transform duration-300 ease-in-out lg:translate-x-0 overflow-hidden",
                        isMobileMenuOpen ? "translate-x-0 w-64" : "-translate-x-full"
                    )}
                >
                    <div className="h-full flex flex-col p-4">
                        <div className="flex flex-col gap-3 mb-10">
                            <div className={clsx("flex items-center transition-all duration-300", isSidebarCollapsed ? "justify-center" : "gap-3 px-2")}>
                                <div className="flex-shrink-0">
                                    <GlowingLogo text="KKC" />
                                </div>
                                <AnimatePresence>
                                    {!isSidebarCollapsed && (
                                        <motion.div
                                            initial={{ opacity: 0, width: 0 }}
                                            animate={{ opacity: 1, width: "auto" }}
                                            exit={{ opacity: 0, width: 0 }}
                                            className="flex-1 min-w-0 overflow-hidden whitespace-nowrap"
                                        >
                                            <h1 className="font-bold text-slate-900 truncate">KSK College</h1>
                                            <p className="text-xs text-slate-500 truncate">PWA System</p>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>
                        </div>

                        <nav className="flex-1 space-y-2">
                            {renderLinks()}
                        </nav>

                        <div className="pt-6 border-t border-slate-100">
                            <AnimatePresence mode="wait">
                                {!isSidebarCollapsed ? (
                                    <motion.div
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        exit={{ opacity: 0 }}
                                        className="mb-4 px-4 py-3 bg-slate-50 rounded-xl text-center border border-slate-100 whitespace-nowrap overflow-hidden"
                                    >
                                        <p className="text-[10px] text-slate-400 uppercase tracking-widest font-bold mb-1">Powered By</p>
                                        <div className="flex items-center justify-center gap-1.5">
                                            <span className="w-2 h-2 rounded-full bg-brand-orange"></span>
                                            <p className="text-xs font-bold text-slate-700">CJ Productions</p>
                                        </div>
                                    </motion.div>
                                ) : (
                                    <motion.div
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        className="mb-4 flex justify-center"
                                    >
                                        <span className="w-2 h-2 rounded-full bg-brand-orange" title="Powered by CJ Productions"></span>
                                    </motion.div>
                                )}
                            </AnimatePresence>

                            <button
                                onClick={logout}
                                className={clsx(
                                    "flex items-center gap-3 py-3 rounded-xl text-slate-600 hover:bg-red-50 hover:text-red-600 transition-colors w-full group overflow-hidden",
                                    isSidebarCollapsed ? "justify-center px-0" : "px-4"
                                )}
                                title={isSidebarCollapsed ? "Logout" : ""}
                            >
                                <LogOut size={20} className="flex-shrink-0 group-hover:text-red-600 transition-colors" />
                                <AnimatePresence>
                                    {!isSidebarCollapsed && (
                                        <motion.span
                                            initial={{ opacity: 0, width: 0 }}
                                            animate={{ opacity: 1, width: "auto" }}
                                            exit={{ opacity: 0, width: 0 }}
                                            className="font-medium whitespace-nowrap"
                                        >
                                            Logout
                                        </motion.span>
                                    )}
                                </AnimatePresence>
                            </button>
                        </div>
                    </div>
                </motion.aside>
            )}

            {/* Main Content */}
            <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
                <header className="h-16 border-b border-slate-200 bg-white/50 backdrop-blur-md flex items-center justify-between px-6 lg:px-8">
                    {isTeacherLayout ? (
                        <div className="flex items-center gap-3">
                            <GlowingLogo text="KKC" />
                            <div>
                                <h1 className="font-bold text-slate-900 leading-tight">KSK College</h1>
                                <p className="text-[10px] text-slate-500">PWA System</p>
                            </div>
                        </div>
                    ) : (
                        <button onClick={toggleMenu} className="lg:hidden p-2 text-slate-600 rounded-lg hover:bg-slate-100">
                            <Menu size={24} />
                        </button>
                    )}

                    <div className="ml-auto flex items-center gap-4">
                        {isTeacherLayout && (
                            <button
                                onClick={logout}
                                className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-slate-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors mr-2"
                            >
                                <LogOut size={18} />
                                <span className="hidden sm:inline">Logout</span>
                            </button>
                        )}
                        <div className="text-right hidden sm:block">
                            <p className="text-sm font-medium text-slate-900">{userData?.email}</p>
                            <p className="text-xs text-slate-500 capitalize">{userData?.role}</p>
                        </div>
                        <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-brand-orange to-red-500 text-white flex items-center justify-center font-bold text-sm shadow-lg shadow-orange-500/20">
                            {userData?.email?.[0].toUpperCase()}
                        </div>
                    </div>
                </header>

                <main className="flex-1 overflow-y-auto p-4 lg:p-8">
                    <Outlet />
                </main>
            </div>
        </div>
    );
};

export default Layout;
