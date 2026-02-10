import { useState, useEffect } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { useAuth } from '../../context/AuthContext';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import { useNavigate } from 'react-router-dom';
import { User, FileText, CheckCircle, AlertCircle } from 'lucide-react';
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

    const isClear = student.fees?.balance <= 0;

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
                        <div className="grid grid-cols-2 gap-4 text-sm">
                            <div>
                                <p className="text-slate-500">Register No</p>
                                <p className="font-semibold">{student.regno}</p>
                            </div>
                            <div>
                                <p className="text-slate-500">Department</p>
                                <p className="font-semibold">{student.dept}</p>
                            </div>
                            <div>
                                <p className="text-slate-500">Class</p>
                                <p className="font-semibold">{student.class}</p>
                            </div>
                            <div>
                                <p className="text-slate-500">Email</p>
                                <p className="font-semibold">{student.email}</p>
                            </div>
                        </div>
                    </div>
                </Card>

                {/* Fee Status Card */}
                <Card className={isClear ? "border-green-200 bg-green-50/50" : "border-red-200 bg-red-50/50"}>
                    <div className="flex items-center gap-4 mb-6">
                        <div className={`p-3 rounded-full ${isClear ? "bg-green-100 text-green-600" : "bg-red-100 text-red-600"}`}>
                            {isClear ? <CheckCircle size={24} /> : <AlertCircle size={24} />}
                        </div>
                        <h3 className="text-xl font-bold">Fee Status</h3>
                    </div>

                    <div className="space-y-4">
                        <div className="flex justify-between items-center p-3 bg-white rounded-lg shadow-sm">
                            <span className="text-slate-600">Total Fees</span>
                            <span className="font-bold">₹{student.fees?.total}</span>
                        </div>
                        <div className="flex justify-between items-center p-3 bg-white rounded-lg shadow-sm">
                            <span className="text-slate-600">Paid Amount</span>
                            <span className="font-bold text-green-600">₹{student.fees?.paid}</span>
                        </div>
                        <div className="flex justify-between items-center p-3 bg-white rounded-lg shadow-sm">
                            <span className="text-slate-600">Balance Due</span>
                            <span className={`font-bold ${isClear ? "text-green-600" : "text-red-600"}`}>
                                ₹{student.fees?.balance}
                            </span>
                        </div>

                        {/* Action Button */}
                        <div className="pt-4">
                            <Button
                                variant={isClear ? "primary" : "secondary"}
                                className="w-full gap-2"
                                onClick={() => navigate('/student/tc')}
                            >
                                <FileText size={18} />
                                {isClear ? "Generate Transfer Certificate" : "Check TC Eligibility"}
                            </Button>
                        </div>
                    </div>
                </Card>
            </div>
        </div>
    );
};

export default StudentDashboard;
