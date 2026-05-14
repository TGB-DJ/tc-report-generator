import { useState, useEffect, useMemo, useRef } from 'react';
import clsx from 'clsx';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import Card from '../../components/ui/Card';
import { useAuth } from '../../context/AuthContext';
import { doc, updateDoc } from 'firebase/firestore';
import { Users, GraduationCap, DollarSign, TrendingUp, Filter, X, ChevronDown, Sparkles, Pencil, UserCircle, CreditCard, Download, FileText, CheckCircle2 } from 'lucide-react';
import { DEPARTMENT_CATEGORIES } from '../../constants/departments';
import { motion, AnimatePresence } from 'framer-motion';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Select from '../../components/Select';
import { RELIGIONS, COMMUNITIES } from '../../constants/studentData';
import ModernDatePicker from '../../components/ui/ModernDatePicker';

// ── Avatar helper ──────────────────────────────────────────
const Avatar = ({ student, size = 8, isGold = false }) => {
    const ringCls = isGold ? 'ring-yellow-400' : 'ring-white';
    const cls = `w-${size} h-${size} rounded-full object-cover ring-2 ${ringCls} shadow`;
    if (student?.photoUrl) return <img src={student.photoUrl} alt={student.name} className={cls} />;
    const initials = (student?.name || '?').split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
    const colors = isGold ? ['bg-yellow-600', 'bg-amber-600'] : ['bg-blue-500', 'bg-purple-500', 'bg-pink-500', 'bg-indigo-500', 'bg-emerald-500'];
    const color = colors[(student?.name?.charCodeAt(0) || 0) % colors.length];
    return (
        <div className={`w-${size} h-${size} rounded-full ${color} flex items-center justify-center text-white font-bold text-xs ring-2 ${ringCls} shadow`}>
            {initials}
        </div>
    );
};

// ── Stat Card ──────────────────────────────────────────────
const StatCard = ({ title, value, icon: Icon, color, className = "" }) => {
    const { userData } = useAuth();
    const isSuperAdmin = userData?.isSuperAdmin;
    return (
        <Card className={clsx("flex items-center gap-4 transition-all", className || 'hover:shadow-lg hover:-translate-y-0.5')}>
            <div className={clsx(
                "p-3 rounded-xl text-white shadow-md flex-shrink-0",
                isSuperAdmin ? "bg-gradient-to-br from-amber-400 to-amber-700" : color
            )}><Icon size={24} /></div>
            <div className="min-w-0">
                <p className={clsx("text-[10px] font-bold uppercase tracking-widest truncate", isSuperAdmin ? "text-amber-500/60" : "text-slate-500")}>{title}</p>
                <h3 className={clsx("text-xl font-black truncate", isSuperAdmin ? "text-amber-500" : "text-slate-800")}>{value}</h3>
            </div>
        </Card>
    );
};

// ── Donut Chart ────────────────────────────────────────────
const DonutChart = ({ boys, girls }) => {
    const { userData } = useAuth();
    const isSuperAdmin = userData?.isSuperAdmin;
    const total = boys + girls;
    const circ = 2 * Math.PI * 60;
    const boysArc = total > 0 ? (boys / total) * circ : 0;
    const girlsArc = total > 0 ? (girls / total) * circ : 0;
    return (
        <div className="flex items-center justify-center gap-8 py-2">
            <div className="relative">
                <svg width="150" height="150" viewBox="0 0 160 160">
                    <circle cx="80" cy="80" r="60" fill="none" stroke={isSuperAdmin ? "rgba(212,175,55,0.1)" : "#e2e8f0"} strokeWidth="22" />
                    <circle cx="80" cy="80" r="60" fill="none" stroke={isSuperAdmin ? "#f59e0b" : "#3b82f6"} strokeWidth="22"
                        strokeDasharray={`${boysArc} ${circ}`} strokeDashoffset="0"
                        transform="rotate(-90 80 80)" className="transition-all duration-700" />
                    <circle cx="80" cy="80" r="60" fill="none" stroke={isSuperAdmin ? "#d97706" : "#ec4899"} strokeWidth="22"
                        strokeDasharray={`${girlsArc} ${circ}`} strokeDashoffset={`${-boysArc}`}
                        transform="rotate(-90 80 80)" className="transition-all duration-700" />
                    <text x="80" y="76" textAnchor="middle" fontSize="22" fontWeight="bold" fill={isSuperAdmin ? "#f3e5ab" : "#f8fafc"}>{total}</text>
                    <text x="80" y="96" textAnchor="middle" fontSize="11" fill={isSuperAdmin ? "#d4af37" : "#94a3b8"}>Students</text>
                </svg>
            </div>
            <div className="space-y-3">
                <div className="flex items-center gap-3">
                    <div className={clsx("w-3 h-3 rounded-full", isSuperAdmin ? "bg-amber-500" : "bg-blue-500")} />
                    <span className="text-sm text-slate-600">Boys</span>
                    <span className="font-bold text-slate-800 ml-2">{boys}</span>
                </div>
                <div className="flex items-center gap-3">
                    <div className={clsx("w-3 h-3 rounded-full", isSuperAdmin ? "bg-amber-600" : "bg-pink-500")} />
                    <span className="text-sm text-slate-600">Girls</span>
                    <span className="font-bold text-slate-800 ml-2">{girls}</span>
                </div>
            </div>
        </div>
    );
};

// Removed local DatePicker component as it's replaced by ModernDatePicker

// ── Filter Panel ───────────────────────────────────────────
const FilterPanel = ({ selectedDept, setSelectedDept, selectedClass, setSelectedClass, onReset, align = 'right' }) => {
    const { userData } = useAuth();
    const isSuperAdmin = userData?.isSuperAdmin;
    return (
        <motion.div
            initial={{ opacity: 0, y: -12, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -12, scale: 0.97 }}
            transition={{ type: 'spring', stiffness: 300, damping: 28 }}
            className={clsx(
                "absolute top-12 z-50 w-80 rounded-2xl shadow-2xl p-5 border",
                align === 'right' ? 'right-0' : 'left-0',
                isSuperAdmin ? "card-bg border-amber-500/20" : "bg-white border-slate-100"
            )}
        >
            <div className="flex justify-between items-center mb-4">
                <span className={clsx("font-semibold text-sm", isSuperAdmin ? "text-amber-500" : "text-slate-800")}>Filter Options</span>
                <button onClick={onReset} className={clsx("text-xs font-medium hover:underline", isSuperAdmin ? "text-amber-400" : "text-blue-600")}>Reset</button>
            </div>
            <div className="space-y-4">
                <Select
                    label="Department"
                    value={selectedDept}
                    onChange={e => setSelectedDept(e.target.value)}
                    options={Object.entries(DEPARTMENT_CATEGORIES).flatMap(([cat, depts]) => 
                        depts.map(d => ({ label: `${cat} - ${d}`, value: d }))
                    )}
                />
                <Select
                    label="Year / Class"
                    value={selectedClass}
                    onChange={e => setSelectedClass(e.target.value)}
                    options={['1st Year', '2nd Year', '3rd Year'].map(y => ({ label: y, value: y }))}
                />
            </div>
        </motion.div>
    );
};

// ── Main Dashboard ─────────────────────────────────────────
const AdminDashboard = () => {
    const { userData, user } = useAuth();
    const isSuperAdmin = userData?.isSuperAdmin;

    
    // Super Admin Edit States
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isIdModalOpen, setIsIdModalOpen] = useState(false);
    const [editData, setEditData] = useState({ ...userData });
    const [saveLoading, setSaveLoading] = useState(false);
    const idCardRef = useRef(null);

    const [teachersCount, setTeachersCount] = useState(0);
    const [students, setStudents] = useState([]);
    const [attendanceRecords, setAttendanceRecords] = useState([]);
    const [loading, setLoading] = useState(true);

    // Sync EditData with UserData
    useEffect(() => {
        if (userData && !saveLoading) {
            setEditData({ ...userData });
        }
    }, [userData]);
    // Global Filters
    const [selectedDept, setSelectedDept] = useState('');
    const [selectedClass, setSelectedClass] = useState('');
    const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
    const [showGlobalFilter, setShowGlobalFilter] = useState(false);
    const globalFilterRef = useRef(null);

    // Gender Section Local Filters
    const [genderLocalDept, setGenderLocalDept] = useState('');
    const [genderLocalClass, setGenderLocalClass] = useState('');
    const [showGenderFilter, setShowGenderFilter] = useState(false);
    const [genderFilter, setGenderFilter] = useState('both');
    const genderFilterRef = useRef(null);

    // Attendance Section Local Filters
    const [attLocalDept, setAttLocalDept] = useState('');
    const [attLocalClass, setAttLocalClass] = useState('');
    const [showAttFilter, setShowAttFilter] = useState(false);
    const [attGenderFilter, setAttGenderFilter] = useState('both');
    const attFilterRef = useRef(null);

    // Separate Click Outside Handlers
    useEffect(() => {
        const handleClickOutside = (e) => {
            if (globalFilterRef.current && !globalFilterRef.current.contains(e.target)) setShowGlobalFilter(false);
            if (genderFilterRef.current && !genderFilterRef.current.contains(e.target)) setShowGenderFilter(false);
            if (attFilterRef.current && !attFilterRef.current.contains(e.target)) setShowAttFilter(false);
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                const [studSnap, teachSnap] = await Promise.all([
                    getDocs(collection(db, 'students')),
                    getDocs(collection(db, 'teachers'))
                ]);
                setTeachersCount(teachSnap.size);
                setStudents(studSnap.docs.map(d => ({ id: d.id, ...d.data() })));
            } catch (e) { console.error(e); }
            finally { setLoading(false); }
        };
        fetchData();
    }, []);

    useEffect(() => {
        const fetchAtt = async () => {
            try {
                const q = query(collection(db, 'attendance'), where('date', '==', selectedDate));
                const snap = await getDocs(q);
                setAttendanceRecords(snap.docs.map(d => d.data()));
            } catch (e) { console.error(e); }
        };
        fetchAtt();
    }, [selectedDate]);

    const activeStudents = useMemo(() =>
        students.filter(s => s.status !== 'alumni' && s.class !== 'Alumni'),
        [students]);

    const globalFilteredStudents = useMemo(() => {
        let r = activeStudents;
        if (selectedDept) r = r.filter(s => s.dept === selectedDept);
        if (selectedClass) r = r.filter(s => s.class === selectedClass);
        return r;
    }, [activeStudents, selectedDept, selectedClass]);

    const stats = useMemo(() => {
        let totalFees = 0, collectedFees = 0;
        globalFilteredStudents.forEach(s => { 
            totalFees += Number(s.fees?.total || 0); 
            collectedFees += Number(s.fees?.paid || 0); 
        });
        return { 
            students: globalFilteredStudents.length, 
            teachers: teachersCount, 
            collectedFees, 
            pendingFees: totalFees - collectedFees 
        };
    }, [globalFilteredStudents, teachersCount]);

    // Gender distribution - uses (Global Filters + Local Filters)
    const genderData = useMemo(() => {
        let r = activeStudents;
        // Apply Global
        if (selectedDept) r = r.filter(s => s.dept === selectedDept);
        if (selectedClass) r = r.filter(s => s.class === selectedClass);
        // Apply Local
        if (genderLocalDept) r = r.filter(s => s.dept === genderLocalDept);
        if (genderLocalClass) r = r.filter(s => s.class === genderLocalClass);

        const boys = r.filter(s => s.gender?.toLowerCase() === 'male').length;
        const girls = r.filter(s => s.gender?.toLowerCase() === 'female').length;

        const deptMap = {};
        r.forEach(s => {
            const dept = s.dept || 'Unknown';
            if (!deptMap[dept]) deptMap[dept] = { boys: 0, girls: 0 };
            if (s.gender?.toLowerCase() === 'male') deptMap[dept].boys++;
            else if (s.gender?.toLowerCase() === 'female') deptMap[dept].girls++;
        });

        let deptRows = Object.entries(deptMap).map(([dept, c]) => ({ dept, boys: c.boys, girls: c.girls, total: c.boys + c.girls }))
            .sort((a, b) => b.total - a.total);

        if (genderFilter === 'boys') deptRows = deptRows.filter(r => r.boys > 0);
        if (genderFilter === 'girls') deptRows = deptRows.filter(r => r.girls > 0);

        return { boys, girls, deptRows };
    }, [activeStudents, selectedDept, selectedClass, genderLocalDept, genderLocalClass, genderFilter]);

    // Attendance metrics - uses (Global Filters + Local Filters)
    const attMetrics = useMemo(() => {
        let baseStudents = activeStudents;
        // Apply Global
        if (selectedDept) baseStudents = baseStudents.filter(s => s.dept === selectedDept);
        if (selectedClass) baseStudents = baseStudents.filter(s => s.class === selectedClass);
        // Apply Local
        if (attLocalDept) baseStudents = baseStudents.filter(s => s.dept === attLocalDept);
        if (attLocalClass) baseStudents = baseStudents.filter(s => s.class === attLocalClass);

        const deptAtt = {};
        baseStudents.forEach(s => {
            const dept = s.dept || 'Unknown';
            if (!deptAtt[dept]) deptAtt[dept] = { totalBoys: 0, totalGirls: 0, presentBoys: 0, presentGirls: 0 };
            if (s.gender?.toLowerCase() === 'male') deptAtt[dept].totalBoys++;
            else if (s.gender?.toLowerCase() === 'female') deptAtt[dept].totalGirls++;
        });

        attendanceRecords.forEach(record => {
            // Must match filters
            if (selectedDept && record.dept !== selectedDept) return;
            if (attLocalDept && record.dept !== attLocalDept) return;
            
            const dept = record.dept || 'Unknown';
            if (!deptAtt[dept]) return;
            Object.entries(record.records || {}).forEach(([sid, status]) => {
                const stu = baseStudents.find(s => s.id === sid);
                if (!stu || status !== 'Present') return;
                if (stu.gender?.toLowerCase() === 'male') deptAtt[dept].presentBoys++;
                else if (stu.gender?.toLowerCase() === 'female') deptAtt[dept].presentGirls++;
            });
        });

        return Object.entries(deptAtt).map(([dept, c]) => {
            const totalBoys = c.totalBoys, totalGirls = c.totalGirls;
            const presentBoys = c.presentBoys, presentGirls = c.presentGirls;
            const total = totalBoys + totalGirls;
            const present = presentBoys + presentGirls;
            const absent = total - present;
            return { dept, total, present, absent, totalBoys, totalGirls, presentBoys, presentGirls };
        }).sort((a, b) => b.total - a.total);
    }, [activeStudents, attendanceRecords, selectedDept, selectedClass, attLocalDept, attLocalClass]);

    const isFiltered = selectedDept || selectedClass;

    if (loading) return (
        <div className="flex items-center justify-center h-64">
            <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
        </div>
    );

    const handleProfileUpdate = async (e) => {
        e.preventDefault();
        if (!user?.uid) return;
        setSaveLoading(true);
        try {
            const userRef = doc(db, "users", user.uid);
            const adminRef = doc(db, "admins", user.uid);
            
            await updateDoc(userRef, editData);
            await updateDoc(adminRef, editData);
            
            alert("Profile updated successfully! Refreshing data...");
            window.location.reload();
        } catch (error) {
            console.error("Update error:", error);
            alert("Failed to update profile: " + error.message);
        } finally {
            setSaveLoading(false);
        }
    };

    const TabBtn = ({ id, label, active, onClick }) => (
        <button 
            onClick={() => onClick(id)} 
            className={clsx(
                "px-4 py-1.5 rounded-full text-xs font-semibold transition-all",
                active === id 
                    ? (isSuperAdmin ? "bg-amber-600 text-white shadow-lg shadow-amber-900/50" : "bg-blue-600 text-white shadow") 
                    : (isSuperAdmin ? "text-amber-500/60 hover:bg-amber-500/10" : "text-slate-500 hover:bg-slate-100")
            )}
        >
            {label}
        </button>
    );

    return (
        <div className="space-y-6 pb-12 transition-colors duration-1000">
            {isSuperAdmin && (
                <>
                    <motion.div 
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="flex items-center gap-3 mb-4 bg-gradient-to-r from-amber-600/20 to-transparent p-3 rounded-2xl border-l-4 border-amber-500 backdrop-blur-sm w-fit"
                    >
                        <div className="p-2 bg-amber-500 rounded-full animate-pulse shadow-[0_0_15px_rgba(245,158,11,0.5)]">
                            <Sparkles className="text-white" size={18} />
                        </div>
                        <div>
                            <span className="text-xs font-black uppercase tracking-[0.2em] text-amber-500 drop-shadow-sm">High Command Terminal</span>
                            <p className="text-[10px] text-amber-500/60 font-bold tracking-widest">SUPER ADMIN ACTIVE</p>
                        </div>
                    </motion.div>
                </>
            )}
            
            {/* Header */}
            <div className={`flex flex-col md:flex-row justify-between items-start md:items-center gap-4 p-8 rounded-3xl transition-all duration-500 ${isSuperAdmin ? 'card-bg border-amber-500/40 relative z-30' : 'bg-white border border-slate-100 shadow-sm relative z-30'}`}>
                {isSuperAdmin && <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/5 blur-[100px] rounded-full -mr-32 -mt-32" />}
                <div>
                    <h1 className={clsx("text-3xl font-bold", isSuperAdmin ? "text-amber-500" : "text-slate-800")}>Admin Dashboard</h1>
                    <p className={clsx("text-sm mt-1", isSuperAdmin ? "text-amber-500/60" : "text-slate-500")}>Overview of all college metrics</p>
                </div>
                <div className="flex flex-wrap items-center gap-3">
                    {isSuperAdmin && (
                        <div className="flex items-center gap-2 mr-2 border-r border-slate-200/20 pr-4">
                            <button 
                                onClick={() => setIsEditModalOpen(true)}
                                className="flex items-center gap-2 px-6 py-2.5 bg-amber-600 hover:bg-amber-500 text-white rounded-xl shadow-[0_0_20px_rgba(212,175,55,0.3)] transition-all text-sm font-bold border border-amber-400/30 hover:scale-105 active:scale-95"
                            >
                                <Pencil size={16} /> Edit My ID
                            </button>
                            <button 
                                onClick={() => setIsIdModalOpen(true)}
                                className="flex items-center gap-2 px-6 py-2.5 bg-slate-900/80 hover:bg-slate-900 text-white rounded-xl shadow-xl transition-all text-sm font-bold border border-amber-500/50 backdrop-blur-md hover:scale-105 active:scale-95"
                            >
                                <CreditCard size={16} className="text-amber-500" /> View My ID
                            </button>
                        </div>
                    )}
                    <ModernDatePicker value={selectedDate} onChange={e => setSelectedDate(e.target.value)} />
                    <div className="relative" ref={globalFilterRef}>
                        <button
                            onClick={() => setShowGlobalFilter(v => !v)}
                            className={clsx(
                                "flex items-center gap-2 px-4 py-2.5 rounded-xl border text-sm font-medium transition-all",
                                isSuperAdmin 
                                    ? "bg-black/40 border-amber-500/30 text-amber-500 hover:border-amber-400" 
                                    : (isFiltered ? 'bg-blue-600 text-white border-blue-600 shadow-lg shadow-blue-200' : 'bg-white text-slate-600 border-slate-200 hover:border-blue-400')
                            )}
                        >
                            <Filter size={16} />
                            Global Filter
                            {(isFiltered || (isSuperAdmin && (selectedDept || selectedClass))) && (
                                <span className={clsx("w-2 h-2 rounded-full ml-1", isSuperAdmin ? "bg-amber-400" : "bg-white")} />
                            )}
                        </button>
                        <AnimatePresence>
                            {showGlobalFilter && (
                                <FilterPanel
                                    selectedDept={selectedDept} setSelectedDept={setSelectedDept}
                                    selectedClass={selectedClass} setSelectedClass={setSelectedClass}
                                    onReset={() => { setSelectedDept(''); setSelectedClass(''); }}
                                />
                            )}
                        </AnimatePresence>
                    </div>
                </div>
            </div>

            {(isFiltered || genderLocalDept || genderLocalClass || attLocalDept || attLocalClass) && (
                <div className="flex flex-wrap items-center gap-2 text-sm">
                    <span className={clsx(isSuperAdmin ? "text-amber-500/50" : "text-slate-500")}>Active Filters:</span>
                    {selectedDept && <span className={clsx("px-3 py-1 rounded-full font-medium flex items-center gap-1", isSuperAdmin ? "bg-amber-500/10 text-amber-500" : "bg-blue-100 text-blue-700")}>Global: {selectedDept}<button onClick={() => setSelectedDept('')}><X size={12} /></button></span>}
                    {selectedClass && <span className={clsx("px-3 py-1 rounded-full font-medium flex items-center gap-1", isSuperAdmin ? "bg-amber-600/10 text-amber-600" : "bg-purple-100 text-purple-700")}>Global: {selectedClass}<button onClick={() => setSelectedClass('')}><X size={12} /></button></span>}
                    
                    {genderLocalDept && <span className="bg-amber-100 text-amber-700 px-3 py-1 rounded-full font-medium flex items-center gap-1">Gender: {genderLocalDept}<button onClick={() => setGenderLocalDept('')}><X size={12} /></button></span>}
                    {attLocalDept && <span className="bg-emerald-100 text-emerald-700 px-3 py-1 rounded-full font-medium flex items-center gap-1">Attendance: {attLocalDept}<button onClick={() => setAttLocalDept('')}><X size={12} /></button></span>}
                </div>
            )}

            {/* Stat Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 relative z-10">
                <StatCard 
                    title="Total Students" 
                    value={stats.students} 
                    icon={GraduationCap} 
                    color={isSuperAdmin ? "bg-gradient-to-br from-amber-600 to-amber-700" : "bg-blue-500"} 
                    className={isSuperAdmin ? "card-bg premium-hover golden-glow" : ""}
                />
                <StatCard 
                    title="Total Teachers" 
                    value={stats.teachers} 
                    icon={Users} 
                    color={isSuperAdmin ? "bg-gradient-to-br from-amber-600 to-amber-700" : "bg-purple-500"} 
                    className={isSuperAdmin ? "card-bg premium-hover golden-glow" : ""}
                />
                <StatCard 
                    title="Fees Collected" 
                    value={`₹${stats.collectedFees.toLocaleString()}`} 
                    icon={DollarSign} 
                    color={isSuperAdmin ? "bg-gradient-to-br from-amber-600 to-amber-700" : "bg-emerald-500"} 
                    className={isSuperAdmin ? "card-bg premium-hover golden-glow" : ""}
                />
                <StatCard 
                    title="Pending Fees" 
                    value={`₹${stats.pendingFees.toLocaleString()}`} 
                    icon={TrendingUp} 
                    color={isSuperAdmin ? "bg-gradient-to-br from-amber-600 to-amber-700" : "bg-rose-500"} 
                    className={isSuperAdmin ? "card-bg premium-hover golden-glow" : ""}
                />
            </div>

            {/* Student Directory */}
            <Card className={isSuperAdmin ? 'card-bg' : ''}>
                <div className="p-5">
                    <div className="flex flex-wrap justify-between items-center gap-3 mb-5">
                        <div className="flex items-center gap-3">
                            <h3 className={clsx("font-bold text-lg", isSuperAdmin ? "text-amber-500" : "text-slate-800")}>Gender Distribution</h3>
                            <div className="relative" ref={genderFilterRef}>
                                <button
                                    onClick={() => setShowGenderFilter(v => !v)}
                                    className={clsx(
                                        "p-1.5 rounded-lg transition-all",
                                        (genderLocalDept || genderLocalClass)
                                            ? (isSuperAdmin ? "bg-amber-500/20 text-amber-500 ring-1 ring-amber-500/30" : "bg-blue-100 text-blue-600 shadow-sm ring-1 ring-blue-200")
                                            : (isSuperAdmin ? "text-amber-500/40 hover:bg-amber-500/10 hover:text-amber-500" : "text-slate-400 hover:bg-slate-100 hover:text-slate-600")
                                    )}
                                    title="Local Filter: Gender Distribution"
                                >
                                    <Filter size={15} />
                                </button>
                                <AnimatePresence>
                                    {showGenderFilter && (
                                        <FilterPanel
                                            selectedDept={genderLocalDept} setSelectedDept={setGenderLocalDept}
                                            selectedClass={genderLocalClass} setSelectedClass={setGenderLocalClass}
                                            onReset={() => { setGenderLocalDept(''); setGenderLocalClass(''); }}
                                            align="left"
                                        />
                                    )}
                                </AnimatePresence>
                            </div>
                        </div>
                        <div className={clsx("flex items-center gap-1 rounded-full p-1", isSuperAdmin ? "bg-black/20" : "bg-slate-100")}>
                            <TabBtn id="both" label="All" active={genderFilter} onClick={setGenderFilter} />
                            <TabBtn id="boys" label="Boys" active={genderFilter} onClick={setGenderFilter} />
                            <TabBtn id="girls" label="Girls" active={genderFilter} onClick={setGenderFilter} />
                        </div>
                    </div>
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        <DonutChart boys={genderData.boys} girls={genderData.girls} />
                        <div className="lg:col-span-2 overflow-auto max-h-64">
                            <table className="w-full text-sm">
                                <thead className={clsx("sticky top-0", isSuperAdmin ? "bg-black/40" : "bg-white")}>
                                    <tr className={clsx("border-b", isSuperAdmin ? "border-amber-500/20" : "border-slate-100")}>
                                        <th className={clsx("py-2 px-3 text-left font-semibold", isSuperAdmin ? "text-amber-500/50" : "text-slate-500")}>Department</th>
                                        <th className={clsx("py-2 px-3 text-center font-semibold", isSuperAdmin ? "text-amber-400" : "text-blue-600")}>Boys</th>
                                        <th className={clsx("py-2 px-3 text-center font-semibold", isSuperAdmin ? "text-amber-600" : "text-pink-600")}>Girls</th>
                                        <th className={clsx("py-2 px-3 text-center font-semibold", isSuperAdmin ? "text-amber-500/70" : "text-slate-600")}>Total</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {genderData.deptRows.map((row, i) => (
                                        <tr key={i} className={clsx("border-b transition-colors", isSuperAdmin ? "border-amber-500/5 hover:bg-amber-500/5" : "border-slate-50 hover:bg-slate-50")}>
                                            <td className={clsx("py-2.5 px-3 font-medium truncate max-w-[200px]", isSuperAdmin ? "text-amber-500/80" : "text-slate-700")}>{row.dept}</td>
                                            <td className="py-2.5 px-3 text-center">
                                                <span className={clsx("font-bold px-2.5 py-0.5 rounded-full text-xs", isSuperAdmin ? "bg-amber-500/10 text-amber-500" : "bg-blue-50 text-blue-700")}>{row.boys}</span>
                                            </td>
                                            <td className="py-2.5 px-3 text-center">
                                                <span className={clsx("font-bold px-2.5 py-0.5 rounded-full text-xs", isSuperAdmin ? "bg-amber-600/10 text-amber-600" : "bg-pink-50 text-pink-700")}>{row.girls}</span>
                                            </td>
                                            <td className={clsx("py-2.5 px-3 text-center font-bold", isSuperAdmin ? "text-amber-500" : "text-slate-800")}>{row.total}</td>
                                        </tr>
                                    ))}
                                    {genderData.deptRows.length === 0 && (
                                        <tr><td colSpan="4" className="py-8 text-center text-slate-400">No data for selected filters</td></tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </Card>

            {/* Attendance */}
            <Card className={isSuperAdmin ? 'card-bg' : ''}>
                <div className="p-5">
                    <div className="flex flex-wrap justify-between items-center gap-3 mb-5">
                        <div className="flex items-center gap-3">
                            <div>
                                <h3 className={clsx("font-bold text-lg", isSuperAdmin ? "text-amber-500" : "text-slate-800")}>Daily Attendance</h3>
                                <p className={clsx("text-xs mt-0.5", isSuperAdmin ? "text-amber-500/40" : "text-slate-400")}>{selectedDate}</p>
                            </div>
                            <div className="relative" ref={attFilterRef}>
                                <button
                                    onClick={() => setShowAttFilter(v => !v)}
                                    className={clsx(
                                        "p-1.5 rounded-lg transition-all",
                                        (attLocalDept || attLocalClass)
                                            ? (isSuperAdmin ? "bg-amber-500/20 text-amber-500 ring-1 ring-amber-500/30" : "bg-blue-100 text-blue-600 shadow-sm ring-1 ring-blue-200")
                                            : (isSuperAdmin ? "text-amber-500/40 hover:bg-amber-500/10 hover:text-amber-500" : "text-slate-400 hover:bg-slate-100 hover:text-slate-600")
                                    )}
                                    title="Local Filter: Daily Attendance"
                                >
                                    <Filter size={15} />
                                </button>
                                <AnimatePresence>
                                    {showAttFilter && (
                                        <FilterPanel
                                            selectedDept={attLocalDept} setSelectedDept={setAttLocalDept}
                                            selectedClass={attLocalClass} setSelectedClass={setAttLocalClass}
                                            onReset={() => { setAttLocalDept(''); setAttLocalClass(''); }}
                                            align="left"
                                        />
                                    )}
                                </AnimatePresence>
                            </div>
                        </div>
                        <div className={clsx("flex items-center gap-1 rounded-full p-1", isSuperAdmin ? "bg-black/20" : "bg-slate-100")}>
                            <TabBtn id="both" label="All" active={attGenderFilter} onClick={setAttGenderFilter} />
                            <TabBtn id="boys" label="Boys" active={attGenderFilter} onClick={setAttGenderFilter} />
                            <TabBtn id="girls" label="Girls" active={attGenderFilter} onClick={setAttGenderFilter} />
                        </div>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead className={clsx("rounded-lg", isSuperAdmin ? "bg-black/40" : "bg-slate-50")}>
                                <tr className={clsx("border-b", isSuperAdmin ? "border-amber-500/20" : "border-slate-100")}>
                                    <th className={clsx("p-3 text-left font-semibold", isSuperAdmin ? "text-amber-500/50" : "text-slate-600")}>Department</th>
                                    <th className={clsx("p-3 text-center font-semibold", isSuperAdmin ? "text-amber-500/70" : "text-slate-600")}>Total</th>
                                    <th className={clsx("p-3 text-center font-semibold", isSuperAdmin ? "text-green-400" : "text-green-600")}>Present</th>
                                    <th className={clsx("p-3 text-center font-semibold", isSuperAdmin ? "text-amber-700" : "text-red-500")}>Absent</th>
                                    {attGenderFilter !== 'girls' && <th className={clsx("p-3 text-center font-semibold", isSuperAdmin ? "text-amber-400" : "text-blue-600")}>Boys Present</th>}
                                    {attGenderFilter !== 'boys' && <th className={clsx("p-3 text-center font-semibold", isSuperAdmin ? "text-amber-600" : "text-pink-600")}>Girls Present</th>}
                                    <th className={clsx("p-3 text-center font-semibold", isSuperAdmin ? "text-amber-500/70" : "text-slate-600")}>Rate</th>
                                </tr>
                            </thead>
                            <tbody>
                                {attMetrics.map((row, i) => {
                                    const displayTotal = attGenderFilter === 'boys' ? row.totalBoys : attGenderFilter === 'girls' ? row.totalGirls : row.total;
                                    const displayPresent = attGenderFilter === 'boys' ? row.presentBoys : attGenderFilter === 'girls' ? row.presentGirls : row.present;
                                    const displayAbsent = displayTotal - displayPresent;
                                    const pct = displayTotal > 0 ? Math.round((displayPresent / displayTotal) * 100) : 0;
                                    return (
                                        <tr key={i} className={clsx("border-b transition-colors", isSuperAdmin ? "border-amber-500/5 hover:bg-amber-500/5" : "border-slate-50 hover:bg-slate-50/60")}>
                                            <td className={clsx("p-3 font-medium max-w-[200px] truncate", isSuperAdmin ? "text-amber-500/80" : "text-slate-800")}>{row.dept}</td>
                                            <td className={clsx("p-3 text-center font-bold", isSuperAdmin ? "text-amber-500/90" : "text-slate-700")}>{displayTotal}</td>
                                            <td className="p-3 text-center"><span className={clsx("font-bold px-2.5 py-0.5 rounded-full text-xs", isSuperAdmin ? "bg-green-500/10 text-green-400" : "bg-green-50 text-green-700")}>{displayPresent}</span></td>
                                            <td className="p-3 text-center"><span className={clsx("font-bold px-2.5 py-0.5 rounded-full text-xs", isSuperAdmin ? "bg-amber-900/40 text-amber-700" : "bg-red-50 text-red-600")}>{displayAbsent}</span></td>
                                            {attGenderFilter !== 'girls' && <td className="p-3 text-center"><span className={clsx("font-bold px-2.5 py-0.5 rounded-full text-xs", isSuperAdmin ? "bg-amber-500/10 text-amber-500" : "bg-blue-50 text-blue-700")}>{row.presentBoys}</span></td>}
                                            {attGenderFilter !== 'boys' && <td className="p-3 text-center"><span className={clsx("font-bold px-2.5 py-0.5 rounded-full text-xs", isSuperAdmin ? "bg-amber-600/10 text-amber-600" : "bg-pink-50 text-pink-700")}>{row.presentGirls}</span></td>}
                                            <td className="p-3">
                                                <div className="flex items-center gap-2 min-w-[80px]">
                                                    <div className={clsx("flex-1 rounded-full h-2", isSuperAdmin ? "bg-black/40" : "bg-slate-100")}>
                                                        <div className={clsx("h-full rounded-full transition-all duration-500", pct >= 75 ? (isSuperAdmin ? "bg-green-500" : "bg-green-500") : (isSuperAdmin ? "bg-amber-700" : "bg-rose-500"))} style={{ width: `${pct}%` }} />
                                                    </div>
                                                    <span className={clsx("text-xs font-bold w-9 text-right", pct >= 75 ? (isSuperAdmin ? "text-green-400" : "text-green-600") : (isSuperAdmin ? "text-amber-700" : "text-rose-500"))}>{pct}%</span>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                                {attMetrics.length === 0 && (
                                    <tr><td colSpan="7" className="py-10 text-center text-slate-400">No attendance data for this date</td></tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </Card>

            {/* Super Admin Edit Modal */}
            <AnimatePresence>
                {isEditModalOpen && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md">
                        <motion.div 
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            className={clsx(
                                "rounded-3xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col",
                                isSuperAdmin ? "card-bg" : "bg-white"
                            )}
                        >
                            <div className="p-6 bg-gradient-to-r from-amber-500 to-yellow-600 text-white flex justify-between items-center">
                                <div className="flex items-center gap-3">
                                    <UserCircle size={24} />
                                    <h3 className="text-xl font-bold">Edit Super Admin Profile (ID Card)</h3>
                                </div>
                                <button onClick={() => setIsEditModalOpen(false)} className="hover:bg-white/20 p-2 rounded-full transition-colors"><X size={24} /></button>
                            </div>
                            
                            <form onSubmit={handleProfileUpdate} className="p-8 overflow-y-auto space-y-6">
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                    <Input label="Full Name" value={editData.name || ''} onChange={e => setEditData({...editData, name: e.target.value})} required />
                                    <Input label="Email" value={editData.email || ''} disabled className="opacity-70" />
                                    <Input label="Phone" value={editData.phone || ''} onChange={e => setEditData({...editData, phone: e.target.value})} />
                                    <Input label="Reg No / ID No" value={editData.regno || ''} onChange={e => setEditData({...editData, regno: e.target.value})} />
                                    <Input label="Department" value={editData.dept || ''} onChange={e => setEditData({...editData, dept: e.target.value})} />
                                    <Input label="Batch" value={editData.batch || ''} onChange={e => setEditData({...editData, batch: e.target.value})} />
                                    <Input label="DOB" type="date" value={editData.dob || ''} onChange={e => setEditData({...editData, dob: e.target.value})} />
                                    <Input label="Blood Group" value={editData.bloodGroup || ''} onChange={e => setEditData({...editData, bloodGroup: e.target.value})} />
                                    <div className="md:col-span-2">
                                        <Input label="Address" value={editData.address || ''} onChange={e => setEditData({...editData, address: e.target.value})} />
                                    </div>
                                    <div className="md:col-span-3">
                                        <Input label="Photo URL" value={editData.photoUrl || ''} onChange={e => setEditData({...editData, photoUrl: e.target.value})} placeholder="https://image-link.com/profile.jpg" />
                                    </div>
                                </div>
                                
                                <div className="flex justify-end gap-3 pt-6 border-t">
                                    <Button type="button" variant="ghost" onClick={() => setIsEditModalOpen(false)}>Cancel</Button>
                                    <Button type="submit" isLoading={saveLoading} className="bg-amber-600 hover:bg-amber-700">Save Changes</Button>
                                </div>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Super Admin ID Preview Modal */}
            <AnimatePresence>
                {isIdModalOpen && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
                        <motion.div 
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            className={clsx(
                                "rounded-3xl shadow-2xl p-8 max-w-sm w-full relative flex flex-col items-center",
                                isSuperAdmin ? "card-bg" : "bg-white"
                            )}
                        >
                            <button onClick={() => setIsIdModalOpen(false)} className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600"><X size={24} /></button>
                            <h3 className={clsx("text-xl font-bold mb-6 no-gold", isSuperAdmin ? "text-amber-500" : "text-slate-800")}>Your Professional ID</h3>
                            
                            {/* ID Card Copy-Paste from StudentDashboard with modifications */}
                            <div className="w-[340px] bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden relative mb-6">
                                <div className="bg-slate-900 p-4 flex items-center justify-center gap-3">
                                    <img src="/ksk-logo.jpg" alt="Logo" className="w-10 h-10 object-contain bg-white p-1 rounded-full" />
                                    <div className="text-white text-center">
                                        <h4 className="font-bold text-[11px] leading-tight uppercase tracking-tighter">Kanchi Shri Krishna College</h4>
                                        <p className="text-[8px] opacity-80 uppercase">Administration Department</p>
                                    </div>
                                </div>
                                <div className="p-6 bg-white relative no-gold">
                                    <div className="flex justify-between items-start mb-4">
                                        <div className="w-24 h-28 rounded-lg border-2 border-slate-100 bg-slate-50 overflow-hidden flex items-center justify-center">
                                            {userData?.photoUrl ? <img src={userData.photoUrl} alt="Profile" className="w-full h-full object-cover" /> : <UserCircle size={48} className="text-slate-300" />}
                                        </div>
                                        <div className="w-20 h-20 bg-white p-1 border rounded shadow-sm">
                                            <img src={`https://api.qrserver.com/v1/create-qr-code/?size=120x120&data=${encodeURIComponent(`${window.location.origin}/id/${userData?.regno || 'ADMIN'}`)}`} alt="QR" className="w-full h-full" />
                                        </div>
                                    </div>
                                    <h2 className="text-lg font-bold text-slate-900 uppercase truncate mb-1">{userData?.name}</h2>
                                    <div className="inline-block bg-amber-100 text-amber-800 text-[10px] font-bold px-2 py-0.5 rounded-full mb-4 border border-amber-200 uppercase tracking-wide">
                                        Super Administrator
                                    </div>
                                    <div className="space-y-1.5 text-xs text-slate-700">
                                        <div className="flex justify-between border-b border-slate-50 pb-1"><span>Employee ID</span><span className="font-bold text-slate-900">{userData?.regno || 'KSK-ADMIN-001'}</span></div>
                                        <div className="flex justify-between border-b border-slate-50 pb-1"><span>Department</span><span className="font-bold text-slate-900">{userData?.dept || 'Administration'}</span></div>
                                        <div className="flex justify-between border-b border-slate-50 pb-1"><span>Blood Group</span><span className="font-bold text-red-600">{userData?.bloodGroup || '-'}</span></div>
                                        <div className="flex justify-between border-b border-slate-50 pb-1"><span>Phone</span><span className="font-bold text-slate-900">{userData?.phone || '-'}</span></div>
                                    </div>
                                </div>
                                <div className="bg-slate-50 p-2 text-center text-[9px] font-bold text-slate-400 border-t uppercase">Kanchi Shri Krishna College of Arts & Science</div>
                            </div>
                            
                            <div className="flex gap-2 w-full">
                                <Button className="flex-1" onClick={() => window.print()}><Download size={16} className="mr-2" /> Print ID</Button>
                                <Button variant="outline" onClick={() => setIsEditModalOpen(true)}><Pencil size={16} /></Button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default AdminDashboard;
