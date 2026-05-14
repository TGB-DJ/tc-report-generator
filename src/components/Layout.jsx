import { useState, useEffect, useRef } from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { LogOut, Menu, X, Home, Users, GraduationCap, FileText, Settings, ClipboardCheck, Sun, Moon, Bell, User, BookOpen, CreditCard, Share2, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import clsx from 'clsx';

// ── Golden Dust Animation (Global) ───────────────────────────
const GoldenDust = () => {
    const canvasRef = useRef(null);
    useEffect(() => {
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        let animationFrameId;
        let particles = [];
        const resize = () => { canvas.width = window.innerWidth; canvas.height = window.innerHeight; };
        window.addEventListener('resize', resize);
        resize();
        class Particle {
            constructor() { this.reset(); }
            reset() {
                this.x = Math.random() * canvas.width;
                this.y = Math.random() * canvas.height;
                this.size = Math.random() * 2 + 0.5;
                this.speedX = Math.random() * 0.4 - 0.2;
                this.speedY = Math.random() * 0.4 - 0.2;
                this.life = Math.random() * 100 + 100;
                this.opacity = Math.random() * 0.5 + 0.1;
            }
            update() {
                this.x += this.speedX;
                this.y += this.speedY;
                this.life -= 0.2;
                if (this.life <= 0) this.reset();
            }
            draw() {
                ctx.beginPath();
                ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
                ctx.fillStyle = `rgba(212, 175, 55, ${Math.max(0, this.opacity * (this.life / 200))})`;
                ctx.fill();
            }
        }
        for (let i = 0; i < 60; i++) particles.push(new Particle());
        const animate = () => {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            particles.forEach(p => { p.update(); p.draw(); });
            animationFrameId = requestAnimationFrame(animate);
        };
        animate();
        return () => { cancelAnimationFrame(animationFrameId); window.removeEventListener('resize', resize); };
    }, []);
    return <canvas ref={canvasRef} className="fixed inset-0 pointer-events-none z-0 opacity-40" />;
};

const SidebarLink = ({ to, icon: Icon, label, onClick, isCollapsed }) => {
    const location = useLocation();
    // Exact match for dashboard routes, startsWith for others
    const isDashboard = to === '/admin' || to.startsWith('/student') || to === '/teacher';
    const isActive = isDashboard && to.startsWith('/student') 
        ? location.pathname === '/student' && (location.search === to.replace('/student', '') || (!location.search && to === '/student?tab=profile'))
        : isDashboard
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
                    ? (document.body.classList.contains('super-admin-active') ? "bg-amber-600 text-white shadow-lg shadow-amber-900/40" : "bg-brand-blue text-white shadow-lg shadow-blue-500/30")
                    : (document.body.classList.contains('super-admin-active') ? "text-amber-500/60 hover:bg-amber-500/10 hover:text-amber-500" : "text-slate-600 hover:bg-slate-100 hover:text-brand-blue")
            )}
            title={isCollapsed ? label : ""}
        >
            <Icon size={20} className={clsx("relative z-10 flex-shrink-0", isActive ? "text-white" : "text-slate-500 group-hover:text-brand-blue")} />
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
                    className="absolute inset-0 bg-brand-blue z-0"
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

    // Theme state
    const [isDarkMode, setIsDarkMode] = useState(() => {
        return document.documentElement.classList.contains('dark') || 
               localStorage.getItem('theme') === 'dark';
    });

    useEffect(() => {
        if (isDarkMode) {
            document.documentElement.classList.add('dark');
            localStorage.setItem('theme', 'dark');
        } else {
            document.documentElement.classList.remove('dark');
            localStorage.setItem('theme', 'light');
        }
    }, [isDarkMode]);

    const isSuperAdmin = userData?.isSuperAdmin;

    // Global Golden Theme Injector
    useEffect(() => {
        if (isSuperAdmin) {
            document.body.classList.add('super-admin-active');
            document.body.style.backgroundColor = '#050505';
        } else {
            document.body.classList.remove('super-admin-active');
            document.body.style.backgroundColor = '';
        }
        return () => {
            document.body.classList.remove('super-admin-active');
            document.body.style.backgroundColor = '';
        };
    }, [isSuperAdmin]);

    const toggleTheme = () => setIsDarkMode(!isDarkMode);

    const isTeacherLayout = userData?.role === 'teacher'; // HOD gets full sidebar now

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
            case 'hod':
                return (
                    <>
                        <SidebarLink to="/teacher" icon={Home} label="Dashboard" {...commonProps} />
                        <SidebarLink to="/teacher/attendance" icon={ClipboardCheck} label="Attendance" {...commonProps} />
                        <SidebarLink to="/admin/students" icon={GraduationCap} label="Students" {...commonProps} />
                        <SidebarLink to="/admin/teachers" icon={Users} label="Teachers" {...commonProps} />
                        <SidebarLink to="/admin/events" icon={FileText} label="Events" {...commonProps} />
                    </>
                );
            case 'teacher':
                return (
                    <>
                        <SidebarLink to="/teacher" icon={Home} label="Dashboard" {...commonProps} />
                        <SidebarLink to="/teacher/attendance" icon={ClipboardCheck} label="Attendance" {...commonProps} />
                    </>
                );

            case 'student':
                return (
                    <>
                        <SidebarLink to="/student?tab=profile" icon={User} label="Profile" {...commonProps} />
                        <SidebarLink to="/student?tab=academic" icon={BookOpen} label="Academic" {...commonProps} />
                        <SidebarLink to="/student?tab=fees" icon={CreditCard} label="Fees" {...commonProps} />
                        <SidebarLink to="/student?tab=share" icon={Share2} label="Share ID" {...commonProps} />
                    </>
                );
            default:
                return null;
        }
    };



    // const isSuperAdmin = userData?.isSuperAdmin; // Removed duplicate declaration

    const goldenStyles = `
        .golden-theme {
            background: radial-gradient(circle at 50% 0%, #1a1505 0%, #050505 100%) !important;
            min-height: 100vh;
            color: #f3e5ab !important;
        }
        .golden-theme .card-bg, .golden-theme aside {
            background: rgba(25, 22, 12, 0.7) !important;
            border-color: rgba(212, 175, 55, 0.2) !important;
            box-shadow: 0 8px 32px rgba(0, 0, 0, 0.5), 0 0 20px rgba(212, 175, 55, 0.05) !important;
            backdrop-filter: blur(20px) saturate(180%);
            -webkit-backdrop-filter: blur(20px) saturate(180%);
        }
        .golden-theme header {
            background: rgba(25, 22, 12, 0.4) !important;
            border-bottom: 1px solid rgba(212, 175, 55, 0.2) !important;
            backdrop-filter: blur(20px);
        }
        .golden-theme h1:not(.no-gold, .no-gold *), 
        .golden-theme h2:not(.no-gold, .no-gold *), 
        .golden-theme h3:not(.no-gold, .no-gold *) {
            background: linear-gradient(135deg, #fff5d1 0%, #d4af37 50%, #b08d20 100%);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            filter: drop-shadow(0 2px 4px rgba(0,0,0,0.3));
        }
        .golden-theme .text-slate-800:not(.no-gold, .no-gold *), 
        .golden-theme .text-slate-700:not(.no-gold, .no-gold *), 
        .golden-theme .text-slate-900:not(.no-gold, .no-gold *) {
            color: #f3e5ab !important;
        }
        .golden-theme .text-slate-500:not(.no-gold, .no-gold *), 
        .golden-theme .text-slate-400:not(.no-gold, .no-gold *) {
            color: #d4af37 !important;
            opacity: 0.8;
        }
        .golden-theme .bg-slate-50:not(.no-gold, .no-gold *),
        .golden-theme .bg-slate-100:not(.no-gold, .no-gold *),
        .golden-theme .bg-slate-200:not(.no-gold, .no-gold *),
        .golden-theme .bg-red-50:not(.no-gold, .no-gold *),
        .golden-theme .bg-emerald-50:not(.no-gold, .no-gold *),
        .golden-theme .bg-blue-50:not(.no-gold, .no-gold *),
        .golden-theme .bg-white:not(.no-gold, .no-gold *) {
            background: rgba(25, 22, 12, 0.7) !important;
            backdrop-filter: blur(20px);
            border-color: rgba(212, 175, 55, 0.2) !important;
        }
        .golden-theme .shadow-xl, .golden-theme .shadow-2xl, .golden-theme .shadow-sm, .golden-theme .shadow {
            box-shadow: 0 10px 40px rgba(0, 0, 0, 0.6) !important;
        }
        .golden-theme .border-slate-200, .golden-theme .border-slate-100, .golden-theme .border-slate-300, .golden-theme .border-slate-50 {
            border-color: rgba(212, 175, 55, 0.15) !important;
        }
        .golden-theme table thead th {
            background: rgba(212, 175, 55, 0.15) !important;
            color: #d4af37 !important;
            border-bottom: 1px solid rgba(212, 175, 55, 0.2) !important;
        }
        .golden-theme table tbody tr {
            border-bottom: 1px solid rgba(212, 175, 55, 0.05) !important;
        }
        .golden-theme table tbody tr:hover {
            background: rgba(212, 175, 55, 0.08) !important;
        }
        .golden-theme input, .golden-theme select, .golden-theme textarea {
            background: rgba(0, 0, 0, 0.3) !important;
            border-color: rgba(212, 175, 55, 0.3) !important;
            color: #fff !important;
        }
        .golden-theme input:focus, .golden-theme select:focus {
            border-color: #d4af37 !important;
            box-shadow: 0 0 10px rgba(212, 175, 55, 0.2) !important;
        }
        .golden-theme .bg-brand-blue, 
        .golden-theme .from-brand-blue,
        .golden-theme .to-brand-blue,
        .golden-theme button.bg-brand-blue {
            background: linear-gradient(135deg, #fff5d1 0%, #d4af37 50%, #b08d20 100%) !important;
            color: #1a1505 !important;
            font-weight: 700 !important;
            border: none !important;
        }
        .golden-theme button.bg-white,
        .golden-theme .bg-white button:not(.no-gold, .no-gold *) {
            background: rgba(212, 175, 55, 0.1) !important;
            color: #f3e5ab !important;
            border: 1px solid rgba(212, 175, 55, 0.3) !important;
        }
        .golden-theme .text-brand-blue {
            color: #f3e5ab !important;
        }
        .golden-theme .border-brand-blue {
            border-color: rgba(212, 175, 55, 0.5) !important;
        }
        .golden-theme .bg-brand-blue\/10 {
            background: rgba(212, 175, 55, 0.15) !important;
        }
        .golden-theme .hover\:bg-slate-50:hover {
            background: rgba(212, 175, 55, 0.08) !important;
        }
        .golden-theme .bg-slate-100 {
            background: rgba(0, 0, 0, 0.3) !important;
        }
        .golden-theme .border-slate-100 {
            border-color: rgba(212, 175, 55, 0.1) !important;
        }
        .golden-glow {
            box-shadow: 0 0 25px rgba(212, 175, 55, 0.35);
            border: 1px solid rgba(255, 255, 255, 0.1);
        }
        .premium-hover {
            transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
        }
        .premium-hover:hover {
            transform: translateY(-5px) scale(1.02);
            box-shadow: 0 15px 40px rgba(0,0,0,0.4), 0 0 25px rgba(212, 175, 55, 0.2);
        }
        .golden-theme ::-webkit-scrollbar-track {
            background: rgba(0, 0, 0, 0.3);
        }
        .golden-theme ::-webkit-scrollbar-thumb {
            background: rgba(212, 175, 55, 0.2);
            border-radius: 10px;
        }
        .golden-theme ::-webkit-scrollbar-thumb:hover {
            background: rgba(212, 175, 55, 0.4);
        }
    `;

    return (
        <div className={clsx(
            "flex min-h-screen transition-colors duration-500 overflow-hidden",
            isSuperAdmin ? "golden-theme" : "bg-[#020617] text-slate-200"
        )}>
            {isSuperAdmin && (
                <>
                    <style>{goldenStyles}</style>
                    <GoldenDust />
                </>
            )}
            {!isTeacherLayout && (
                <motion.aside
                    initial={false}
                    animate={{ width: isSidebarCollapsed ? 80 : 280 }}
                    className={clsx(
                        "relative z-20 flex flex-col border-r transition-all duration-300 shadow-xl",
                        isSuperAdmin ? "border-amber-500/20" : "bg-black/40 backdrop-blur-md border-white/10"
                    )}
                >
                    <div className="flex flex-col h-full">
                        {/* Sidebar Header */}
                        <div className="h-16 flex items-center px-4 mb-6 border-b border-slate-100 dark:border-white/5">
                            <div className="flex items-center gap-3 overflow-hidden">
                                <div className="p-1 bg-white dark:bg-[#1a1a1a] rounded-xl shadow-md border border-slate-100 dark:border-white/10 flex-shrink-0">
                                    <img src="/ksk-logo.jpg" alt="Logo" className="w-8 h-8 object-contain rounded-lg" />
                                </div>
                                {!isSidebarCollapsed && (
                                    <motion.div
                                        initial={{ opacity: 0, x: -10 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        className="whitespace-nowrap"
                                    >
                                        <h2 className="font-bold text-slate-900 dark:text-white leading-tight">KSK College</h2>
                                        <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Management</p>
                                    </motion.div>
                                )}
                            </div>
                        </div>

                        {/* Navigation Links */}
                        <div className="flex-1 px-3 space-y-1 overflow-y-auto scrollbar-hide">
                            {renderLinks()}
                        </div>

                        {/* Sidebar Footer */}
                        <div className="p-3 border-t border-slate-100 dark:border-white/5 space-y-2">
                            <AnimatePresence mode="wait">
                                {!isSidebarCollapsed ? (
                                    <motion.div
                                        key="footer-full"
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: 10 }}
                                        className="bg-slate-50 dark:bg-[#171717] rounded-2xl p-4 mb-4"
                                    >
                                        <p className="text-[10px] text-slate-400 uppercase tracking-widest font-bold mb-1">Powered By</p>
                                        <div className="flex items-center justify-center gap-1.5">
                                            <span className={clsx("w-2 h-2 rounded-full", isSuperAdmin ? "bg-amber-500" : "bg-brand-blue")}></span>
                                            <p className={clsx("text-xs font-bold", isSuperAdmin ? "text-amber-500/80" : "text-slate-700 dark:text-slate-300")}>CJ Productions</p>
                                        </div>
                                    </motion.div>
                                ) : (
                                    <motion.div
                                        key="footer-collapsed"
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        exit={{ opacity: 0 }}
                                        className="mb-4 flex justify-center"
                                    >
                                        <span className="w-2 h-2 rounded-full bg-brand-blue" title="Powered by CJ Productions"></span>
                                    </motion.div>
                                )}
                            </AnimatePresence>

                            <button
                                onClick={toggleTheme}
                                className={clsx(
                                    "flex items-center gap-3 py-3 rounded-xl text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-[#171717] hover:text-brand-blue dark:hover:text-brand-blue transition-colors w-full group overflow-hidden mb-2",
                                    isSidebarCollapsed ? "justify-center px-0" : "px-4"
                                )}
                                title={isSidebarCollapsed ? (isDarkMode ? "Light Mode" : "Dark Mode") : ""}
                            >
                                {isDarkMode ? (
                                    <Sun size={20} className="flex-shrink-0 group-hover:text-amber-500 transition-colors text-slate-500" />
                                ) : (
                                    <Moon size={20} className="flex-shrink-0 group-hover:text-brand-blue transition-colors text-slate-500" />
                                )}
                                <AnimatePresence>
                                    {!isSidebarCollapsed && (
                                        <motion.span
                                            initial={{ opacity: 0, width: 0 }}
                                            animate={{ opacity: 1, width: "auto" }}
                                            exit={{ opacity: 0, width: 0 }}
                                            className="font-medium whitespace-nowrap"
                                        >
                                            {isDarkMode ? "Light Mode" : "Dark Mode"}
                                        </motion.span>
                                    )}
                                </AnimatePresence>
                            </button>

                            <button
                                onClick={logout}
                                className={clsx(
                                    "flex items-center gap-3 py-3 rounded-xl text-slate-600 dark:text-slate-400 hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-600 dark:hover:text-red-400 transition-colors w-full group overflow-hidden",
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
            <div className="flex-1 flex flex-col min-w-0 overflow-hidden relative z-10">
                <header className={clsx(
                    "h-16 border-b backdrop-blur-md flex items-center justify-between px-6 lg:px-8 sticky top-0 z-40 transition-colors duration-300",
                    isSuperAdmin 
                        ? "border-amber-500/20 bg-black/40" 
                        : "border-white/10 bg-black/20 backdrop-blur-xl"
                )}>
                    {isTeacherLayout ? (
                        <div className="flex items-center gap-3">
                            <img src="/ksk-logo.jpg" alt="College Logo" className="w-10 h-10 object-contain rounded-md" />
                            <div>
                                <h1 className="font-bold text-slate-900 leading-tight">KSK College</h1>
                                <p className="text-[10px] text-slate-500">MANAGEMENT</p>
                            </div>
                        </div>
                    ) : (
                        <button onClick={toggleMenu} className="lg:hidden p-2 text-slate-600 dark:text-slate-400 rounded-lg hover:bg-slate-100 dark:hover:bg-[#171717]">
                            <Menu size={24} />
                        </button>
                    )}

                    <div className="ml-auto flex items-center gap-4">
                        {isTeacherLayout && (
                            <button
                                onClick={logout}
                                className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-slate-600 dark:text-slate-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors mr-2"
                            >
                                <LogOut size={18} />
                                <span className="hidden sm:inline">Logout</span>
                            </button>
                        )}
                        <div className="text-right hidden sm:block">
                            <p className={clsx("text-sm font-bold truncate max-w-[150px]", isSuperAdmin ? "text-amber-500" : "text-slate-900 dark:text-white")}>
                                {userData?.name || userData?.email || "User Profile"}
                            </p>
                            <p className={clsx("text-[10px] font-bold uppercase tracking-widest", isSuperAdmin ? "text-amber-500/60" : "text-slate-500")}>
                                {isSuperAdmin ? "Super Admin" : (userData?.role || 'Guest')}
                            </p>
                        </div>
                        <div className={clsx(
                            "w-10 h-10 rounded-full border-2 shadow-lg overflow-hidden flex-shrink-0 group cursor-pointer ring-2 transition-all",
                            isSuperAdmin ? "border-amber-500/50 bg-black/40 ring-amber-500/20 hover:ring-amber-500/40" : "border-white dark:border-white/20 bg-slate-100 ring-transparent hover:ring-brand-blue/30"
                        )}>
                            {userData?.photoUrl ? (
                                <img src={userData.photoUrl} alt="Profile" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                            ) : (
                                <div className={clsx(
                                    "w-full h-full flex items-center justify-center text-sm font-black",
                                    isSuperAdmin ? "bg-gradient-to-br from-amber-600 to-amber-900 text-white" : "bg-gradient-to-br from-brand-blue to-indigo-600 text-white"
                                )}>
                                    {(userData?.name || '?')[0].toUpperCase()}
                                </div>
                            )}
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
