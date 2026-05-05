import { useState, useEffect, useMemo } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import Card from '../../components/ui/Card';
import { Users, GraduationCap, DollarSign, TrendingUp } from 'lucide-react';

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

// Simple bar chart component (no external library needed)
const BarChart = ({ data, title, colorFn }) => {
    const maxVal = Math.max(...data.map(d => d.value), 1);
    return (
        <Card>
            <h3 className="text-lg font-bold mb-4 text-slate-800">{title}</h3>
            <div className="space-y-3">
                {data.map((item, i) => (
                    <div key={i}>
                        <div className="flex justify-between text-sm mb-1">
                            <span className="text-slate-600 font-medium truncate mr-2">{item.label}</span>
                            <span className="font-bold text-slate-800">{item.value}</span>
                        </div>
                        <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden">
                            <div
                                className={`h-3 rounded-full transition-all duration-500 ${colorFn ? colorFn(i) : 'bg-brand-blue'}`}
                                style={{ width: `${(item.value / maxVal) * 100}%` }}
                            />
                        </div>
                    </div>
                ))}
                {data.length === 0 && <p className="text-slate-400 text-sm text-center py-4">No data available</p>}
            </div>
        </Card>
    );
};

// Donut chart component
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
                        {/* Background circle */}
                        <circle cx="80" cy="80" r="60" fill="none" stroke="#e2e8f0" strokeWidth="20" />
                        {/* Boys arc */}
                        <circle
                            cx="80" cy="80" r="60" fill="none"
                            stroke="#3b82f6" strokeWidth="20"
                            strokeDasharray={`${boysArc} ${circumference}`}
                            strokeDashoffset="0"
                            transform="rotate(-90 80 80)"
                            className="transition-all duration-700"
                        />
                        {/* Girls arc */}
                        <circle
                            cx="80" cy="80" r="60" fill="none"
                            stroke="#ec4899" strokeWidth="20"
                            strokeDasharray={`${girlsArc} ${circumference}`}
                            strokeDashoffset={`${-boysArc}`}
                            transform="rotate(-90 80 80)"
                            className="transition-all duration-700"
                        />
                        <text x="80" y="75" textAnchor="middle" className="text-2xl font-bold fill-slate-800">{total}</text>
                        <text x="80" y="95" textAnchor="middle" className="text-xs fill-slate-500">Total</text>
                    </svg>
                </div>
                <div className="space-y-3">
                    <div className="flex items-center gap-2">
                        <span className="w-4 h-4 rounded-full bg-blue-500"></span>
                        <span className="text-sm text-slate-600">Boys</span>
                        <span className="font-bold text-slate-800 ml-auto">{boys}</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="w-4 h-4 rounded-full bg-pink-500"></span>
                        <span className="text-sm text-slate-600">Girls</span>
                        <span className="font-bold text-slate-800 ml-auto">{girls}</span>
                    </div>
                </div>
            </div>
        </Card>
    );
};

const AdminDashboard = () => {
    const [students, setStudents] = useState([]);
    const [stats, setStats] = useState({
        students: 0,
        teachers: 0,
        totalFees: 0,
        collectedFees: 0,
        pendingFees: 0
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const studentsSnapshot = await getDocs(collection(db, "students"));
            const teachersSnapshot = await getDocs(collection(db, "teachers"));

            const studentList = [];
            let totalFees = 0;
            let collectedFees = 0;
            let activeStudentCount = 0;

            studentsSnapshot.forEach(doc => {
                const data = { id: doc.id, ...doc.data() };
                studentList.push(data);
                const isActive = data.status === 'active' || !data.status;

                if (isActive && data.class !== 'Alumni') {
                    activeStudentCount++;
                    totalFees += Number(data.fees?.total || 0);
                    collectedFees += Number(data.fees?.paid || 0);
                }
            });

            setStudents(studentList);
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

    // Compute analytics from students
    const analytics = useMemo(() => {
        const activeStudents = students.filter(s => s.class !== 'Alumni' && (s.status === 'active' || !s.status));

        // Gender counts
        const boys = activeStudents.filter(s => s.gender?.toLowerCase() === 'male').length;
        const girls = activeStudents.filter(s => s.gender?.toLowerCase() === 'female').length;

        // Department-wise breakdown
        const deptMap = {};
        activeStudents.forEach(s => {
            const dept = s.dept || 'Unknown';
            if (!deptMap[dept]) deptMap[dept] = { boys: 0, girls: 0, total: 0 };
            deptMap[dept].total++;
            if (s.gender?.toLowerCase() === 'male') deptMap[dept].boys++;
            else if (s.gender?.toLowerCase() === 'female') deptMap[dept].girls++;
        });

        const deptData = Object.entries(deptMap)
            .map(([label, counts]) => ({ label, value: counts.total, boys: counts.boys, girls: counts.girls }))
            .sort((a, b) => b.value - a.value);

        // Class-wise breakdown
        const classMap = {};
        activeStudents.forEach(s => {
            const cls = s.class || 'Unknown';
            if (!classMap[cls]) classMap[cls] = { boys: 0, girls: 0, total: 0 };
            classMap[cls].total++;
            if (s.gender?.toLowerCase() === 'male') classMap[cls].boys++;
            else if (s.gender?.toLowerCase() === 'female') classMap[cls].girls++;
        });

        const classData = Object.entries(classMap)
            .map(([label, counts]) => ({ label, value: counts.total, boys: counts.boys, girls: counts.girls }))
            .sort((a, b) => a.label.localeCompare(b.label));

        return { boys, girls, deptData, classData };
    }, [students]);

    const barColors = ['bg-blue-500', 'bg-purple-500', 'bg-green-500', 'bg-amber-500', 'bg-rose-500', 'bg-cyan-500', 'bg-indigo-500', 'bg-teal-500', 'bg-orange-500', 'bg-sky-500'];

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
                    color="bg-red-500"
                />
            </div>

            {/* Gender Analytics */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <DonutChart
                    boys={analytics.boys}
                    girls={analytics.girls}
                    title="Students — Boys vs Girls"
                />

                <BarChart
                    title="Students by Class / Year"
                    data={analytics.classData}
                    colorFn={(i) => barColors[i % barColors.length]}
                />
            </div>

            {/* Department-wise Analytics */}
            <div className="grid grid-cols-1 gap-6">
                <Card>
                    <h3 className="text-lg font-bold mb-4 text-slate-800">Department-wise Student Breakdown</h3>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm">
                            <thead className="bg-slate-50 border-b border-slate-100">
                                <tr>
                                    <th className="p-3 font-semibold text-slate-600">Department</th>
                                    <th className="p-3 font-semibold text-blue-600 text-center">Boys</th>
                                    <th className="p-3 font-semibold text-pink-600 text-center">Girls</th>
                                    <th className="p-3 font-semibold text-slate-600 text-center">Total</th>
                                    <th className="p-3 font-semibold text-slate-600">Distribution</th>
                                </tr>
                            </thead>
                            <tbody>
                                {analytics.deptData.map((dept, i) => {
                                    const maxTotal = Math.max(...analytics.deptData.map(d => d.value), 1);
                                    const boysWidth = dept.value > 0 ? (dept.boys / dept.value) * 100 : 0;
                                    return (
                                        <tr key={i} className="border-b border-slate-50 hover:bg-slate-50/50">
                                            <td className="p-3 font-medium text-slate-800">{dept.label}</td>
                                            <td className="p-3 text-center text-blue-600 font-bold">{dept.boys}</td>
                                            <td className="p-3 text-center text-pink-600 font-bold">{dept.girls}</td>
                                            <td className="p-3 text-center font-bold">{dept.value}</td>
                                            <td className="p-3">
                                                <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden" style={{ minWidth: '100px' }}>
                                                    <div className="h-full flex rounded-full overflow-hidden" style={{ width: `${(dept.value / maxTotal) * 100}%` }}>
                                                        <div className="bg-blue-500 h-full" style={{ width: `${boysWidth}%` }} />
                                                        <div className="bg-pink-500 h-full" style={{ width: `${100 - boysWidth}%` }} />
                                                    </div>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                                {analytics.deptData.length === 0 && (
                                    <tr><td colSpan="5" className="p-6 text-center text-slate-400">No data available</td></tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </Card>
            </div>
        </div>
    );
};

export default AdminDashboard;
