import { useState, useEffect } from 'react';
import { collection, query, where, getDocs, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { useAuth } from '../../context/AuthContext';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Select from '../../components/Select';
import Toast from '../../components/ui/Toast';
import { Users, Save, CheckCircle, XCircle } from 'lucide-react';

const AttendanceMarker = () => {
    const { userData, user } = useAuth(); // userData contains teacher profile
    const [students, setStudents] = useState([]);
    const [loading, setLoading] = useState(false);
    const [submitLoading, setSubmitLoading] = useState(false);
    const [toast, setToast] = useState({ show: false, message: '', type: '' });

    // Config form
    const [config, setConfig] = useState({
        date: new Date().toISOString().split('T')[0],
        type: 'Daily', // Daily or Hourly
        period: '1', // 1-6
        class: '',
        dept: ''
    });

    const [attendanceData, setAttendanceData] = useState({});

    // Fetch students based on Class and Dept
    const fetchStudents = async () => {
        if (!config.class || !config.dept) {
            alert("Please select Class and Department first.");
            return;
        }

        setLoading(true);
        try {
            const q = query(
                collection(db, "students"),
                where("class", "==", config.class),
                where("dept", "==", config.dept)
            );
            const snapshot = await getDocs(q);
            let studentList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

            // Filter out inactive/alumni
            studentList = studentList.filter(s => (s.status === 'active' || !s.status) && s.class !== 'Alumni');

            // Sorting logic: Boys First (A-Z), Girls Second (A-Z)
            const boys = studentList.filter(s => s.gender?.toLowerCase() === 'male').sort((a, b) => a.name.localeCompare(b.name));
            const girls = studentList.filter(s => s.gender?.toLowerCase() === 'female').sort((a, b) => a.name.localeCompare(b.name));
            const unassigned = studentList.filter(s => !s.gender || (s.gender.toLowerCase() !== 'male' && s.gender.toLowerCase() !== 'female')).sort((a, b) => a.name.localeCompare(b.name));

            const sortedList = [...boys, ...girls, ...unassigned];

            setStudents(sortedList);
            
            // Initialize attendance states to 'Present'
            const initData = {};
            sortedList.forEach(s => {
                initData[s.id] = 'Present';
            });
            setAttendanceData(initData);

        } catch (error) {
            console.error("Error fetching students:", error);
            setToast({ show: true, message: 'Failed to fetch students.', type: 'error' });
        } finally {
            setLoading(false);
        }
    };

    const handleAttendanceChange = (studentId, status) => {
        setAttendanceData(prev => ({ ...prev, [studentId]: status }));
    };

    const handleSubmit = async () => {
        if (students.length === 0) return;
        setSubmitLoading(true);

        try {
            const attendanceRecord = {
                date: config.date,
                type: config.type,
                period: config.type === 'Hourly' ? config.period : 'All Day',
                class: config.class,
                dept: config.dept,
                markedBy: userData?.name || 'Unknown Teacher',
                markedById: user.uid,
                timestamp: serverTimestamp(),
                records: attendanceData // { studentId: 'Present'/'Absent' }
            };

            await addDoc(collection(db, "attendance"), attendanceRecord);

            setToast({ show: true, message: 'Attendance saved successfully.', type: 'success' });
            // Optionally clear students to prevent double submission
            setStudents([]);
        } catch (error) {
            console.error("Error saving attendance:", error);
            setToast({ show: true, message: 'Failed to save attendance.', type: 'error' });
        } finally {
            setSubmitLoading(false);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-bold text-slate-800">Mark Attendance</h1>
            </div>

            <Card>
                <div className="p-6">
                    <h3 className="font-semibold text-slate-700 mb-4 border-b pb-2">Configuration</h3>
                    <div className="grid grid-cols-1 md:grid-cols-5 gap-4 items-end">
                        <Input 
                            label="Date"
                            type="date"
                            value={config.date}
                            onChange={(e) => setConfig({ ...config, date: e.target.value })}
                        />
                        <Select 
                            label="Attendance Type"
                            options={['Daily', 'Hourly']}
                            value={config.type}
                            onChange={(e) => setConfig({ ...config, type: e.target.value })}
                        />
                        {config.type === 'Hourly' && (
                            <Select 
                                label="Period"
                                options={['1', '2', '3', '4', '5', '6']}
                                value={config.period}
                                onChange={(e) => setConfig({ ...config, period: e.target.value })}
                            />
                        )}
                        <Select 
                            label="Class/Year"
                            options={['1st Year', '2nd Year', '3rd Year']}
                            value={config.class}
                            onChange={(e) => setConfig({ ...config, class: e.target.value })}
                        />
                        {/* Simple placeholder for departments, a real app would map valid depts */}
                        <div className="mb-1">
                            <label className="block text-sm font-medium text-slate-700 mb-1">Department</label>
                            <input 
                                type="text"
                                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-blue outline-none"
                                placeholder="e.g. Computer Science"
                                value={config.dept}
                                onChange={(e) => setConfig({ ...config, dept: e.target.value })}
                            />
                        </div>
                    </div>
                    <div className="mt-4">
                        <Button onClick={fetchStudents} isLoading={loading}>
                            <Users className="mr-2" size={18} /> Fetch Students
                        </Button>
                    </div>
                </div>
            </Card>

            {students.length > 0 && (
                <Card>
                    <div className="p-6">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="font-semibold text-slate-700">Student List ({students.length} Total)</h3>
                            <button
                                onClick={() => {
                                    const allRef = { ...attendanceData };
                                    Object.keys(allRef).forEach(k => allRef[k] = 'Present');
                                    setAttendanceData(allRef);
                                }}
                                className="text-sm text-brand-blue hover:underline"
                            >
                                Mark All Present
                            </button>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="bg-slate-50 border-y border-slate-200">
                                        <th className="p-3 text-sm font-semibold text-slate-600 w-16">S.No</th>
                                        <th className="p-3 text-sm font-semibold text-slate-600">Reg No</th>
                                        <th className="p-3 text-sm font-semibold text-slate-600">Name</th>
                                        <th className="p-3 text-sm font-semibold text-slate-600">Gender</th>
                                        <th className="p-3 text-sm text-center font-semibold text-slate-600">Status</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {students.map((student, index) => (
                                        <tr key={student.id} className={`border-b border-slate-100 hover:bg-slate-50 ${attendanceData[student.id] === 'Absent' ? 'bg-red-50/50' : ''}`}>
                                            <td className="p-3 text-sm text-slate-500 font-medium">{index + 1}</td>
                                            <td className="p-3 text-sm">{student.regno}</td>
                                            <td className="p-3 font-medium text-slate-800">{student.name}</td>
                                            <td className="p-3 text-sm text-slate-500">{student.gender || 'N/A'}</td>
                                            <td className="p-3">
                                                <div className="flex justify-center gap-2">
                                                    <button
                                                        onClick={() => handleAttendanceChange(student.id, 'Present')}
                                                        className={`px-3 py-1 text-sm rounded-full font-medium transition-colors flex items-center gap-1 ${
                                                            attendanceData[student.id] === 'Present' 
                                                            ? 'bg-green-100 text-green-700 border border-green-200' 
                                                            : 'bg-white text-slate-500 border border-slate-200 hover:bg-slate-50'
                                                        }`}
                                                    >
                                                        <CheckCircle size={14} /> P
                                                    </button>
                                                    <button
                                                        onClick={() => handleAttendanceChange(student.id, 'Absent')}
                                                        className={`px-3 py-1 text-sm rounded-full font-medium transition-colors flex items-center gap-1 ${
                                                            attendanceData[student.id] === 'Absent' 
                                                            ? 'bg-red-100 text-red-700 border border-red-200' 
                                                            : 'bg-white text-slate-500 border border-slate-200 hover:bg-slate-50'
                                                        }`}
                                                    >
                                                        <XCircle size={14} /> A
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        <div className="mt-6 flex justify-end">
                            <Button onClick={handleSubmit} isLoading={submitLoading} className="px-8">
                                <Save className="mr-2" size={18} /> Save Attendance Record
                            </Button>
                        </div>
                    </div>
                </Card>
            )}

            {toast.show && (
                <Toast 
                    message={toast.message} 
                    type={toast.type} 
                    onClose={() => setToast({ ...toast, show: false })} 
                />
            )}
        </div>
    );
};

export default AttendanceMarker;
