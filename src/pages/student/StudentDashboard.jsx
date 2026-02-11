import { useState, useEffect } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { useAuth } from '../../context/AuthContext';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import { useNavigate } from 'react-router-dom';
import { User, FileText, CheckCircle, AlertCircle, Eye } from 'lucide-react';
import { motion } from 'framer-motion';

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
        fetchProfile();
    }, [user]);

    if (loading) return <div className="p-10 text-center">Loading profile...</div>;
    if (!student) return <div className="p-10 text-center">Student profile not found. Contact Admin.</div>;

    const [selectedSem, setSelectedSem] = useState('Current');

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
            <div>
                <h1 className="text-3xl font-bold text-slate-800">Student Dashboard</h1>
                <p className="text-slate-500">Welcome, {student.name}</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Profile Card */}
                <Card>
                    <div className="flex items-center gap-4 mb-6">
                        <div className="p-3 rounded-full bg-blue-100 text-blue-600">
                            <User size={24} />
                        </div>
                        <h3 className="text-xl font-bold">Academic Profile</h3>
                    </div>
                    <div className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                            <div>
                                <p className="text-slate-500">Register No</p>
                                <p className="font-semibold">{student.regno}</p>
                            </div>
                            <div>
                                <p className="text-slate-500">Admission No</p>
                                <p className="font-semibold">{student.admissionNo || '-'}</p>
                            </div>
                            <div>
                                <p className="text-slate-500">Gender</p>
                                <p className="font-semibold">{student.gender || '-'}</p>
                            </div>
                            {/* ... existing fields ... */}
                            <div>
                                <p className="text-slate-500">Semester</p>
                                <p className="font-semibold text-brand-orange">Sem {student.semester || '1'}</p>
                            </div>
                            <div>
                                <p className="text-slate-500">Department</p>
                                <p className="font-semibold">{student.dept}</p>
                            </div>
                            {/* Shortened for brevity in replace */}
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
                                    <div className="flex justify-between items-center p-3 bg-white rounded-lg shadow-sm">
                                        <span className="text-slate-600">Total Fees</span>
                                        <span className="font-bold">₹{feeView.total}</span>
                                    </div>
                                    <div className="flex justify-between items-center p-3 bg-white rounded-lg shadow-sm">
                                        <span className="text-slate-600">Paid Amount</span>
                                        <span className="font-bold text-green-600">₹{feeView.paid}</span>
                                    </div>
                                    <div className="flex justify-between items-center p-3 bg-white rounded-lg shadow-sm">
                                        <span className="text-slate-600">Balance Due</span>
                                        <span className={`font-bold ${isClear ? "text-green-600" : "text-red-600"}`}>
                                            ₹{feeView.balance}
                                        </span>
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

                    {/* Action Button */}
                    <div className="pt-4">
                        <Button
                            variant={isClear ? "primary" : "secondary"}
                            className="w-full gap-2"
                            onClick={() => navigate('/student/tc')}
                        >
                            <Eye size={18} />
                            View TC Format
                        </Button>
                    </div>
            </div>
        </Card>
            </div >
        </div >
    );
};

export default StudentDashboard;
