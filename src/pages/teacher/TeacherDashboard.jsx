import { useState, useEffect } from 'react';
import { collection, query, where, getDocs, doc, getDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { updateDoc } from 'firebase/firestore'; // Added updateDoc
import { useAuth } from '../../context/AuthContext';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button'; // Added
import Input from '../../components/ui/Input'; // Added
import Toast from '../../components/ui/Toast'; // Added
import Select from '../../components/Select';
import { Users, Filter, Pencil, X, Printer } from 'lucide-react'; // Added Pencil, X
import { AnimatePresence, motion } from 'framer-motion'; // Added
import BulkTCPrintModal from '../../components/BulkTCPrintModal';

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

                    // Get all students
                    const querySnapshot = await getDocs(collection(db, "students"));
                    const studentsList = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
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

    // Apply filters based on selected option
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
                <div className="flex gap-2">
                    <button
                        onClick={() => setFeeStatus('unpaid')}
                        className="relative p-2 mr-2 text-slate-600 hover:text-brand-orange transition-colors"
                        title="View Students with Pending Fees"
                    >
                        <div className="relative">
                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-bell"><path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" /><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" /></svg>
                            {allStudents.filter(s => {
                                // Filter by dept first
                                const isMyDept = teacherProfile?.dept ? s.dept?.includes(teacherProfile.dept.split('(')[0].trim()) : true;
                                return isMyDept && (s.fees?.balance > 0);
                            }).length > 0 && (
                                    <span className="absolute -top-2 -right-2 bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full animate-bounce">
                                        {allStudents.filter(s => {
                                            const isMyDept = teacherProfile?.dept ? s.dept?.includes(teacherProfile.dept.split('(')[0].trim()) : true;
                                            return isMyDept && (s.fees?.balance > 0);
                                        }).length}
                                    </span>
                                )}
                        </div>
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
            <Card>
                <div className="p-6">
                    <div className="flex items-center gap-2 mb-4">
                        <Filter size={20} className="text-brand-orange" />
                        <h3 className="font-semibold text-slate-700">Filter Students</h3>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                        <div className="md:col-span-2">
                            <Input
                                label="Search Student"
                                placeholder="Search by Name or Register Number..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>
                    </div>
                    <p className="text-sm text-slate-500 mt-3">
                        Showing {filteredStudents.length} students
                    </p>
                </div>
            </Card>

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
                                <p className="text-3xl font-bold text-brand-orange mt-1">{filteredStudents.length}</p>
                            </div>
                            <div className="p-3 bg-brand-orange/10 rounded-xl">
                                <Users className="text-brand-orange" size={24} />
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
                                                className="rounded border-slate-300 text-brand-orange focus:ring-brand-orange"
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
                                                        className="rounded border-slate-300 text-brand-orange focus:ring-brand-orange"
                                                    />
                                                </td>
                                                <td className="py-3 px-4 text-sm">
                                                    <button
                                                        onClick={() => setViewingStudent(student)}
                                                        className="font-medium text-slate-900 hover:text-brand-orange hover:underline text-left"
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
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
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
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
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
                                    <h4 className="font-semibold text-brand-orange mb-3 border-b border-orange-100 pb-2">Personal Details</h4>
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
                                    <h4 className="font-semibold text-brand-orange mb-3 border-b border-orange-100 pb-2">Academic Details</h4>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                                        <div><span className="text-slate-500 block">Admission Date</span> <span className="font-medium">{viewingStudent.admissionDate || '-'}</span></div>
                                        <div><span className="text-slate-500 block">Academic Year</span> <span className="font-medium">{viewingStudent.academicYear || '-'}</span></div>
                                        <div><span className="text-slate-500 block">Promotion Status</span> <span className="font-medium">{viewingStudent.promotion || '-'}</span></div>
                                        <div><span className="text-slate-500 block">Conduct</span> <span className="font-medium">{viewingStudent.conduct || '-'}</span></div>
                                    </div>
                                </div>

                                {/* Fee Details */}
                                <div>
                                    <h4 className="font-semibold text-brand-orange mb-3 border-b border-orange-100 pb-2">Fee Status</h4>
                                    <div className="bg-slate-50 p-4 rounded-xl grid grid-cols-1 md:grid-cols-3 gap-4 text-center mb-4">
                                        <div>
                                            <span className="text-slate-500 text-xs uppercase tracking-wider">Total Fees</span>
                                            <p className="text-lg font-bold text-slate-800">₹{Number(viewingStudent.fees?.total || 0).toLocaleString()}</p>
                                        </div>
                                        <div>
                                            <span className="text-slate-500 text-xs uppercase tracking-wider">Paid</span>
                                            <p className="text-lg font-bold text-green-600">₹{Number(viewingStudent.fees?.paid || 0).toLocaleString()}</p>
                                        </div>
                                        <div>
                                            <span className="text-slate-500 text-xs uppercase tracking-wider">Balance</span>
                                            <p className={`text-lg font-bold ${Number(viewingStudent.fees?.balance || 0) > 0 ? 'text-red-600' : 'text-slate-400'}`}>
                                                ₹{Number(viewingStudent.fees?.balance || 0).toLocaleString()}
                                            </p>
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
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
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
                                    <div className="w-24 h-24 rounded-full bg-brand-orange/10 flex items-center justify-center text-brand-orange text-3xl font-bold mb-3">
                                        {teacherProfile.name?.charAt(0).toUpperCase()}
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
