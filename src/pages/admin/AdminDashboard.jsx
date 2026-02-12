import { useState, useEffect } from 'react';
import { collection, getDocs, setDoc, deleteDoc, doc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import { Users, GraduationCap, DollarSign, TrendingUp, UserPlus, FileText } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const StatCard = ({ title, value, icon: Icon, color }) => (
    <Card className="flex items-center gap-4">
        <div className={`p-3 rounded-xl ${color} text-white shadow-lg`}>
            <Icon size={24} />
        </div>
        <div>
            <p className="text-sm font-medium text-slate-500">{title}</p>
            <h3 className="text-2xl font-bold text-slate-800">{value}</h3>
        </div>
    </Card>
);

const AdminDashboard = () => {
    const navigate = useNavigate();
    const [stats, setStats] = useState({
        students: 0,
        teachers: 0,
        totalFees: 0,
        collectedFees: 0,
        pendingFees: 0
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchStats();
    }, []);

    const fetchStats = async () => {
        try {
            const studentsSnapshot = await getDocs(collection(db, "students"));
            const teachersSnapshot = await getDocs(collection(db, "teachers"));
            const adminsSnapshot = await getDocs(collection(db, "admins"));
            // Migration logic removed for stability


            let totalFees = 0;
            let collectedFees = 0;
            let activeStudentCount = 0;

            // Only count currently studying students (status === 'active' or no status field)
            studentsSnapshot.forEach(doc => {
                const data = doc.data();
                const isActive = data.status === 'active' || !data.status;

                if (isActive) {
                    activeStudentCount++;
                    totalFees += Number(data.fees?.total || 0);
                    collectedFees += Number(data.fees?.paid || 0);
                }
            });

            setStats({
                students: activeStudentCount,
                teachers: teachersSnapshot.size,
                totalFees,
                collectedFees,
                pendingFees: totalFees - collectedFees
            });
        } catch (error) {
            console.error("Error fetching stats:", error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) return <div className="p-10 text-center">Loading stats...</div>;

    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-3xl font-bold text-slate-800">Dashboard Overview</h1>
                <p className="text-slate-500">Welcome back, Admin</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard
                    title="Total Students"
                    value={stats.students}
                    icon={GraduationCap}
                    color="bg-blue-500"
                />
                <StatCard
                    title="Total Teachers"
                    value={stats.teachers}
                    icon={Users}
                    color="bg-purple-500"
                />
                <StatCard
                    title="Fees Collected"
                    value={`₹${stats.collectedFees.toLocaleString()}`}
                    icon={DollarSign}
                    color="bg-green-500"
                />
                <StatCard
                    title="Pending Fees"
                    value={`₹${stats.pendingFees.toLocaleString()}`}
                    icon={TrendingUp}
                    color="bg-orange-500"
                />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                    <h3 className="text-lg font-bold mb-4">Quick Actions</h3>
                    <div className="grid grid-cols-2 gap-4">
                        <Button variant="outline" onClick={() => navigate('/admin/students')} className="flex flex-col items-center p-4 h-auto gap-2 hover:bg-slate-50">
                            <GraduationCap size={24} className="text-blue-500" />
                            <span className="text-sm">Manage Students</span>
                        </Button>
                        <Button variant="outline" onClick={() => navigate('/admin/teachers')} className="flex flex-col items-center p-4 h-auto gap-2 hover:bg-slate-50">
                            <Users size={24} className="text-purple-500" />
                            <span className="text-sm">Manage Teachers</span>
                        </Button>
                    </div>
                </Card>
                {/* Recent Activity or Charts could go here */}
            </div>
        </div>
    );
};

export default AdminDashboard;
