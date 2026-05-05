import { useState, useEffect } from 'react';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Select from '../../components/Select';
import { DEPARTMENT_CATEGORIES } from '../../constants/departments';
import { COMMUNITIES } from '../../constants/studentData';
import { Loader2, Download } from 'lucide-react';

const Reports = () => {
    const [students, setStudents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('community'); // 'community' or 'fees'
    const [filterDept, setFilterDept] = useState('All');

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const q = query(collection(db, "students")); // Fetch all for aggregation
            const snapshot = await getDocs(q);
            const list = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setStudents(list);
        } catch (error) {
            console.error("Error fetching data:", error);
        } finally {
            setLoading(false);
        }
    };

    const getFilteredStudents = () => {
        if (filterDept === 'All') return students;
        return students.filter(s => s.dept === filterDept);
    };

    // --- Community Report Logic ---
    const generateCommunityReport = () => {
        const filtered = getFilteredStudents();
        const report = {};
        // Structure: stats[year/class] = { 'BC': { M: 0, F: 0 }, ... }

        const classes = ['1st Year', '2nd Year', '3rd Year'];
        const comms = [...COMMUNITIES, 'Other'];

        // Initialize structure
        classes.forEach(cls => {
            report[cls] = {};
            comms.forEach(c => {
                report[cls][c] = { M: 0, F: 0 };
            });
            report[cls]['Total'] = { M: 0, F: 0 }; // Row Total
        });

        filtered.forEach(student => {
            let cls = student.class || 'Unknown';
            // Normalize Class Names
            if (cls === 'I Year') cls = '1st Year';
            if (cls === 'II Year') cls = '2nd Year';
            if (cls === 'III Year') cls = '3rd Year';

            // Only map known classes or group others? stick to known for now or add dynamic keys if needed.
            if (!report[cls]) return; // Skip if not in our target classes (e.g. Alumni)

            const comm = student.community && comms.includes(student.community) ? student.community : 'Other';
            const gender = student.gender === 'Male' ? 'M' : student.gender === 'Female' ? 'F' : 'O';

            if (gender === 'M' || gender === 'F') {
                report[cls][comm][gender]++;
                report[cls]['Total'][gender]++;
            }
        });

        return { classes, comms, report };
    };

    // --- Fees Report Logic ---
    const generateFeesReport = () => {
        const filtered = getFilteredStudents();
        let totalDemanded = 0;
        let totalCollected = 0;
        let totalPending = 0;

        let pendingList = [];

        filtered.forEach(s => {
            // New structure feesObj
            const feeObj = s.feesObj || s.fees || {};
            // Handle both old and new structure if mixed data (fallback to top level total/paid if new structure missing)

            // Actually, s.fees should have the aggregates `total`, `paid`, `balance` if saved via new form.
            // If old data, it also has `total`, `paid`, `balance`.
            // So we can rely on s.fees.total etc. as the source of truth for "Total Outstanding" logic.

            const studTotal = Number(s.fees?.total) || 0;
            const studPaid = Number(s.fees?.paid) || 0;
            const studBal = Number(s.fees?.balance) || 0;

            // Also include Bus? New structure zeroes out bus in `fees` updates but we might want to track.
            // Let's rely on the aggregate fields I populated in handleSubmit: total, paid, balance (which includes ALL fees if I coded handleSubmit right).
            // Checking handleSubmit logic: grandTotal = regTotal + semTotal. It didn't explicitly include 'bus' from separate field unless 'semester' includes it.
            // Wait, old `fees` had `busTotal`. New structure effectively ignores `busTotal` field unless it's added to a "Semester".
            // For report, let's trust `s.fees.total` etc.

            totalDemanded += studTotal;
            totalCollected += studPaid;
            totalPending += studBal;

            if (studBal > 0) {
                // Try to find Invoice Number if available (e.g., from registration or latest semester)
                let billInfo = '';
                if (feeObj.registration?.billNo && feeObj.registration.balance > 0) billInfo += `Reg: ${feeObj.registration.billNo} `;
                // Add first pending semester bill?
                if (feeObj.semester) {
                    Object.entries(feeObj.semester).forEach(([sem, data]) => {
                        const bal = (Number(data.total) || 0) - (data.payments?.reduce((s, p) => s + Number(p.amount), 0) || 0);
                        if (bal > 0 && data.billNo) billInfo += `${sem}: ${data.billNo} `;
                    });
                }

                pendingList.push({
                    name: s.name,
                    regno: s.regno,
                    class: s.class,
                    dept: s.dept,
                    balance: studBal,
                    billInfo: billInfo.trim()
                });
            }
        });

        // Sort pending list by balance desc
        pendingList.sort((a, b) => b.balance - a.balance);

        return { totalDemanded, totalCollected, totalPending, pendingList };
    };

    if (loading) return <div className="p-10 text-center flex justify-center"><Loader2 className="animate-spin" /></div>;

    const commData = generateCommunityReport();
    const feeData = generateFeesReport();

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold text-slate-800">Reports</h1>
                <Select
                    value={filterDept}
                    onChange={(e) => setFilterDept(e.target.value)}
                    options={['All', ...Object.keys(DEPARTMENT_CATEGORIES).flatMap(k => DEPARTMENT_CATEGORIES[k])]}
                    className="w-64"
                />
            </div>

            <div className="flex gap-4 border-b border-slate-200">
                <button
                    onClick={() => setActiveTab('community')}
                    className={`pb-2 px-4 font-medium transition-colors ${activeTab === 'community' ? 'border-b-2 border-brand-blue text-brand-blue' : 'text-slate-500 hover:text-slate-700'}`}
                >
                    Community Report
                </button>
                <button
                    onClick={() => setActiveTab('fees')}
                    className={`pb-2 px-4 font-medium transition-colors ${activeTab === 'fees' ? 'border-b-2 border-brand-blue text-brand-blue' : 'text-slate-500 hover:text-slate-700'}`}
                >
                    Fees Report
                </button>
            </div>

            {activeTab === 'community' && (
                <Card className="overflow-hidden">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="font-bold text-lg">Student Strength (Community Wise)</h3>
                        <Button size="sm" variant="outline" onClick={() => window.print()}>
                            <Download size={16} className="mr-2" /> Print / PDF
                        </Button>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm border-collapse border border-slate-200">
                            <thead className="bg-slate-100 text-slate-700">
                                <tr>
                                    <th rowSpan="2" className="p-2 border border-slate-300">Class</th>
                                    {commData.comms.map(c => (
                                        <th key={c} colSpan="2" className="p-2 border border-slate-300 text-center">{c}</th>
                                    ))}
                                    <th colSpan="2" className="p-2 border border-slate-300 text-center bg-slate-200">Total</th>
                                </tr>
                                <tr>
                                    {commData.comms.map(c => (
                                        <React.Fragment key={c + '-h'}>
                                            <th className="p-1 border border-slate-300 w-10 text-center font-normal">M</th>
                                            <th className="p-1 border border-slate-300 w-10 text-center font-normal">F</th>
                                        </React.Fragment>
                                    ))}
                                    <th className="p-1 border border-slate-300 w-12 text-center bg-slate-50">M</th>
                                    <th className="p-1 border border-slate-300 w-12 text-center bg-slate-50">F</th>
                                </tr>
                            </thead>
                            <tbody>
                                {commData.classes.map(cls => (
                                    <tr key={cls} className="hover:bg-slate-50">
                                        <td className="p-2 border border-slate-300 font-medium">{cls}</td>
                                        {commData.comms.map(c => (
                                            <React.Fragment key={c + '-' + cls}>
                                                <td className="p-2 border border-slate-300 text-center text-slate-600">
                                                    {commData.report[cls]?.[c]?.M || '-'}
                                                </td>
                                                <td className="p-2 border border-slate-300 text-center text-slate-600">
                                                    {commData.report[cls]?.[c]?.F || '-'}
                                                </td>
                                            </React.Fragment>
                                        ))}
                                        <td className="p-2 border border-slate-300 text-center font-bold bg-slate-50">
                                            {commData.report[cls]?.Total.M}
                                        </td>
                                        <td className="p-2 border border-slate-300 text-center font-bold bg-slate-50">
                                            {commData.report[cls]?.Total.F}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </Card>
            )}

            {activeTab === 'fees' && (
                <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <Card className="bg-blue-50 border-blue-100">
                            <p className="text-sm text-blue-600 font-medium">Total Demanded</p>
                            <h3 className="text-2xl font-bold text-blue-900">₹{feeData.totalDemanded.toLocaleString()}</h3>
                        </Card>
                        <Card className="bg-green-50 border-green-100">
                            <p className="text-sm text-green-600 font-medium">Total Collected</p>
                            <h3 className="text-2xl font-bold text-green-900">₹{feeData.totalCollected.toLocaleString()}</h3>
                        </Card>
                        <Card className="bg-red-50 border-red-100">
                            <p className="text-sm text-red-600 font-medium">Total Pending</p>
                            <h3 className="text-2xl font-bold text-red-900">₹{feeData.totalPending.toLocaleString()}</h3>
                        </Card>
                    </div>

                    <Card>
                        <h3 className="font-bold text-lg mb-4">Pending Dues List</h3>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead className="bg-slate-50 text-slate-600 text-sm">
                                    <tr>
                                        <th className="p-3">Name</th>
                                        <th className="p-3">Register No</th>
                                        <th className="p-3">Dept / Class</th>
                                        <th className="p-3 text-right">Balance Amount</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {feeData.pendingList.slice(0, 50).map((s, i) => (
                                        <tr key={i} className="hover:bg-slate-50">
                                            <td className="p-3 font-medium">{s.name}</td>
                                            <td className="p-3 text-slate-500">
                                                {s.regno}
                                                {s.billInfo && <div className="text-xs text-slate-400 mt-1">{s.billInfo}</div>}
                                            </td>
                                            <td className="p-3 text-slate-500">{s.dept} - {s.class}</td>
                                            <td className="p-3 text-right font-bold text-red-600">₹{s.balance.toLocaleString()}</td>
                                        </tr>
                                    ))}
                                    {feeData.pendingList.length === 0 && (
                                        <tr><td colSpan="4" className="p-6 text-center text-slate-400">No pending dues found.</td></tr>
                                    )}
                                </tbody>
                            </table>
                            {feeData.pendingList.length > 50 && (
                                <div className="p-3 text-center text-sm text-slate-500">
                                    Showing top 50 pending records.
                                </div>
                            )}
                        </div>
                    </Card>
                </div>
            )}
        </div>
    );
};

export default Reports;
