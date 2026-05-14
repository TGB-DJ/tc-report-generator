import { useState, useEffect, useRef } from 'react';
import { doc, getDoc, collection, query, where, getDocs, orderBy, updateDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { useAuth } from '../../context/AuthContext';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import { useNavigate, useLocation } from 'react-router-dom';
import { User, FileText, CheckCircle, AlertCircle, Eye, Bell, X, Share2, QrCode, Download } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';

const StudentDashboard = () => {
    const { user, userData } = useAuth();
    const [student, setStudent] = useState(userData && userData.role === 'student' ? userData : null);
    const [loading, setLoading] = useState(!student);
    const [activeTab, setActiveTab] = useState('profile');
    const [isNotifOpen, setIsNotifOpen] = useState(false);
    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [isQrModalOpen, setIsQrModalOpen] = useState(false);
    const [isDownloading, setIsDownloading] = useState(false);
    const [selectedSem, setSelectedSem] = useState('Current');
    const profileRef = useRef(null);
    const idCardRef = useRef(null);
    const navigate = useNavigate();
    const location = useLocation();

    useEffect(() => {
        const queryParams = new URLSearchParams(location.search);
        const tab = queryParams.get('tab');
        if (tab) {
            setActiveTab(tab);
        }
    }, [location.search]);

    useEffect(() => {
        const fetchProfile = async () => {
            if (!user) return;
            
            // If we already have full profile data from AuthContext migration, use it
            if (userData && userData.role === 'student' && userData.regno) {
                setStudent(userData);
                setLoading(false);
                return;
            }

            try {
                const docRef = doc(db, "students", user.uid);
                const docSnap = await getDoc(docRef);
                if (docSnap.exists()) {
                    setStudent(docSnap.data());
                }
            } catch (error) {
                console.error("Error fetching profile:", error);
            } finally {
                setLoading(false);
            }
        };

        const fetchNotifications = async () => {
            if (!user) return;
            try {
                // Fetch Events (All + Student Specific)
                // REMOVED orderBy to avoid "Missing Index" error. Sorting client-side instead.
                const q = query(
                    collection(db, "events"),
                    where("target", "in", ["all", "student"])
                );

                const snapshot = await getDocs(q);
                // Client-side Sort
                const allEvents = snapshot.docs
                    .map(doc => ({ id: doc.id, ...doc.data() }))
                    .sort((a, b) => {
                        // sort by createdAt desc
                        const da = a.createdAt?.toDate ? a.createdAt.toDate() : new Date(a.createdAt);
                        const db = b.createdAt?.toDate ? b.createdAt.toDate() : new Date(b.createdAt);
                        return db - da;
                    });

                // Filter out cleared/read events (if using 30-day logic)
                // For now, let's load user's read status
                const userDoc = await getDoc(doc(db, "users", user.uid));
                const userData = userDoc.data();
                const readEvents = userData?.readEvents || {}; // Map of { eventId: timestamp }
                const clearedEvents = userData?.clearedEvents || []; // List of IDs

                // Filter logic:
                // 1. Not in clearedEvents
                // 2. If Read, check if > 30 days old (optional, but requested)

                const validEvents = allEvents.filter(event => {
                    if (clearedEvents.includes(event.id)) return false;

                    if (readEvents[event.id]) {
                        const readDate = new Date(readEvents[event.id]);
                        const daysSinceRead = (new Date() - readDate) / (1000 * 60 * 60 * 24);
                        if (daysSinceRead > 30) return false;
                    }
                    return true;
                });

                // Attach read status
                const eventsWithStatus = validEvents.map(event => ({
                    ...event,
                    isRead: !!readEvents[event.id]
                }));

                setNotifications(eventsWithStatus);
                setUnreadCount(eventsWithStatus.filter(e => !e.isRead).length);

            } catch (error) {
                console.error("Error fetching notifications:", error);
            }
        };

        fetchProfile();
        fetchNotifications();
    }, [user]);

    const markAsRead = async (notification) => {
        if (notification.isRead) return;

        try {
            // Update Local State
            setNotifications(prev => prev.map(n =>
                n.id === notification.id ? { ...n, isRead: true } : n
            ));
            setUnreadCount(prev => Math.max(0, prev - 1));

            // Update Firestore
            const userRef = doc(db, "users", user.uid);
            await updateDoc(userRef, {
                [`readEvents.${notification.id}`]: new Date().toISOString()
            });

        } catch (error) {
            console.error("Error marking read:", error);
        }
    };

    const clearNotification = async (e, notificationId) => {
        e.stopPropagation(); // Prevent triggering read
        try {
            // Update Local State
            setNotifications(prev => prev.filter(n => n.id !== notificationId));

            // Update Firestore
            const userRef = doc(db, "users", user.uid);
            const userDoc = await getDoc(userRef);
            const currentCleared = userDoc.data()?.clearedEvents || [];

            await updateDoc(userRef, {
                clearedEvents: [...currentCleared, notificationId]
            });

        } catch (error) {
            console.error("Error clearing notification:", error);
        }
    };

    const downloadIdCardImage = async () => {
        if (!idCardRef.current) return;
        setIsDownloading(true);
        try {
            const canvas = await html2canvas(idCardRef.current, {
                scale: 3, // High quality
                backgroundColor: null,
                useCORS: true
            });
            const image = canvas.toDataURL('image/png', 1.0);
            const link = document.createElement('a');
            link.download = `${student.regno}_ID_Card.png`;
            link.href = image;
            link.click();
        } catch (error) {
            console.error('Error generating image:', error);
        } finally {
            setIsDownloading(false);
        }
    };

    const downloadIdCardPdf = async () => {
        if (!idCardRef.current) return;
        setIsDownloading(true);
        try {
            const canvas = await html2canvas(idCardRef.current, {
                scale: 3,
                backgroundColor: null,
                useCORS: true
            });
            const imgData = canvas.toDataURL('image/png', 1.0);
            
            // Calculate dimensions to maintain aspect ratio in PDF
            const pdf = new jsPDF('p', 'mm', 'a4');
            const pdfWidth = pdf.internal.pageSize.getWidth();
            const margin = 20;
            const targetWidth = 90; // Standard ID width is roughly 54x86mm
            const targetHeight = (canvas.height * targetWidth) / canvas.width;

            pdf.addImage(imgData, 'PNG', (pdfWidth - targetWidth) / 2, margin, targetWidth, targetHeight);
            pdf.save(`${student.regno}_ID_Card.pdf`);
        } catch (error) {
            console.error('Error generating PDF:', error);
        } finally {
            setIsDownloading(false);
        }
    };

    if (loading) return <div className="p-10 text-center">Loading profile...</div>;
    if (!student) return <div className="p-10 text-center">Student profile not found. Contact Admin.</div>;

    const isClear = student.fees?.balance <= 0;

    // derived state for fee view
    const getFeeDisplay = () => {
        if (selectedSem === 'All') {
            return {
                title: "Total Outstanding (All Semesters)",
                total: student.fees?.total || 0,
                paid: student.fees?.paid || 0,
                balance: student.fees?.balance || 0,
                isHistory: false
            };
        }

        // Try to find specific history for this semester
        const history = student.fees?.history || [];
        const semester = selectedSem === 'Current' ? (student.semester || '1') : selectedSem;

        // Filter history items for this semester
        const semFees = history.filter(h => h.semester === semester.toString());

        if (semFees.length === 0) {
            // Fallback if no specific history found but user selected 'Current'
            if (selectedSem === 'Current') {
                return {
                    title: `Total Outstanding (All Semesters)`,
                    total: student.fees?.total || 0,
                    paid: student.fees?.paid || 0,
                    balance: student.fees?.balance || 0,
                    note: "No specific semester data found. Showing total.",
                    isHistory: false
                };
            }
            return null; // No data for selected sem
        }

        const semTotal = semFees.reduce((sum, h) => sum + (h.total || 0), 0);
        // Note: Tracking 'Paid' per semester handles complexity not fully implemented yet in payments.
        // For now, checks against total paid might be confusing if not split.
        // We will show the DEMAND for this semester.
        return {
            title: `Semester ${semester} Fees`,
            total: semTotal,
            paid: "Check Receipts", // Placeholder as strict sem-linking for payments isn't there yet
            balance: "See Total Due",
            isHistory: true,
            details: semFees
        };
    };

    const feeView = getFeeDisplay();

    const getTabTitle = () => {
        switch(activeTab) {
            case 'profile': return 'Profile';
            case 'academic': return 'Academic';
            case 'fees': return 'Fees';
            case 'share': return 'Share ID';
            default: return 'Student Dashboard';
        }
    };

    return (
        <div className="space-y-6 relative">
            <div className="flex justify-between items-center p-4 rounded-xl shadow-sm border border-slate-200 dark:border-white/10 dark:bg-[#0a0a0a]">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800 dark:text-white">{getTabTitle()}</h1>
                    <p className="text-slate-500 text-sm">Welcome, {student.name}</p>
                </div>

                {/* Notification Bell */}
                <div className="relative">
                    <button
                        onClick={() => setIsNotifOpen(!isNotifOpen)}
                        className="p-2 rounded-full hover:bg-slate-100 relative transition-colors"
                    >
                        <Bell size={24} className="text-slate-600" />
                        {unreadCount > 0 && (
                            <span className="absolute top-0 right-0 w-4 h-4 bg-red-500 text-white text-[10px] font-bold flex items-center justify-center rounded-full border-2 border-white">
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
                                                            </div>
                                                            <h4 className={`text-sm font-semibold mb-1 ${!notif.isRead ? 'text-slate-900' : 'text-slate-600'}`}>
                                                                {notif.title}
                                                            </h4>
                                                            <p className="text-xs text-slate-500 line-clamp-3">{notif.message}</p>
                                                        </div>
                                                        <button
                                                            onClick={(e) => clearNotification(e, notif.id)}
                                                            className="opacity-0 group-hover:opacity-100 text-slate-300 hover:text-red-500 transition-all p-1"
                                                            title="Clear Notification"
                                                        >
                                                            <X size={14} />
                                                        </button>
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
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Profile Card */}
                <Card className="md:col-span-2 relative overflow-hidden" ref={profileRef}>
                    <div className="flex flex-col sm:flex-row items-center sm:items-start justify-between mb-8 gap-6 pt-4 sm:pt-0">
                        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6 w-full">
                            {/* QR Code Pass */}
                            <div className="flex-shrink-0 relative group flex flex-col items-center">
                                <div 
                                    className="w-32 h-32 bg-white p-2 rounded-2xl border-2 border-slate-100 shadow-md flex items-center justify-center relative z-10 transition-transform hover:scale-105 duration-300 cursor-pointer"
                                    onClick={() => setIsQrModalOpen(true)}
                                >
                                    <img 
                                        src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(`${window.location.origin}/id/${student.regno}`)}`}
                                        alt="Student Pass QR" 
                                        className="w-full h-full object-contain"
                                        loading="lazy"
                                    />
                                </div>
                                <div className="absolute top-0 w-32 h-32 bg-gradient-to-br from-brand-blue to-blue-500 rounded-2xl blur-xl opacity-20 -z-10 group-hover:opacity-40 transition-opacity duration-300"></div>
                                <p className="text-[10px] uppercase font-bold text-slate-400 mt-3 tracking-wider bg-slate-50 px-2 py-0.5 rounded-full border border-slate-100 text-center">Library / Lab Pass</p>
                                <p className="text-xs font-mono font-bold text-slate-600 mt-1">{student.regno}</p>
                            </div>
                            
                            <div className="flex-1 text-center sm:text-left mt-2 sm:mt-0">
                                <div className="flex flex-col sm:flex-row items-center sm:items-start justify-center sm:justify-start gap-4 mb-3">
                                    <div className="w-16 h-16 rounded-full bg-gradient-to-br from-brand-blue to-blue-600 flex flex-shrink-0 items-center justify-center text-white text-xl font-bold shadow-lg shadow-blue-500/20 overflow-hidden border-2 border-white ring-2 ring-blue-50">
                                        {student.photoUrl ? (
                                            <img src={student.photoUrl} alt="Profile" className="w-full h-full object-cover" />
                                        ) : (
                                            student.name?.charAt(0).toUpperCase()
                                        )}
                                    </div>
                                    <div className="pt-1">
                                        <h2 className="text-2xl sm:text-3xl font-bold text-slate-800 tracking-tight">{student.name}</h2>
                                        <p className="text-slate-500 font-medium tracking-wide">{student.regno}</p>
                                    </div>
                                </div>
                                
                                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3 mt-5">
                                    <div className={`px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wide border shadow-sm ${student.fees?.balance <= 0
                                        ? "bg-green-50 text-green-700 border-green-200"
                                        : "bg-red-50 text-red-700 border-red-200"
                                        }`}>
                                        {student.fees?.balance <= 0 ? (
                                            <span className="flex items-center"><CheckCircle size={14} className="mr-1.5" /> Fees Cleared</span>
                                        ) : (
                                            <span className="flex items-center"><AlertCircle size={14} className="mr-1.5" /> Fees Pending</span>
                                        )}
                                    </div>

                                    <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-slate-100 dark:border-white/10 w-full justify-center sm:justify-start">
                                        <Button 
                                            onClick={() => navigate('?tab=share')} 
                                            className="flex-1 sm:flex-none"
                                        >
                                            <Share2 size={16} className="mr-2" />
                                            Share / Generate ID
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </Card>
            </div>

            {/* QR Modal */}
            <AnimatePresence>
                {isQrModalOpen && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={() => setIsQrModalOpen(false)}
                        className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
                    >
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            onClick={(e) => e.stopPropagation()}
                            className="bg-white p-6 rounded-2xl shadow-2xl relative max-w-sm w-full flex flex-col items-center"
                        >
                            <button
                                onClick={() => setIsQrModalOpen(false)}
                                className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors"
                            >
                                <X size={20} />
                            </button>
                            <h3 className="text-xl font-bold text-slate-800 mb-6">Scan QR Code</h3>
                            <div className="w-64 h-64 bg-white p-2 rounded-xl border-2 border-slate-100 shadow-inner mb-6 no-gold">
                                <img 
                                    src={`https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(`${window.location.origin}/id/${student.regno}`)}`}
                                    alt="Student Pass QR (Large)" 
                                    className="w-full h-full object-contain no-gold"
                                />
                            </div>
                            <p className="text-sm text-slate-500 text-center px-4">
                                Contains emergency contact details and student identification.
                            </p>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Tabs removed as requested */}

            <AnimatePresence mode="wait">
                {activeTab === 'profile' && (
                    <motion.div
                        key="profile"
                        initial={{ opacity: 0, y: 10, filter: "blur(8px)" }}
                        animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                        exit={{ opacity: 0, y: -10, filter: "blur(8px)" }}
                        transition={{ duration: 0.3 }}
                    >
                        <Card className="p-6 space-y-6">
                            <h3 className="text-xl font-bold border-b border-slate-100 pb-2">Personal Information</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 text-sm">
                                <p className="font-semibold text-slate-800">{student.name}</p>
                            </div>

                            <div className="space-y-1">
                                <p className="text-slate-500 text-xs uppercase tracking-wider">Department</p>
                                <p className="font-semibold text-slate-800">{student.dept}</p>
                            </div>
                            <div className="space-y-1">
                                <p className="text-slate-500 text-xs uppercase tracking-wider">Class / Semester</p>
                                <p className="font-semibold text-brand-blue">{student.class} / Sem {student.semester || '1'}</p>
                            </div>
                            <div className="space-y-1">
                                <p className="text-slate-500 text-xs uppercase tracking-wider">Academic Year</p>
                                <p className="font-semibold text-slate-800">{student.academicYear || '-'}</p>
                            </div>

                            <div className="space-y-1">
                                <p className="text-slate-500 text-xs uppercase tracking-wider">Date of Birth</p>
                                <p className="font-semibold text-slate-800">{student.dob || '-'}</p>
                            </div>
                            <div className="space-y-1">
                                <p className="text-slate-500 text-xs uppercase tracking-wider">Gender</p>
                                <p className="font-semibold text-slate-800">{student.gender || '-'}</p>
                            </div>
                            <div className="space-y-1">
                                <p className="text-slate-500 text-xs uppercase tracking-wider">Religion / Community</p>
                                <p className="font-semibold text-slate-800">{student.religion} / {student.community}</p>
                            </div>

                            {student.fatherName && (
                                <div className="space-y-1">
                                    <p className="text-slate-500 text-xs uppercase tracking-wider">Father / Guardian</p>
                                    <p className="font-semibold text-slate-800">{student.fatherName}</p>
                                </div>
                            )}
                            {student.phone && (
                                <div className="space-y-1">
                                    <p className="text-slate-500 text-xs uppercase tracking-wider">Contact Phone</p>
                                    <p className="font-semibold text-slate-800">{student.phone}</p>
                                </div>
                            )}
                            {student.email && (
                                <div className="space-y-1">
                                    <p className="text-slate-500 text-xs uppercase tracking-wider">Email</p>
                                    <p className="font-semibold text-slate-800">{student.email}</p>
                                </div>
                            )}

                            {student.aadharNo && (
                                <div className="space-y-1">
                                    <p className="text-slate-500 text-xs uppercase tracking-wider">Aadhar No</p>
                                    <p className="font-semibold text-slate-800">{student.aadharNo}</p>
                                </div>
                            )}
                            {student.panNo && (
                                <div className="space-y-1">
                                    <p className="text-slate-500 text-xs uppercase tracking-wider">PAN No</p>
                                    <p className="font-semibold text-slate-800">{student.panNo}</p>
                                </div>
                            )}
                            {student.admissionDate && (
                                <div className="space-y-1">
                                    <p className="text-slate-500 text-xs uppercase tracking-wider">Admission Date</p>
                                    <p className="font-semibold text-slate-800">{student.admissionDate}</p>
                                </div>
                            )}

                            {student.address && (
                                <div className="col-span-1 md:col-span-2 lg:col-span-3 space-y-1 pt-2 border-t border-slate-100 mt-2">
                                    <p className="text-slate-500 text-xs uppercase tracking-wider">Address</p>
                                    <p className="font-semibold text-slate-800">{student.address}</p>
                                </div>
                            )}

                            {student.otherInfo && (
                                <div className="col-span-1 md:col-span-2 lg:col-span-3 space-y-1 pt-2 border-t border-slate-100 mt-2">
                                    <p className="text-slate-500 text-xs uppercase tracking-wider">Other Info / Remarks</p>
                                    <p className="font-semibold text-slate-800">{student.otherInfo}</p>
                                </div>
                            )}

                            {/* Additional Information Section */}
                            {(student.abcId || student.umisId || student.bankName || student.accountNo) && (
                                <div className="col-span-1 md:col-span-2 lg:col-span-3 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pt-4 border-t border-slate-200 dark:border-white/10 mt-2 p-4 rounded-lg">
                                    {student.abcId && (
                                        <div className="space-y-1">
                                            <p className="text-slate-500 text-xs uppercase tracking-wider">ABC ID</p>
                                            <p className="font-semibold text-slate-800">{student.abcId}</p>
                                        </div>
                                    )}
                                    {student.umisId && (
                                        <div className="space-y-1">
                                            <p className="text-slate-500 text-xs uppercase tracking-wider">UMIS ID</p>
                                            <p className="font-semibold text-slate-800">{student.umisId}</p>
                                        </div>
                                    )}
                                {(student.bankName || student.accountNo) && (
                                    <div className="space-y-1">
                                        <p className="text-slate-500 text-xs uppercase tracking-wider">Bank Details</p>
                                        <div className="font-semibold text-slate-800 text-sm">
                                            <p>{student.bankName}</p>
                                            <p>A/C: {student.accountNo}</p>
                                            <p>IFSC: {student.ifscCode}</p>
                                            <p>Branch: {student.branch}</p>
                                        </div>
                                    </div>
                                )}
                                </div>
                            )}
                        </Card>
                    </motion.div>
                )}

                {activeTab === 'academic' && (
                    <motion.div
                        key="academic"
                        initial={{ opacity: 0, y: 10, filter: "blur(8px)" }}
                        animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                        exit={{ opacity: 0, y: -10, filter: "blur(8px)" }}
                        transition={{ duration: 0.3 }}
                    >
                        <Card className="p-6 space-y-6">
                            <div className="flex justify-between items-center border-b border-slate-100 pb-2">
                                <h3 className="text-xl font-bold">Academic Profile</h3>
                                <Button variant="outline" size="sm" onClick={() => navigate('/student/marks')}>
                                    <FileText size={16} className="mr-2" />
                                    University Marks
                                </Button>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 text-sm">
                                <div className="space-y-1">
                                    <p className="text-slate-500 text-xs uppercase tracking-wider">Register No</p>
                                    <p className="font-semibold text-slate-800">{student.regno}</p>
                                </div>
                                <div className="space-y-1">
                                    <p className="text-slate-500 text-xs uppercase tracking-wider">Admission No</p>
                                    <p className="font-semibold text-slate-800">{student.admissionNo || '-'}</p>
                                </div>
                                <div className="space-y-1">
                                    <p className="text-slate-500 text-xs uppercase tracking-wider">Department</p>
                                    <p className="font-semibold text-slate-800">{student.dept}</p>
                                </div>
                                <div className="space-y-1">
                                    <p className="text-slate-500 text-xs uppercase tracking-wider">Class / Semester</p>
                                    <p className="font-semibold text-brand-blue">{student.class} / Sem {student.semester || '1'}</p>
                                </div>
                                <div className="space-y-1">
                                    <p className="text-slate-500 text-xs uppercase tracking-wider">Academic Year</p>
                                    <p className="font-semibold text-slate-800">{student.academicYear || '-'}</p>
                                </div>
                                {student.admissionDate && (
                                    <div className="space-y-1">
                                        <p className="text-slate-500 text-xs uppercase tracking-wider">Admission Date</p>
                                        <p className="font-semibold text-slate-800">{student.admissionDate}</p>
                                    </div>
                                )}
                            </div>
                        </Card>
                    </motion.div>
                )}

                {activeTab === 'fees' && (
                    <motion.div
                        key="fees"
                        initial={{ opacity: 0, y: 10, filter: "blur(8px)" }}
                        animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                        exit={{ opacity: 0, y: -10, filter: "blur(8px)" }}
                        transition={{ duration: 0.3 }}
                    >
                        <Card className={isClear ? "border-green-200 bg-green-50/50" : "border-red-200 bg-red-50/50"}>
                    <div className="flex justify-between items-center mb-6">
                        <div className="flex items-center gap-4">
                            <div className={`p-3 rounded-full ${isClear ? "bg-green-100 text-green-600" : "bg-red-100 text-red-600"}`}>
                                {isClear ? <CheckCircle size={24} /> : <AlertCircle size={24} />}
                            </div>
                            <h3 className="text-xl font-bold">Fee Details</h3>
                        </div>
                        <select
                            className="bg-white border border-slate-300 text-sm rounded-lg p-2 focus:ring-brand-blue focus:border-brand-blue"
                            value={selectedSem}
                            onChange={(e) => setSelectedSem(e.target.value)}
                        >
                            <option value="Current">Current Sem</option>
                            <option value="All">All Semesters</option>
                            {[1, 2, 3, 4, 5, 6].map(s => (
                                <option key={s} value={s}>Sem {s}</option>
                            ))}
                        </select>
                    </div>

                    {feeView ? (
                        <div className="space-y-4">
                            <h4 className="font-semibold text-slate-700 border-b border-slate-200 pb-2">{feeView.title}</h4>

                            {feeView.isHistory ? (
                                <div className="space-y-2">
                                    {feeView.details.map((d, i) => (
                                        <div key={i} className="flex justify-between items-center text-sm p-2 bg-white/50 rounded">
                                            <span>{d.desc || 'Fee Update'}</span>
                                            <span className="font-semibold">₹{d.total}</span>
                                        </div>
                                    ))}
                                    <div className="pt-2 flex justify-between items-center font-bold">
                                        <span>Total Demanded</span>
                                        <span>₹{feeView.total}</span>
                                    </div>
                                    <p className="text-xs text-slate-500 mt-2">* Payment history is tracked globally. Check receipts for details.</p>
                                </div>
                            ) : (
                                // Detailed Fee Breakdown (New Structure Support)
                                (student.feesObj?.semester || student.fees?.semester) ? (
                                    <div className="space-y-4">
                                        {/* Registration */}
                                        <div className="bg-blue-50/50 p-3 rounded-lg border border-blue-100">
                                            <div className="flex justify-between items-start mb-2">
                                                <div>
                                                    <h5 className="font-semibold text-blue-800 text-sm">Registration</h5>
                                                    {(student.feesObj?.registration?.billNo || student.fees?.registration?.billNo) && (
                                                        <p className="text-xs text-blue-600">
                                                            Bill: {student.feesObj?.registration?.billNo || student.fees?.registration?.billNo}
                                                            ({student.feesObj?.registration?.billDate || student.fees?.registration?.billDate})
                                                        </p>
                                                    )}
                                                </div>
                                                <span className="text-xs font-bold text-blue-700">₹{student.feesObj?.registration?.total || student.fees?.registration?.total || 0}</span>
                                            </div>
                                        </div>

                                        {/* Semesters */}
                                        {Object.entries(student.feesObj?.semester || student.fees?.semester || {}).map(([sem, data]) => (
                                            <div key={sem} className="bg-slate-50 p-3 rounded-lg border border-slate-200">
                                                <div className="flex justify-between items-start mb-2">
                                                    <div>
                                                        <h5 className="font-semibold text-slate-800 text-sm">{sem}</h5>
                                                        {data.billNo && (
                                                            <p className="text-xs text-slate-500">Bill: {data.billNo} ({data.billDate})</p>
                                                        )}
                                                    </div>
                                                    <div className="text-right">
                                                        <p className="text-xs font-bold text-slate-700">₹{data.total}</p>
                                                        <p className={`text-xs ${data.total - (data.payments?.reduce((s, p) => s + Number(p.amount), 0) || 0) > 0 ? 'text-red-500' : 'text-green-500'}`}>
                                                            Bal: ₹{data.total - (data.payments?.reduce((s, p) => s + Number(p.amount), 0) || 0)}
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}

                                        <div className="pt-2 border-t border-slate-200 mt-2 flex justify-between items-center bg-slate-100 p-2 rounded">
                                            <span className="font-bold text-slate-700">Total Due</span>
                                            <span className={`font-bold text-lg ${student.fees?.balance > 0 ? "text-red-600" : "text-green-600"}`}>
                                                ₹{student.fees?.balance?.toLocaleString()}
                                            </span>
                                        </div>
                                    </div>
                                ) : (
                                    <>
                                        {/* Detailed Breakdown (Legacy) */}
                                        <div className="space-y-4">
                                            {/* Tuition / College Fees */}
                                            <div className="bg-blue-50/50 p-3 rounded-lg border border-blue-100">
                                                <h5 className="font-semibold text-blue-800 mb-2 text-sm">College / Tuition Fees</h5>
                                                <div className="grid grid-cols-3 gap-2 text-sm">
                                                    <div>
                                                        <p className="text-slate-500 text-xs">Total</p>
                                                        <p className="font-medium text-slate-700">₹{Number(student.fees?.total || 0).toLocaleString()}</p>
                                                    </div>
                                                    <div>
                                                        <p className="text-slate-500 text-xs">Paid</p>
                                                        <p className="font-medium text-green-600">₹{Number(student.fees?.paid || 0).toLocaleString()}</p>
                                                    </div>
                                                    <div>
                                                        <p className="text-slate-500 text-xs">Balance</p>
                                                        <p className={`font-medium ${Number(student.fees?.balance || 0) > 0 ? 'text-red-600' : 'text-slate-400'}`}>
                                                            ₹{Number(student.fees?.balance || 0).toLocaleString()}
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Bus Fees */}
                                            {Number(student.fees?.busTotal) > 0 && (
                                                <div className="bg-blue-50/50 p-3 rounded-lg border border-blue-100">
                                                    <h5 className="font-semibold text-blue-800 mb-2 text-sm">Bus Fees</h5>
                                                    <div className="grid grid-cols-3 gap-2 text-sm">
                                                        <div>
                                                            <p className="text-slate-500 text-xs">Total</p>
                                                            <p className="font-medium text-slate-700">₹{Number(student.fees?.busTotal || 0).toLocaleString()}</p>
                                                        </div>
                                                        <div>
                                                            <p className="text-slate-500 text-xs">Paid</p>
                                                            <p className="font-medium text-green-600">₹{Number(student.fees?.busPaid || 0).toLocaleString()}</p>
                                                        </div>
                                                        <div>
                                                            <p className="text-slate-500 text-xs">Balance</p>
                                                            <p className={`font-medium ${Number(student.fees?.busBalance || 0) > 0 ? 'text-red-600' : 'text-slate-400'}`}>
                                                                ₹{Number(student.fees?.busBalance || 0).toLocaleString()}</p>
                                                        </div>
                                                    </div>
                                                </div>
                                            )}

                                            {/* Grand Total Summary */}
                                            <div className="pt-2 border-t border-slate-200 mt-2">
                                                <div className="flex justify-between items-center">
                                                    <span className="font-bold text-slate-700">Total Balance</span>
                                                    <span className={`font-bold text-lg ${isClear ? "text-green-600" : "text-red-600"}`}>
                                                        ₹{(Number(student.fees?.balance || 0) + Number(student.fees?.busBalance || 0)).toLocaleString()}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                        {feeView.note && <p className="text-xs text-slate-500 mt-2">{feeView.note}</p>}
                                    </>
                                )
                            )}
                        </div>
                    ) : (
                        <div className="p-8 text-center text-slate-500">
                            No fee records found for Semester {selectedSem}.
                        </div>
                    )}
                        </Card>
                    </motion.div>
                )}
                {activeTab === 'share' && (
                    <motion.div
                        key="share"
                        initial={{ opacity: 0, y: 10, filter: "blur(8px)" }}
                        animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                        exit={{ opacity: 0, y: -10, filter: "blur(8px)" }}
                        transition={{ duration: 0.3 }}
                    >
                        <Card className="p-6 space-y-6 flex flex-col items-center">
                            <div className="flex flex-col sm:flex-row justify-between items-center w-full border-b border-slate-100 pb-4 gap-4">
                                <div className="text-center sm:text-left">
                                    <h3 className="text-xl font-bold">Digital ID Card</h3>
                                    <p className="text-slate-500 text-sm">Download or share your student ID.</p>
                                </div>
                                <div className="flex gap-2">
                                    <Button 
                                        variant="outline" 
                                        size="sm" 
                                        onClick={downloadIdCardImage}
                                        isLoading={isDownloading}
                                    >
                                        <Download size={16} className="mr-2" /> Save Image
                                    </Button>
                                    <Button 
                                        variant="primary" 
                                        size="sm" 
                                        onClick={downloadIdCardPdf}
                                        isLoading={isDownloading}
                                    >
                                        <FileText size={16} className="mr-2" /> Save PDF
                                    </Button>
                                </div>
                            </div>

                            {/* ID Card Template */}
                            <div className="flex justify-center w-full p-4 overflow-hidden">
                                <div 
                                    ref={idCardRef}
                                    className="w-[340px] bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden relative no-gold"
                                >
                                    {/* Top Header */}
                                    <div className="bg-brand-blue p-4 flex items-center justify-center gap-3 relative overflow-hidden">
                                        <img src="/ksk-logo.jpg" alt="Logo" className="w-12 h-12 object-contain bg-white p-1 rounded-full relative z-10" />
                                        <div className="relative z-10 text-white text-center">
                                            <h4 className="font-bold text-[13px] leading-tight">KANCHI SHRI KRISHNA</h4>
                                            <p className="text-[9px] font-medium opacity-90 tracking-wide">COLLEGE OF ARTS AND SCIENCE</p>
                                        </div>
                                    </div>

                                    {/* Profile & QR Section */}
                                    <div className="flex flex-col p-6 relative bg-white">
                                        <div className="flex justify-between items-start w-full -mt-10 mb-4 relative z-20">
                                            {/* Profile Image */}
                                            <div className="w-24 h-28 rounded-md border-4 border-white shadow-lg overflow-hidden bg-slate-100">
                                                {student.photoUrl ? (
                                                    <img src={student.photoUrl} alt="Profile" className="w-full h-full object-cover" />
                                                ) : (
                                                    <div className="w-full h-full flex items-center justify-center text-3xl font-bold text-brand-blue bg-blue-50">
                                                        {student.name?.charAt(0).toUpperCase()}
                                                    </div>
                                                )}
                                            </div>
                                            
                                            {/* QR Code */}
                                            <div className="w-24 h-24 bg-white p-1.5 rounded-md border-2 border-white shadow-lg mt-2 flex items-center justify-center overflow-hidden no-gold">
                                                <img 
                                                    src={`https://api.qrserver.com/v1/create-qr-code/?size=120x120&data=${encodeURIComponent(`${window.location.origin}/id/${student.regno}`)}`}
                                                    alt="QR" 
                                                    className="w-full h-full object-contain no-gold"
                                                />
                                            </div>
                                        </div>
                                        
                                        <h2 className="text-xl font-extrabold text-slate-800 uppercase tracking-wide leading-tight mb-1">{student.name}</h2>
                                        <div className="bg-blue-50 px-3 py-1.5 rounded-xl inline-flex flex-col self-start mb-4 border border-blue-100/50">
                                            <span className="text-brand-blue font-bold text-[11px] tracking-wide leading-tight">
                                                {student.dept}
                                            </span>
                                            <span className="text-brand-blue/80 font-bold text-[9px] tracking-wider mt-0.5 uppercase">
                                                {student.year || '1st Year'} • {student.batch || '2026-2028'} Batch
                                            </span>
                                        </div>

                                        <div className="w-full space-y-2.5 text-[13px]">
                                            <div className="flex justify-between border-b border-slate-50 pb-1.5">
                                                <span className="text-slate-500 font-medium">Reg No</span>
                                                <span className="font-bold text-slate-800 tracking-wide">{student.regno}</span>
                                            </div>
                                            <div className="flex justify-between border-b border-slate-50 pb-1.5">
                                                <span className="text-slate-500 font-medium">DOB</span>
                                                <span className="font-bold text-slate-800">{student.dob || '-'}</span>
                                            </div>
                                            <div className="flex justify-between border-b border-slate-50 pb-1.5">
                                                <span className="text-slate-500 font-medium">Blood Group</span>
                                                <span className="font-bold text-red-600">{student.bloodGroup || '-'}</span>
                                            </div>
                                            <div className="flex justify-between border-b border-slate-50 pb-1.5">
                                                <span className="text-slate-500 font-medium">Phone No</span>
                                                <span className="font-bold text-slate-800">{student.phone || student.fatherName || '-'}</span>
                                            </div>
                                            <div className="flex justify-between pb-1 pt-1 text-[11px]">
                                                <span className="text-slate-500 font-medium whitespace-nowrap mr-3">Address</span>
                                                <span className="font-bold text-slate-800 text-right line-clamp-2 leading-tight">{student.address || student.city || 'Kanchipuram, Tamil Nadu'}</span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Bottom / Signature */}
                                    <div className="bg-slate-50 p-3 border-t border-slate-100 flex items-center justify-end">
                                        <div className="text-right">
                                            <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider mb-2">Authorized Signatory</p>
                                            <div className="w-20 h-[1px] bg-slate-300 ml-auto"></div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </Card>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default StudentDashboard;
