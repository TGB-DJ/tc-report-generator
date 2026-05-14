import { useState, useEffect, useMemo } from 'react';
import { collection, query, where, getDocs, doc, getDoc } from 'firebase/firestore';
import { updateDoc } from 'firebase/firestore'; // Added updateDoc
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '../../lib/firebase';
import { useAuth } from '../../context/AuthContext';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button'; // Added
import Input from '../../components/ui/Input'; // Added
import Toast from '../../components/ui/Toast'; // Added
import Select from '../../components/Select';
import { Users, Filter, Pencil, X, Printer, Bell } from 'lucide-react'; // Added Pencil, X
import { AnimatePresence, motion } from 'framer-motion'; // Added
import BulkTCPrintModal from '../../components/BulkTCPrintModal';
import ModernDatePicker from '../../components/ui/ModernDatePicker';

const DonutChart = ({ boys, girls, title }) => {
    const total = boys + girls;
    const boysPercent = total > 0 ? (boys / total) * 100 : 0;
    const girlsPercent = total > 0 ? (girls / total) * 100 : 0;
    const circumference = 2 * Math.PI * 60;
    const boysArc = (boysPercent / 100) * circumference;
    const girlsArc = (girlsPercent / 100) * circumference;

    return (
        <Card>
            <h3 className="text-lg font-bold mb-4 text-slate-800">{title}</h3>
            <div className="flex items-center justify-center gap-8">
                <div className="relative">
                    <svg width="160" height="160" viewBox="0 0 160 160">
                        <circle cx="80" cy="80" r="60" fill="none" stroke="#e2e8f0" strokeWidth="20" />
                        <circle cx="80" cy="80" r="60" fill="none" stroke="#3b82f6" strokeWidth="20" strokeDasharray={`${boysArc} ${circumference}`} strokeDashoffset="0" transform="rotate(-90 80 80)" className="transition-all duration-700" />
                        <circle cx="80" cy="80" r="60" fill="none" stroke="#ec4899" strokeWidth="20" strokeDasharray={`${girlsArc} ${circumference}`} strokeDashoffset={`${-boysArc}`} transform="rotate(-90 80 80)" className="transition-all duration-700" />
                        <text x="80" y="75" textAnchor="middle" className="text-2xl font-bold fill-slate-800">{total}</text>
                        <text x="80" y="95" textAnchor="middle" className="text-xs fill-slate-500">Total</text>
                    </svg>
                </div>
                <div className="space-y-3">
                    <div className="flex items-center gap-2"><span className="w-4 h-4 rounded-full bg-blue-500"></span><span className="text-sm text-slate-600">Boys</span><span className="font-bold text-slate-800 ml-auto">{boys}</span></div>
                    <div className="flex items-center gap-2"><span className="w-4 h-4 rounded-full bg-pink-500"></span><span className="text-sm text-slate-600">Girls</span><span className="font-bold text-slate-800 ml-auto">{girls}</span></div>
                </div>
            </div>
        </Card>
    );
};

const TeacherDashboard = () => {
    const { user } = useAuth();
    const [allStudents, setAllStudents] = useState([]);
    const [filteredStudents, setFilteredStudents] = useState([]);
    const [teacherProfile, setTeacherProfile] = useState(null);
    const [loading, setLoading] = useState(true);

    // Filter state - matches the image design
    const [selectedFilter, setSelectedFilter] = useState('');
    const [feeStatus, setFeeStatus] = useState('all'); // all, paid, unpaid
    const [searchQuery, setSearchQuery] = useState(''); // Added Search State
    const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
    const [attendanceRecords, setAttendanceRecords] = useState([]);

    // Edit State
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isProfileModalOpen, setIsProfileModalOpen] = useState(false); // Profile View State
    const [editingStudent, setEditingStudent] = useState(null);
    const [editFormData, setEditFormData] = useState({
        name: '',
        phone: '',
        email: '',
        password: ''
    });
    const [updateLoading, setUpdateLoading] = useState(false);
    const [successMessage, setSuccessMessage] = useState('');

    // Bulk Print State
    const [selectedStudents, setSelectedStudents] = useState([]);
    const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);
    const [printStudentIds, setPrintStudentIds] = useState([]);

    const [errorMessage, setErrorMessage] = useState('');

    // View Details State
    const [viewingStudent, setViewingStudent] = useState(null);

    useEffect(() => {
        const fetchData = async () => {
            if (!user) return;

            try {
                // Get Teacher Profile
                const teacherRef = doc(db, "teachers", user.uid);
                const teacherSnap = await getDoc(teacherRef);

                if (teacherSnap.exists()) {
                    const teacherData = teacherSnap.data();
                    setTeacherProfile(teacherData);

                    // Set default filter to 'All'
                    setSelectedFilter('All');

                    // Find all valid full department names for this teacher
                    const coreSubject = teacherData.dept.split('(')[0].trim().toLowerCase();
                    const { DEPARTMENTS } = await import('../../constants/departments');
                    const validDepts = Object.keys(DEPARTMENTS).filter(d => 
                        d.toLowerCase().includes(coreSubject)
                    );

                    let studentsList = [];
                    // Always include the exact dept name from teacher profile as well
                    const searchDepts = Array.from(new Set([...validDepts, teacherData.dept]));

                    if (searchDepts.length > 0) {
                        // Firestore 'in' query supports up to 30 values
                        const q = query(
                            collection(db, "students"), 
                            where("dept", "in", searchDepts.slice(0, 30))
                        );
                        const querySnapshot = await getDocs(q);
                        studentsList = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                    }
                    
                    setAllStudents(studentsList);
                }
            } catch (error) {
                console.error("Error fetching data:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [user]);

    useEffect(() => {
        const fetchAttendance = async () => {
            if (!teacherProfile?.dept) return;
            try {
                const q = query(collection(db, "attendance"), where("date", "==", selectedDate));
                const snap = await getDocs(q);
                const records = snap.docs.map(doc => doc.data());
                setAttendanceRecords(records);
            } catch (err) {
                console.error("Error fetching attendance:", err);
            }
        };
        fetchAttendance();
    }, [selectedDate, teacherProfile]);

    // Notification Logic
    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [isNotifOpen, setIsNotifOpen] = useState(false);

    useEffect(() => {
        const fetchNotifications = async () => {
            if (!user) return;
            try {
                // 1. Fetch Events (All + Teacher Specific)
                // REMOVED orderBy to avoid "Missing Index" error. Sorting client-side instead.
                const q = query(
                    collection(db, "events"),
                    where("target", "in", ["all", "teacher"])
                );
                const snapshot = await getDocs(q);
                const allEvents = snapshot.docs
                    .map(doc => ({
                        id: doc.id,
                        type: 'event',
                        ...doc.data()
                    }))
                    .sort((a, b) => {
                        // sort by createdAt desc
                        const da = a.createdAt?.toDate ? a.createdAt.toDate() : new Date(a.createdAt);
                        const db = b.createdAt?.toDate ? b.createdAt.toDate() : new Date(b.createdAt);
                        return db - da;
                    });

                // 2. Fetch User's Read/Cleared Status
                const userDoc = await getDoc(doc(db, "users", user.uid));
                const userData = userDoc.data();
                const readEvents = userData?.readEvents || {};
                const clearedEvents = userData?.clearedEvents || [];

                // 3. Filter Events
                const validEvents = allEvents.filter(event => {
                    if (clearedEvents.includes(event.id)) return false;
                    if (readEvents[event.id]) {
                        const readDate = new Date(readEvents[event.id]);
                        const daysSinceRead = (new Date() - readDate) / (1000 * 60 * 60 * 24);
                        if (daysSinceRead > 30) return false;
                    }
                    return true;
                }).map(event => ({
                    ...event,
                    isRead: !!readEvents[event.id]
                }));

                // 4. Generate Fee Alerts (Local Only - Dynamic)
                // Filter students in teacher's dept who have unpaid fees
                let feeAlerts = [];
                if (teacherProfile?.dept && allStudents.length > 0) {
                    const coreSubject = teacherProfile.dept.split('(')[0].trim();
                    const unpaidStudents = allStudents.filter(s =>
                        s.dept && s.dept.includes(coreSubject) &&
                        (Number(s.fees?.balance || 0) > 0)
                    );

                    if (unpaidStudents.length > 0) {
                        feeAlerts.push({
                            id: 'fee-alert-summary',
                            type: 'alert',
                            title: 'Pending Fees Alert',
                            message: `${unpaidStudents.length} students in your department have pending fees.`,
                            date: 'Today',
                            isRead: false, // Always show as alert if condition exists
                            action: () => setFeeStatus('unpaid') // Custom action
                        });
                    }
                }

                // Combine
                const combined = [...feeAlerts, ...validEvents];
                setNotifications(combined);
                setUnreadCount(combined.filter(n => !n.isRead).length);

            } catch (error) {
                console.error("Error fetching notifications:", error);
            }
        };

        if (teacherProfile && allStudents.length > 0) {
            fetchNotifications();
        }
    }, [user, teacherProfile, allStudents]);

    const markAsRead = async (notification) => {
        if (notification.type === 'alert') {
            if (notification.action) notification.action();
            setIsNotifOpen(false);
            return;
        }

        if (notification.isRead) return;

        try {
            setNotifications(prev => prev.map(n =>
                n.id === notification.id ? { ...n, isRead: true } : n
            ));
            setUnreadCount(prev => Math.max(0, prev - 1));

            const userRef = doc(db, "users", user.uid);
            await updateDoc(userRef, {
                [`readEvents.${notification.id}`]: new Date().toISOString()
            });
        } catch (error) {
            console.error("Error marking read:", error);
        }
    };

    const clearNotification = async (e, notificationId) => {
        e.stopPropagation();
        try {
            setNotifications(prev => prev.filter(n => n.id !== notificationId));
            const userRef = doc(db, "users", user.uid);
            const userDoc = await getDoc(userRef);
            const currentCleared = userDoc.data()?.clearedEvents || [];
            await updateDoc(userRef, {
                clearedEvents: [...currentCleared, notificationId]
            });
        } catch (error) {
            console.error("Error clearing:", error);
        }
    };
    useEffect(() => {
        let result = [...allStudents];

        // 1. Filter by Teacher's Department (Implicit)
        if (teacherProfile?.dept) {
            // Normalize teacher dept string to match student dept
            // e.g. "Computer Science (CS)" -> "Computer Science"
            const coreSubject = teacherProfile.dept.split('(')[0].trim();

            result = result.filter(s =>
                s.dept && s.dept.includes(coreSubject)
            );
        }

        // 2. Filter by Selected Class/Year
        if (selectedFilter && selectedFilter !== 'All') {
            result = result.filter(s => s.class === selectedFilter);
        }

        // 3. Filter by fee status
        if (feeStatus === 'paid') {
            result = result.filter(s => {
                const balance = Number(s.fees?.balance || 0);
                return balance <= 0;
            });
        } else if (feeStatus === 'unpaid') {
            result = result.filter(s => {
                const balance = Number(s.fees?.balance || 0);
                return balance > 0;
            });
        }

        // 4. Search Filter (Name or Reg No)
        if (searchQuery) {
            const query = searchQuery.toLowerCase();
            result = result.filter(s =>
                (s.name && s.name.toLowerCase().includes(query)) ||
                (s.regno && s.regno.toLowerCase().includes(query))
            );
        }

        // 5. Only show active students
        result = result.filter(s => s.status === 'active' || !s.status);

        setFilteredStudents(result);
    }, [selectedFilter, feeStatus, searchQuery, allStudents, teacherProfile]);

    // Calculate Attendance Metrics for Teacher's Dept
    const attendanceMetrics = useMemo(() => {
        if (!teacherProfile?.dept) return { total: 0, present: 0, absent: 0, boys: 0, girls: 0 };
        const coreSubject = teacherProfile.dept.split('(')[0].trim();
        
        let total = 0, present = 0, absent = 0;
        let boys = 0, girls = 0;
        
        filteredStudents.forEach(s => {
            total++;
            if (s.gender?.toLowerCase() === 'male') boys++;
            if (s.gender?.toLowerCase() === 'female') girls++;
        });

        attendanceRecords.forEach(record => {
            if (record.dept && !record.dept.includes(coreSubject)) return;
            // Also apply class filter if selected
            if (selectedFilter && selectedFilter !== 'All' && record.class !== selectedFilter) return;

            Object.entries(record.records || {}).forEach(([studentId, status]) => {
                const student = filteredStudents.find(s => s.id === studentId);
                if (!student) return;

                if (status === 'Present') present++;
                else if (status === 'Absent') absent++;
            });
        });

        const notMarked = total - present - absent;
        return {
            total,
            present,
            absent: absent + notMarked,
            boys,
            girls
        };
    }, [filteredStudents, attendanceRecords, teacherProfile, selectedFilter]);

    // Generate filter options (Just Years)
    const getFilterOptions = () => {
        return ['All', '1st Year', '2nd Year', '3rd Year'];
    };

    const handleEditClick = (student) => {
        setEditingStudent(student);
        setEditFormData({
            name: student.name || '',
            phone: student.phone || '',
            email: student.email || '',
            password: student.password || '' // Pre-fill if available
        });
        setIsEditModalOpen(true);
    };

    // Bulk Selection Handlers
    const handleSelectAll = (e) => {
        if (e.target.checked) {
            setSelectedStudents(filteredStudents.map(s => s.id));
        } else {
            setSelectedStudents([]);
        }
    };

    const handleSelectStudent = (id) => {
        if (selectedStudents.includes(id)) {
            setSelectedStudents(prev => prev.filter(sId => sId !== id));
        } else {
            setSelectedStudents(prev => [...prev, id]);
        }
    };

    // Print Handlers
    const handleBulkPrint = () => {
        if (selectedStudents.length === 0) return;
        setPrintStudentIds(selectedStudents);
        setIsPrintModalOpen(true);
    };

    const handleSinglePrint = (id) => {
        setPrintStudentIds([id]);
        setIsPrintModalOpen(true);
    };

    const handleUpdateStudent = async (e) => {
        e.preventDefault();
        setUpdateLoading(true);
        setErrorMessage('');

        try {
            // Update 'students' collection
            await updateDoc(doc(db, "students", editingStudent.id), {
                name: editFormData.name,
                phone: editFormData.phone,
                email: editFormData.email,
                password: editFormData.password
            });

            // Update 'users' collection (for login)
            // Note: This matches the ManageStudents logic. 
            // Ideally, cloud functions should handle auth updates, but this keeps it consistent.
            await updateDoc(doc(db, "users", editingStudent.id), {
                name: editFormData.name,
                phone: editFormData.phone,
                email: editFormData.email
            });

            // Update local state
            setAllStudents(prev => prev.map(s =>
                s.id === editingStudent.id ? { ...s, ...editFormData } : s
            ));

            setSuccessMessage(`Successfully updated ${editFormData.name}`);
            setTimeout(() => setSuccessMessage(''), 3000);
            setIsEditModalOpen(false);
        } catch (error) {
            console.error("Error updating student:", error);
            setErrorMessage("Failed to update student. Please try again.");
        } finally {
            setUpdateLoading(false);
        }
    };



    // Helper to check if all filtered students are selected
    const isAllSelected = filteredStudents.length > 0 && filteredStudents.every(s => selectedStudents.includes(s.id));

    if (loading) return <div className="p-10 text-center">Loading dashboard...</div>;

    return (
        <div className="space-y-6">
            {/* Bulk Print Modal */}
            <AnimatePresence>
                {isPrintModalOpen && (
                    <BulkTCPrintModal
                        studentIds={printStudentIds}
                        onClose={() => setIsPrintModalOpen(false)}
                    />
                )}
            </AnimatePresence>

            <div className="flex justify-between items-start">
                <div>
                    <h1 className="text-3xl font-bold text-slate-800">Teacher Dashboard</h1>
                    <p className="text-slate-600 mt-1">
                        Welcome, {teacherProfile?.name} ({teacherProfile?.dept})
                    </p>
                </div>
                <div className="flex items-center gap-4">
                    {/* Notification Bell */}
                    <div className="relative">
                        <button
                            onClick={() => setIsNotifOpen(!isNotifOpen)}
                            className="p-2 rounded-full hover:bg-slate-100 relative transition-colors"
                        >
                            <Bell size={24} className="text-slate-600" />
                            {unreadCount > 0 && (
                                <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 text-white text-[10px] font-bold flex items-center justify-center rounded-full border-2 border-white">
                                    {unreadCount}
                                </span>
                            )}
                        </button>

                        <AnimatePresence>
                            {isNotifOpen && (
                                <motion.div
                                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                    animate={{ opacity: 1, y: 0, scale: 1 }}
                                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                                    className="absolute right-0 mt-2 w-80 sm:w-96 rounded-xl shadow-2xl border z-50 overflow-hidden bg-white dark:bg-[#0a0a0a] border-slate-100 dark:border-white/10"
                                >
                                    <div className="p-4 flex justify-between items-center border-b border-slate-50 dark:border-white/10 bg-slate-50/50 dark:bg-[#111111]">
                                        <h3 className="font-bold text-slate-700 dark:text-white">Notifications</h3>
                                        <button onClick={() => setIsNotifOpen(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-white">
                                            <X size={18} />
                                        </button>
                                    </div>
                                    <div className="max-h-[60vh] overflow-y-auto">
                                        {notifications.length === 0 ? (
                                            <div className="p-8 text-center text-slate-500">
                                                <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-3">
                                                    <Bell size={20} className="text-slate-400" />
                                                </div>
                                                <p>No new notifications</p>
                                            </div>
                                        ) : (
                                            <div className="divide-y divide-slate-50">
                                                {notifications.map(notif => (
                                                    <div
                                                        key={notif.id}
                                                        onClick={() => markAsRead(notif)}
                                                        className={`p-4 hover:bg-slate-50 dark:hover:bg-[#1a1a1a] transition-colors cursor-pointer group relative ${!notif.isRead ? 'bg-blue-50/30 dark:bg-blue-900/10' : ''}`}
                                                    >
                                                        <div className="flex justify-between items-start gap-3">
                                                            <div className="flex-1">
                                                                <div className="flex items-center gap-2 mb-1">
                                                                    {!notif.isRead && (
                                                                        <span className="w-2 h-2 rounded-full bg-brand-blue"></span>
                                                                    )}
                                                                    <span className="text-xs text-slate-400">{notif.date}</span>
                                                                    {notif.type === 'alert' && (
                                                                        <span className="bg-red-100 text-red-600 text-[10px] px-2 rounded-full font-bold">ALERT</span>
                                                                    )}
                                                                </div>
                                                                <h4 className={`text-sm font-semibold mb-1 ${!notif.isRead ? 'text-slate-900' : 'text-slate-600'}`}>
                                                                    {notif.title}
                                                                </h4>
                                                                <p className="text-xs text-slate-500 line-clamp-3">{notif.message}</p>
                                                            </div>
                                                            {notif.type !== 'alert' && (
                                                                <button
                                                                    onClick={(e) => clearNotification(e, notif.id)}
                                                                    className="opacity-0 group-hover:opacity-100 text-slate-300 hover:text-red-500 transition-all p-1"
                                                                    title="Clear Notification"
                                                                >
                                                                    <X size={14} />
                                                                </button>
                                                            )}
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>

                    <button
                        onClick={() => setIsProfileModalOpen(true)}
                        className="w-10 h-10 rounded-full bg-brand-blue/10 flex items-center justify-center text-brand-blue font-bold text-lg hover:bg-brand-blue hover:text-white transition-colors overflow-hidden border border-brand-blue/20"
                    >
                        {teacherProfile?.photoUrl ? (
                            <img src={teacherProfile.photoUrl} alt="Profile" className="w-full h-full object-cover" />
                        ) : (
                            teacherProfile?.name?.charAt(0)
                        )}
                    </button>

                    {selectedStudents.length > 0 && (
                        <Button onClick={handleBulkPrint} variant="secondary">
                            <Printer size={20} className="mr-2" />
                            Print TC ({selectedStudents.length})
                        </Button>
                    )}
                    <Button variant="outline" onClick={() => setIsProfileModalOpen(true)} className="gap-2">
                        <Users size={18} /> View Profile
                    </Button>
                </div>
            </div>

            {/* Filter Dropdown - Matches the image */}
            <Card className="relative z-20">
                <div className="p-6">
                    <div className="flex items-center gap-2 mb-4">
                        <Filter size={20} className="text-brand-blue" />
                        <h3 className="font-semibold text-slate-700">Filter Students</h3>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <Select
                            name="filter"
                            label="Select Class"
                            value={selectedFilter}
                            onChange={(e) => setSelectedFilter(e.target.value)}
                            options={getFilterOptions()}
                        />
                        <Select
                            name="feeStatus"
                            label="Fee Payment Status"
                            value={feeStatus}
                            onChange={(e) => setFeeStatus(e.target.value)}
                            options={['all', 'paid', 'unpaid']}
                        />
                        <ModernDatePicker
                            label="Attendance Date"
                            value={selectedDate}
                            onChange={(e) => setSelectedDate(e.target.value)}
                        />
                        <div className="md:col-span-3">
                            <Input
                                label="Search Student"
                                placeholder="Search by Name or Register Number..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>
                    </div>
                </div>
            </Card>

            {/* Attendance Metrics & Analytics */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-1">
                    <DonutChart boys={attendanceMetrics.boys} girls={attendanceMetrics.girls} title="Department Gender Split" />
                </div>
                <Card className="lg:col-span-2">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-lg font-bold text-slate-800">Today's Attendance</h3>
                        <span className="text-sm font-medium bg-slate-100 text-slate-600 px-3 py-1 rounded-full">{selectedDate}</span>
                    </div>
                    <div className="grid grid-cols-3 gap-4 mb-6">
                        <div className="p-4 bg-blue-50 rounded-xl border border-blue-100">
                            <p className="text-sm text-blue-600 font-medium">Total Students</p>
                            <h4 className="text-2xl font-bold text-blue-800">{attendanceMetrics.total}</h4>
                        </div>
                        <div className="p-4 bg-green-50 rounded-xl border border-green-100">
                            <p className="text-sm text-green-600 font-medium">Present</p>
                            <h4 className="text-2xl font-bold text-green-800">{attendanceMetrics.present}</h4>
                        </div>
                        <div className="p-4 bg-red-50 rounded-xl border border-red-100">
                            <p className="text-sm text-red-600 font-medium">Absent</p>
                            <h4 className="text-2xl font-bold text-red-800">{attendanceMetrics.absent}</h4>
                        </div>
                    </div>
                    {attendanceMetrics.total > 0 && (
                        <div>
                            <div className="flex justify-between text-sm font-medium text-slate-600 mb-2">
                                <span>Attendance Rate</span>
                                <span>{Math.round((attendanceMetrics.present / attendanceMetrics.total) * 100)}%</span>
                            </div>
                            <div className="w-full bg-slate-100 rounded-full h-3">
                                <div 
                                    className={`h-full rounded-full ${((attendanceMetrics.present / attendanceMetrics.total) * 100) >= 75 ? 'bg-green-500' : 'bg-red-500'}`} 
                                    style={{ width: `${(attendanceMetrics.present / attendanceMetrics.total) * 100}%` }} 
                                />
                            </div>
                        </div>
                    )}
                </Card>
            </div>
            {/* Success/Error Toasts */}
            {successMessage && (
                <Toast
                    message={successMessage}
                    type="success"
                    onClose={() => setSuccessMessage('')}
                />
            )}
            {errorMessage && (
                <Toast
                    message={errorMessage}
                    type="error"
                    onClose={() => setErrorMessage('')}
                />
            )}

            {/* Stats Card */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card>
                    <div className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-slate-600">Filtered Students</p>
                                <p className="text-3xl font-bold text-brand-blue mt-1">{filteredStudents.length}</p>
                            </div>
                            <div className="p-3 bg-brand-blue/10 rounded-xl">
                                <Users className="text-brand-blue" size={24} />
                            </div>
                        </div>
                    </div>
                </Card>

                <Card>
                    <div className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-slate-600">Your Department</p>
                                <p className="text-2xl font-bold text-slate-800 mt-1">{teacherProfile?.dept || 'N/A'}</p>
                            </div>
                        </div>
                    </div>
                </Card>

                <Card>
                    <div className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-slate-600">Current Filter</p>
                                <p className="text-lg font-bold text-slate-800 mt-1">
                                    {selectedFilter || 'None'}
                                </p>
                            </div>
                        </div>
                    </div>
                </Card>
            </div>

            {/* Students List */}
            <Card>
                <div className="p-6">
                    <h3 className="font-semibold text-slate-700 mb-4">Student List</h3>
                    {filteredStudents.length === 0 ? (
                        <p className="text-slate-500 text-center py-8">No students found matching the filter.</p>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead>
                                    <tr className="border-b border-slate-200">
                                        <th className="p-4 w-10">
                                            <input
                                                type="checkbox"
                                                checked={isAllSelected}
                                                onChange={handleSelectAll}
                                                className="rounded border-slate-300 text-brand-blue focus:ring-brand-blue"
                                            />
                                        </th>
                                        <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700">Name</th>
                                        <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700">Reg No</th>
                                        <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700">NM ID</th>
                                        <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700">Department</th>
                                        <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700">Year</th>
                                        <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700">Phone</th>
                                        <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700">Fee Balance</th>
                                        <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredStudents.map((student) => {
                                        const balance = Number(student.fees?.balance || 0);
                                        const isPaid = balance <= 0;

                                        return (
                                            <tr key={student.id} className="border-b border-slate-100 hover:bg-slate-50">
                                                <td className="p-4">
                                                    <input
                                                        type="checkbox"
                                                        checked={selectedStudents.includes(student.id)}
                                                        onChange={() => handleSelectStudent(student.id)}
                                                        className="rounded border-slate-300 text-brand-blue focus:ring-brand-blue"
                                                    />
                                                </td>
                                                <td className="py-3 px-4 text-sm">
                                                    <button
                                                        onClick={() => setViewingStudent(student)}
                                                        className="font-medium text-slate-900 hover:text-brand-blue hover:underline text-left"
                                                    >
                                                        {student.name}
                                                    </button>
                                                </td>
                                                <td className="py-3 px-4 text-sm">{student.regno}</td>
                                                <td className="py-3 px-4 text-sm">{student.nmId || '-'}</td>
                                                <td className="py-3 px-4 text-sm">{student.dept}</td>
                                                <td className="py-3 px-4 text-sm">{student.class}</td>
                                                <td className="py-3 px-4 text-sm">{student.phone}</td>
                                                <td className="py-3 px-4 text-sm">
                                                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${isPaid
                                                        ? 'bg-green-100 text-green-700'
                                                        : 'bg-red-100 text-red-700'
                                                        }`}>
                                                        {isPaid ? 'Paid' : `₹${balance.toLocaleString()}`}
                                                    </span>
                                                </td>
                                                <td className="py-3 px-4 text-sm flex gap-2">
                                                    <button
                                                        onClick={() => handleSinglePrint(student.id)}
                                                        className="p-2 text-slate-600 hover:bg-slate-100 rounded-full transition-colors mr-1"
                                                        title={`Print TC for ${student.name}`}
                                                    >
                                                        <Printer size={16} />
                                                    </button>
                                                    <button
                                                        onClick={() => handleEditClick(student)}
                                                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-full transition-colors"
                                                        title="Edit Details"
                                                    >
                                                        <Pencil size={16} />
                                                    </button>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </Card>

            {/* Edit Modal */}
            <AnimatePresence>
                {isEditModalOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={() => setIsEditModalOpen(false)}>
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            onClick={(e) => e.stopPropagation()}
                            className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden"
                        >
                            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                                <h3 className="text-lg font-bold text-slate-800">Edit Student Details</h3>
                                <button onClick={() => setIsEditModalOpen(false)} className="text-slate-400 hover:text-red-500 transition-colors">
                                    <X size={20} />
                                </button>
                            </div>

                            <form onSubmit={handleUpdateStudent} className="p-6 space-y-4">
                                <Input
                                    label="Full Name"
                                    value={editFormData.name}
                                    onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
                                    required
                                />
                                <Input
                                    label="Phone Number"
                                    value={editFormData.phone}
                                    onChange={(e) => setEditFormData({ ...editFormData, phone: e.target.value })}
                                    required
                                />
                                <Input
                                    label="Email Address"
                                    type="email"
                                    value={editFormData.email}
                                    onChange={(e) => setEditFormData({ ...editFormData, email: e.target.value })}
                                    required
                                />
                                <Input
                                    label="Login Password"
                                    value={editFormData.password}
                                    onChange={(e) => setEditFormData({ ...editFormData, password: e.target.value })}
                                    required
                                />

                                <div className="pt-4 flex gap-3">
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        onClick={() => setIsEditModalOpen(false)}
                                        className="flex-1"
                                    >
                                        Cancel
                                    </Button>
                                    <Button
                                        type="submit"
                                        isLoading={updateLoading}
                                        className="flex-1"
                                    >
                                        Save Changes
                                    </Button>
                                </div>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>


            {/* View Details Modal */}
            <AnimatePresence>
                {viewingStudent && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={() => setViewingStudent(null)}>
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            onClick={(e) => e.stopPropagation()}
                            className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto"
                        >
                            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                                <div>
                                    <h3 className="text-xl font-bold text-slate-800">{viewingStudent.name}</h3>
                                    <p className="text-sm text-slate-500">{viewingStudent.regno} | {viewingStudent.dept} | {viewingStudent.class}</p>
                                </div>
                                <button onClick={() => setViewingStudent(null)} className="text-slate-400 hover:text-red-500 transition-colors">
                                    <X size={24} />
                                </button>
                            </div>

                            <div className="p-6 space-y-6">
                                {/* Personal Details */}
                                <div>
                                    <h4 className="font-semibold text-brand-blue mb-3 border-b border-blue-100 pb-2">Personal Details</h4>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                                        <div><span className="text-slate-500 block">Father's Name</span> <span className="font-medium">{viewingStudent.fatherName || '-'}</span></div>
                                        <div><span className="text-slate-500 block">Date of Birth</span> <span className="font-medium">{viewingStudent.dob || '-'}</span></div>
                                        <div><span className="text-slate-500 block">Phone</span> <span className="font-medium">{viewingStudent.phone || '-'}</span></div>
                                        <div><span className="text-slate-500 block">Email</span> <span className="font-medium">{viewingStudent.email || '-'}</span></div>
                                        <div><span className="text-slate-500 block">Religion</span> <span className="font-medium">{viewingStudent.religion || '-'}</span></div>
                                        <div><span className="text-slate-500 block">Community</span> <span className="font-medium">{viewingStudent.community || '-'}</span></div>
                                        <div><span className="text-slate-500 block">Nationality</span> <span className="font-medium">{viewingStudent.nationality || '-'}</span></div>
                                        <div><span className="text-slate-500 block">Naan Mudhalvan ID</span> <span className="font-medium">{viewingStudent.nmId || '-'}</span></div>
                                    </div>
                                </div>

                                {/* Academic Details */}
                                <div>
                                    <h4 className="font-semibold text-brand-blue mb-3 border-b border-blue-100 pb-2">Academic Details</h4>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                                        <div><span className="text-slate-500 block">Admission Date</span> <span className="font-medium">{viewingStudent.admissionDate || '-'}</span></div>
                                        <div><span className="text-slate-500 block">Academic Year</span> <span className="font-medium">{viewingStudent.academicYear || '-'}</span></div>
                                        <div><span className="text-slate-500 block">Promotion Status</span> <span className="font-medium">{viewingStudent.promotion || '-'}</span></div>
                                        <div><span className="text-slate-500 block">Conduct</span> <span className="font-medium">{viewingStudent.conduct || '-'}</span></div>
                                    </div>
                                </div>

                                {/* Fee Details */}
                                <div>
                                    <h4 className="font-semibold text-brand-blue mb-3 border-b border-blue-100 pb-2">Fee Status</h4>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                                        {/* Tuition Fees */}
                                        <div className="bg-blue-50 p-3 rounded-lg border border-blue-100">
                                            <h5 className="font-semibold text-blue-800 mb-2 text-sm">College / Tuition Fees</h5>
                                            <div className="space-y-1 text-sm">
                                                <div className="flex justify-between">
                                                    <span className="text-slate-500">Total</span>
                                                    <span className="font-medium">₹{Number(viewingStudent.fees?.total || 0).toLocaleString()}</span>
                                                </div>
                                                <div className="flex justify-between">
                                                    <span className="text-slate-500">Paid</span>
                                                    <span className="font-medium text-green-600">₹{Number(viewingStudent.fees?.paid || 0).toLocaleString()}</span>
                                                </div>
                                                <div className="flex justify-between pt-1 border-t border-blue-200 mt-1">
                                                    <span className="text-slate-600 font-medium">Balance</span>
                                                    <span className={`font-bold ${Number(viewingStudent.fees?.balance || 0) > 0 ? 'text-red-500' : 'text-slate-400'}`}>
                                                        ₹{Number(viewingStudent.fees?.balance || 0).toLocaleString()}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Bus Fees */}
                                        <div className="bg-blue-50 p-3 rounded-lg border border-blue-100">
                                            <h5 className="font-semibold text-blue-800 mb-2 text-sm">Bus Fees</h5>
                                            <div className="space-y-1 text-sm">
                                                <div className="flex justify-between">
                                                    <span className="text-slate-500">Total</span>
                                                    <span className="font-medium">₹{Number(viewingStudent.fees?.busTotal || 0).toLocaleString()}</span>
                                                </div>
                                                <div className="flex justify-between">
                                                    <span className="text-slate-500">Paid</span>
                                                    <span className="font-medium text-green-600">₹{Number(viewingStudent.fees?.busPaid || 0).toLocaleString()}</span>
                                                </div>
                                                <div className="flex justify-between pt-1 border-t border-blue-200 mt-1">
                                                    <span className="text-slate-600 font-medium">Balance</span>
                                                    <span className={`font-bold ${Number(viewingStudent.fees?.busBalance || 0) > 0 ? 'text-red-500' : 'text-slate-400'}`}>
                                                        ₹{Number(viewingStudent.fees?.busBalance || 0).toLocaleString()}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Other Fees - Full Width if needed or just listing */}
                                        <div className="md:col-span-2 bg-purple-50 p-3 rounded-lg border border-purple-100 flex justify-between items-center text-sm">
                                            <div>
                                                <h5 className="font-semibold text-purple-800">Other Fees</h5>
                                                <span className="text-xs text-slate-500">Lab, Exam, etc.</span>
                                            </div>
                                            <div>
                                                <span className="text-slate-500 mr-2">Paid:</span>
                                                <span className="font-bold text-purple-700">₹{Number(viewingStudent.fees?.otherPaid || 0).toLocaleString()}</span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Detailed Payment History */}
                                    <h5 className="font-semibold text-slate-700 mb-2 text-sm">Payment History</h5>
                                    {(!viewingStudent.fees?.payments?.length && !viewingStudent.fees?.busPayments?.length && !viewingStudent.fees?.otherPayments?.length) ? (
                                        <p className="text-sm text-slate-500 italic">No payment records found.</p>
                                    ) : (
                                        <div className="overflow-x-auto border border-slate-200 rounded-lg">
                                            <table className="w-full text-sm text-left">
                                                <thead className="bg-slate-100 text-slate-600 font-medium">
                                                    <tr>
                                                        <th className="p-2 border-b">Bill No</th>
                                                        <th className="p-2 border-b">Date</th>
                                                        <th className="p-2 border-b">Type</th>
                                                        <th className="p-2 border-b text-right">Amount</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {/* Tuition Payments */}
                                                    {viewingStudent.fees?.payments?.map((p, i) => (
                                                        <tr key={`tuition-${i}`} className="border-b last:border-0 hover:bg-slate-50">
                                                            <td className="p-2">{p.billNo}</td>
                                                            <td className="p-2">{p.date}</td>
                                                            <td className="p-2 text-slate-500">Tuition</td>
                                                            <td className="p-2 text-right font-medium">₹{Number(p.amount).toLocaleString()}</td>
                                                        </tr>
                                                    ))}
                                                    {/* Bus Payments */}
                                                    {viewingStudent.fees?.busPayments?.map((p, i) => (
                                                        <tr key={`bus-${i}`} className="border-b last:border-0 hover:bg-slate-50">
                                                            <td className="p-2">{p.billNo}</td>
                                                            <td className="p-2">{p.date}</td>
                                                            <td className="p-2 text-slate-500">Bus Fee</td>
                                                            <td className="p-2 text-right font-medium">₹{Number(p.amount).toLocaleString()}</td>
                                                        </tr>
                                                    ))}
                                                    {/* Other Payments */}
                                                    {viewingStudent.fees?.otherPayments?.map((p, i) => (
                                                        <tr key={`other-${i}`} className="border-b last:border-0 hover:bg-slate-50">
                                                            <td className="p-2">{p.billNo}</td>
                                                            <td className="p-2">{p.date}</td>
                                                            <td className="p-2 text-slate-500">{p.description || 'Other'}</td>
                                                            <td className="p-2 text-right font-medium">₹{Number(p.amount).toLocaleString()}</td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="p-4 border-t border-slate-100 bg-slate-50 flex justify-end">
                                <Button onClick={() => setViewingStudent(null)}>Close</Button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>


            {/* Teacher Profile Modal */}
            <AnimatePresence>
                {isProfileModalOpen && teacherProfile && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={() => setIsProfileModalOpen(false)}>
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            onClick={(e) => e.stopPropagation()}
                            className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden"
                        >
                            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                                <h3 className="text-xl font-bold text-slate-800">My Profile</h3>
                                <button onClick={() => setIsProfileModalOpen(false)} className="text-slate-400 hover:text-red-500 transition-colors">
                                    <X size={24} />
                                </button>
                            </div>

                            <div className="p-8">
                                <div className="flex flex-col items-center mb-6">
                                    <div className="relative group cursor-pointer">
                                        <div className="w-24 h-24 rounded-full bg-brand-blue/10 flex items-center justify-center text-brand-blue text-3xl font-bold mb-3 overflow-hidden border-2 border-slate-100 group-hover:border-brand-blue transition-colors">
                                            {teacherProfile.photoUrl ? (
                                                <img src={teacherProfile.photoUrl} alt="Profile" className="w-full h-full object-cover" />
                                            ) : (
                                                teacherProfile.name?.charAt(0).toUpperCase()
                                            )}
                                        </div>
                                        <div className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity mb-3">
                                            <Pencil className="text-white w-6 h-6" />
                                        </div>
                                        <input
                                            type="file"
                                            accept="image/*"
                                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer mb-3"
                                            onChange={async (e) => {
                                                const file = e.target.files[0];
                                                if (!file) return;

                                                try {
                                                    const storageRef = ref(storage, `teachers/${user.uid}/profile.jpg`);
                                                    await uploadBytes(storageRef, file);
                                                    const photoUrl = await getDownloadURL(storageRef);

                                                    // Update FireStore
                                                    await updateDoc(doc(db, "teachers", user.uid), { photoUrl });
                                                    await updateDoc(doc(db, "users", user.uid), { photoUrl });

                                                    // Update Local State
                                                    setTeacherProfile(prev => ({ ...prev, photoUrl }));
                                                    alert("Profile picture updated!");
                                                } catch (error) {
                                                    console.error("Error uploading photo:", error);
                                                    alert("Failed to upload photo.");
                                                }
                                            }}
                                        />
                                    </div>
                                    <h4 className="text-2xl font-bold text-slate-800">{teacherProfile.name}</h4>
                                    <p className="text-slate-500">{teacherProfile.role ? teacherProfile.role.toUpperCase() : 'Teacher'}</p>
                                </div>

                                <div className="space-y-4">
                                    <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                                        <span className="text-slate-500 text-sm">Department</span>
                                        <span className="font-semibold text-slate-800">{teacherProfile.dept}</span>
                                    </div>
                                    <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                                        <span className="text-slate-500 text-sm">Email</span>
                                        <span className="font-semibold text-slate-800">{teacherProfile.email}</span>
                                    </div>
                                    <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                                        <span className="text-slate-500 text-sm">Phone</span>
                                        <span className="font-semibold text-slate-800">{teacherProfile.phone || 'N/A'}</span>
                                    </div>
                                    <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                                        <span className="text-slate-500 text-sm">Employee ID</span>
                                        <span className="font-semibold text-slate-800">{teacherProfile.employeeId || 'N/A'}</span>
                                    </div>
                                    <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                                        <span className="text-slate-500 text-sm">Date of Birth</span>
                                        <span className="font-semibold text-slate-800">{teacherProfile.dob || 'N/A'}</span>
                                    </div>
                                </div>
                            </div>

                            <div className="p-4 border-t border-slate-100 bg-slate-50 flex justify-end">
                                <Button onClick={() => setIsProfileModalOpen(false)}>Close</Button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
            {/* Print Modal */}


        </div >
    );
};

export default TeacherDashboard;
