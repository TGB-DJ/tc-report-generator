import { useState, useEffect } from 'react';
import { doc, getDoc, collection, query, where, getDocs, orderBy, updateDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { useAuth } from '../../context/AuthContext';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import { useNavigate } from 'react-router-dom';
import { User, FileText, CheckCircle, AlertCircle, Eye, Bell, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const StudentDashboard = () => {
    const { user } = useAuth();
    const [student, setStudent] = useState(null);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        const fetchProfile = async () => {
            if (!user) return;
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

    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [isNotifOpen, setIsNotifOpen] = useState(false);
    const [selectedSem, setSelectedSem] = useState('Current');

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

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center bg-white p-4 rounded-xl shadow-sm border border-slate-100">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800">Student Dashboard</h1>
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
                                className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-xl shadow-2xl border border-slate-100 z-50 overflow-hidden"
                            >
                                <div className="p-4 border-b border-slate-50 bg-slate-50/50 flex justify-between items-center">
                                    <h3 className="font-bold text-slate-700">Notifications</h3>
                                    <button onClick={() => setIsNotifOpen(false)} className="text-slate-400 hover:text-slate-600">
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
                                                    className={`p-4 hover:bg-slate-50 transition-colors cursor-pointer group relative ${!notif.isRead ? 'bg-orange-50/30' : ''}`}
                                                >
                                                    <div className="flex justify-between items-start gap-3">
                                                        <div className="flex-1">
                                                            <div className="flex items-center gap-2 mb-1">
                                                                {!notif.isRead && (
                                                                    <span className="w-2 h-2 rounded-full bg-brand-orange"></span>
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
                <Card className="md:col-span-2">
                    <div className="flex items-start justify-between mb-6">
                        <div className="flex items-center gap-4">
                            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-brand-orange to-orange-600 flex items-center justify-center text-white text-2xl font-bold shadow-lg shadow-orange-500/20 overflow-hidden">
                                {student.photoUrl ? (
                                    <img src={student.photoUrl} alt="Profile" className="w-full h-full object-cover" />
                                ) : (
                                    student.name?.charAt(0)
                                )}
                            </div>
                            <div>
                                <h2 className="text-2xl font-bold text-slate-800">{student.name}</h2>
                                <p className="text-slate-500">{student.regno}</p>
                            </div>
                        </div>
                        <div className={`px-3 py-1 rounded-full text-sm font-medium ${student.fees?.balance === 0
                            ? "bg-green-100 text-green-700"
                            : "bg-red-100 text-red-700"
                            }`}>
                            {student.fees?.balance === 0 ? "Fees Cleared" : "Fees Pending"}
                        </div>
                    </div>
                    <div className="space-y-4">
                        <h3 className="text-xl font-bold border-t pt-4">Academic Profile</h3>
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
                                <p className="text-slate-500 text-xs uppercase tracking-wider">Student Name</p>
                                <p className="font-semibold text-slate-800">{student.name}</p>
                            </div>

                            <div className="space-y-1">
                                <p className="text-slate-500 text-xs uppercase tracking-wider">Department</p>
                                <p className="font-semibold text-slate-800">{student.dept}</p>
                            </div>
                            <div className="space-y-1">
                                <p className="text-slate-500 text-xs uppercase tracking-wider">Class / Semester</p>
                                <p className="font-semibold text-brand-orange">{student.class} / Sem {student.semester || '1'}</p>
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

                            <div className="space-y-1">
                                <p className="text-slate-500 text-xs uppercase tracking-wider">Father / Guardian</p>
                                <p className="font-semibold text-slate-800">{student.fatherName || '-'}</p>
                            </div>
                            <div className="space-y-1">
                                <p className="text-slate-500 text-xs uppercase tracking-wider">Contact Phone</p>
                                <p className="font-semibold text-slate-800">{student.phone || '-'}</p>
                            </div>
                            <div className="space-y-1">
                                <p className="text-slate-500 text-xs uppercase tracking-wider">Email</p>
                                <p className="font-semibold text-slate-800">{student.email || '-'}</p>
                            </div>

                            <div className="space-y-1">
                                <p className="text-slate-500 text-xs uppercase tracking-wider">Aadhar No</p>
                                <p className="font-semibold text-slate-800">{student.aadharNo || '-'}</p>
                            </div>
                            {student.panNo && (
                                <div className="space-y-1">
                                    <p className="text-slate-500 text-xs uppercase tracking-wider">PAN No</p>
                                    <p className="font-semibold text-slate-800">{student.panNo}</p>
                                </div>
                            )}
                            <div className="space-y-1">
                                <p className="text-slate-500 text-xs uppercase tracking-wider">Admission Date</p>
                                <p className="font-semibold text-slate-800">{student.admissionDate || '-'}</p>
                            </div>

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
                        </div>
                    </div>
                </Card>

                {/* Fee Status Card */}
                <Card className={isClear ? "border-green-200 bg-green-50/50" : "border-red-200 bg-red-50/50"}>
                    <div className="flex justify-between items-center mb-6">
                        <div className="flex items-center gap-4">
                            <div className={`p-3 rounded-full ${isClear ? "bg-green-100 text-green-600" : "bg-red-100 text-red-600"}`}>
                                {isClear ? <CheckCircle size={24} /> : <AlertCircle size={24} />}
                            </div>
                            <h3 className="text-xl font-bold">Fee Details</h3>
                        </div>
                        <select
                            className="bg-white border border-slate-300 text-sm rounded-lg p-2 focus:ring-brand-orange focus:border-brand-orange"
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
                                <>
                                    {/* Detailed Breakdown */}
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
                                        <div className="bg-orange-50/50 p-3 rounded-lg border border-orange-100">
                                            <h5 className="font-semibold text-orange-800 mb-2 text-sm">Bus Fees</h5>
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
                                                        ₹{Number(student.fees?.busBalance || 0).toLocaleString()}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Other Fees */}
                                        <div className="bg-purple-50/50 p-3 rounded-lg border border-purple-100">
                                            <h5 className="font-semibold text-purple-800 mb-2 text-sm">Other Fees</h5>
                                            <div className="flex justify-between items-center text-sm">
                                                <span className="text-slate-600">Total Paid</span>
                                                <span className="font-medium text-purple-700">₹{Number(student.fees?.otherPaid || 0).toLocaleString()}</span>
                                            </div>
                                        </div>

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
                            )}
                        </div>
                    ) : (
                        <div className="p-8 text-center text-slate-500">
                            No fee records found for Semester {selectedSem}.
                        </div>
                    )}



                </Card>
            </div >
        </div >
    );
};

export default StudentDashboard;
