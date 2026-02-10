import { useState, useEffect } from 'react';
import { collection, getDocs, deleteDoc, doc, updateDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { useAuth } from '../../context/AuthContext';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Select from '../../components/Select';
import FeePaymentInput from '../../components/FeePaymentInput';
import Toast from '../../components/ui/Toast';
import YearBadge from '../../components/YearBadge';
import { Trash2, Plus, Filter, X, Pencil } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import { DEPARTMENT_CATEGORIES, getYearOptions } from '../../constants/departments';

const ManageStudents = () => {
    // Data State
    const [students, setStudents] = useState([]);
    const [filteredStudents, setFilteredStudents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [formLoading, setFormLoading] = useState(false);
    const { createUser } = useAuth();

    // Filters State
    const [filters, setFilters] = useState({
        dept: '',
        class: '',
        academicYear: ''
    });

    // Form Error & Success State
    const [formError, setFormError] = useState('');
    const [successMessage, setSuccessMessage] = useState('');

    // Unique Values for Filters
    const [uniqueValues, setUniqueValues] = useState({
        depts: [],
        classes: [],
        years: []
    });

    // Edit Modal State
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [editingStudent, setEditingStudent] = useState(null);
    const [editFormData, setEditFormData] = useState({
        email: '',
        phone: '',
        password: ''
    });

    // Form State
    const [formData, setFormData] = useState({
        firstName: '', // Split Name
        lastName: '',  // Split Name
        name: '',      // Legacy/DB field (auto-generated)
        email: '',
        phone: '',
        password: '',
        regno: '',
        nmId: '', // Naan Mudhalvan ID
        dept: '',
        class: '',
        // TC Required Fields
        fatherName: '',
        nationality: 'INDIAN',
        religion: '',
        community: '',
        dob: '',
        admissionDate: '',
        academicYear: '2025-2026',
        promotion: 'REFER MARK LIST',
        conduct: 'GOOD',
        leavingDate: '',
        // Fee Payments
        feePayments: [], // Tuition
        busPayments: [], // Bus (Multi-bill)
        otherPayments: [], // Other (with description)
        feesTotal: '',   // Total Tuition Fee
        feesBusTotal: '', // Total Bus Fee
        feesPaid: '', // Legacy/Calc
        feesBus: '' // Legacy/Calc
    });

    useEffect(() => {
        fetchStudents();
    }, []);

    const fetchStudents = async () => {
        try {
            const querySnapshot = await getDocs(collection(db, "students"));
            const studentsList = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setStudents(studentsList);
            setFilteredStudents(studentsList);

            // Extract unique values for filters
            const depts = [...new Set(studentsList.map(s => s.dept).filter(Boolean))];
            const classes = [...new Set(studentsList.map(s => s.class).filter(Boolean))];
            const years = [...new Set(studentsList.map(s => s.academicYear).filter(Boolean))];

            setUniqueValues({ depts, classes, years });
        } catch (error) {
            console.error("Error fetching students:", error);
        } finally {
            setLoading(false);
        }
    };

    // Filter Logic
    useEffect(() => {
        let result = students;

        if (filters.dept) {
            result = result.filter(s => s.dept === filters.dept);
        }
        if (filters.class) {
            result = result.filter(s => s.class === filters.class);
        }
        if (filters.academicYear) {
            result = result.filter(s => s.academicYear === filters.academicYear);
        }

        setFilteredStudents(result);
    }, [filters, students]);

    const handleFilterChange = (key, value) => {
        setFilters(prev => ({ ...prev, [key]: value }));
    };

    const clearFilters = () => {
        setFilters({ dept: '', class: '', academicYear: '' });
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setFormLoading(true);
        setFormError('');

        try {
            // Common Data Preparation
            // 1. Tuition
            const paidTuition = formData.feePayments.reduce((sum, p) => sum + (Number(p.amount) || 0), 0);
            const totalTuition = Number(formData.feesTotal) || paidTuition;
            const balanceTuition = totalTuition - paidTuition;

            // 2. Bus
            const paidBus = formData.busPayments.reduce((sum, p) => sum + (Number(p.amount) || 0), 0);
            const totalBus = Number(formData.feesBusTotal) || paidBus;
            const balanceBus = totalBus - paidBus;

            // 3. Other
            const paidOther = formData.otherPayments.reduce((sum, p) => sum + (Number(p.amount) || 0), 0);
            // "Total" for other is just what's paid since it's ad-hoc usually, or we can assume paid = total for now unless field added
            const totalOther = paidOther;
            const balanceOther = 0;

            // Grand Totals
            const grandTotal = totalTuition + totalBus + totalOther;
            const grandPaid = paidTuition + paidBus + paidOther;
            const grandBalance = balanceTuition + balanceBus + balanceOther;



            // Combine Name
            const fullName = `${formData.firstName} ${formData.lastName}`.trim();

            const studentData = {
                name: fullName,
                firstName: formData.firstName, // Save separately too for future proofing
                lastName: formData.lastName,   // Save separately too for future proofing
                phone: formData.phone,
                phone: formData.phone,
                regno: formData.regno,
                nmId: formData.nmId,
                dept: formData.dept,
                class: formData.class,
                fatherName: formData.fatherName,
                nationality: formData.nationality,
                religion: formData.religion,
                community: formData.community,
                dob: formData.dob,
                admissionDate: formData.admissionDate,
                academicYear: formData.academicYear,
                promotion: formData.promotion,
                conduct: formData.conduct,
                leavingDate: formData.leavingDate || null,
                status: 'active',

                // Detailed Payments
                feePayments: formData.feePayments,   // Tuition history
                busPayments: formData.busPayments,   // Bus history
                otherPayments: formData.otherPayments, // Other history

                fees: {
                    // Tuition
                    totalTuition,
                    paidTuition,
                    balanceTuition,

                    // Bus
                    totalBus,
                    paidBus,
                    balanceBus,

                    // Other
                    paidOther,

                    // Grand Totals (for easy display)
                    total: grandTotal,
                    paid: grandPaid,
                    balance: grandBalance
                }
            };

            if (editingStudent) {
                // UPDATE Logic
                console.log('Updating student:', editingStudent.id);

                // Only include password if provided
                if (formData.password) {
                    // Note: Updating password directly in Firestore user doc won't change Auth password
                    // You'd need a cloud function or Admin SDK for that.
                    // For now, we update the student record. 
                    // To strictly update auth password, we need a separate flow or re-auth.
                    // Assuming this app updates the 'users' collection which might be used for login lookup?
                    // Actual Auth password change requires 'updatePassword' from firebase/auth which needs user login.
                    // Admin changing another user's password usually requires Admin SDK.
                    // We'll skip Auth password update here to avoid complexity unless requested.
                }

                await updateDoc(doc(db, "students", editingStudent.id), {
                    ...studentData,
                    email: formData.email, // Ensure email is synced
                    password: formData.password // Update stored password
                });

                // Update 'users' collection too if needed
                await updateDoc(doc(db, "users", editingStudent.id), {
                    email: formData.email,
                    phone: formData.phone,
                    name: fullName // Sync full name
                });

                setSuccessMessage(`Successfully updated student: ${fullName}`);
            } else {
                // CREATE Logic
                console.log('Creating new student...');
                await createUser(formData.email, formData.password, 'student', studentData);
                setSuccessMessage(`Successfully added student: ${fullName}`);
            }

            setIsModalOpen(false);
            resetForm();
            fetchStudents();
        } catch (error) {
            console.error('Error saving student:', error);
            setFormError(error.message);
        } finally {
            setFormLoading(false);
        }
    };

    const resetForm = () => {
        setEditingStudent(null);
        setFormData({
            firstName: '', lastName: '', name: '', email: '', phone: '', password: '', regno: '', nmId: '',
            dept: '', class: '', fatherName: '', nationality: 'INDIAN',
            religion: '', community: '', dob: '', admissionDate: '',
            academicYear: '2025-2026', promotion: 'REFER MARK LIST', conduct: 'GOOD',
            leavingDate: '',
            feePayments: [], busPayments: [], otherPayments: [],
            feesTotal: '', feesBusTotal: '', feesPaid: '', feesBus: ''
        });
    };

    const handleDelete = async (id, studentName) => {
        // Enhanced confirmation dialog
        const confirmMessage = `⚠️ WARNING: Are you sure you want to delete student "${studentName}"?\n\nThis action CANNOT be undone!\n\nClick OK to permanently delete this student.`;

        if (!window.confirm(confirmMessage)) return;

        try {
            await deleteDoc(doc(db, "students", id));
            await deleteDoc(doc(db, "users", id)); // Also delete from users mapping
            setStudents(prev => prev.filter(s => s.id !== id));
            setFilteredStudents(prev => prev.filter(s => s.id !== id));

            // Show success message
            setSuccessMessage(`Successfully deleted student: ${studentName}`);
            setTimeout(() => setSuccessMessage(''), 3000);
        } catch (error) {
            console.error("Error deleting student:", error);
            alert("Error deleting student: " + error.message);
        }
    };

    const handleEdit = (student) => {
        setEditingStudent(student);

        // Split existing name if firstName/lastName missing
        const parts = (student.name || '').split(' ');
        const fName = student.firstName || parts[0] || '';
        const lName = student.lastName || parts.slice(1).join(' ') || '';

        setFormData({
            firstName: fName,
            lastName: lName,
            name: student.name || '',
            email: student.email || '',
            phone: student.phone || '',
            password: student.password || '', // Pre-fill if available
            regno: student.regno || '',
            nmId: student.nmId || '',
            dept: student.dept || '',
            class: student.class || '',
            fatherName: student.fatherName || '',
            nationality: student.nationality || 'INDIAN',
            religion: student.religion || '',
            community: student.community || '',
            dob: student.dob || '',
            admissionDate: student.admissionDate || '',
            academicYear: student.academicYear || '',
            promotion: student.promotion || '',
            conduct: student.conduct || '',
            leavingDate: student.leavingDate || '',
            // Ensure feePayments is an array
            feePayments: student.feePayments || [],
            busPayments: student.busPayments || [],
            otherPayments: student.otherPayments || [],

            feesTotal: student.fees?.totalTuition || student.fees?.total || '',
            feesBusTotal: student.fees?.totalBus || '',

            feesPaid: student.fees?.paid || '', // Legacy
            feesBus: student.fees?.bus || ''    // Legacy
        });
        setIsModalOpen(true);
    };



    return (
        <div className="space-y-6">
            {/* Success Toast */}
            {successMessage && (
                <Toast
                    message={successMessage}
                    type="success"
                    onClose={() => setSuccessMessage('')}
                />
            )}

            <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-slate-800">Manage Students</h2>
                <Button onClick={() => setIsModalOpen(true)}>
                    <Plus size={20} /> Add Student
                </Button>
            </div>

            {/* Filters Section */}
            <Card className="p-4 bg-white/50 backdrop-blur-sm">
                <div className="flex flex-wrap items-end gap-4">
                    <div className="flex-1 min-w-[200px]">
                        <label className="text-sm font-medium text-slate-600 mb-1 block">Department</label>
                        <select
                            className="w-full p-2 rounded-lg border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-brand-orange/20"
                            value={filters.dept}
                            onChange={(e) => handleFilterChange('dept', e.target.value)}
                        >
                            <option value="">All Departments</option>
                            {uniqueValues.depts.map(d => <option key={d} value={d}>{d}</option>)}
                        </select>
                    </div>

                    <div className="flex-1 min-w-[200px]">
                        <label className="text-sm font-medium text-slate-600 mb-1 block">Class</label>
                        <select
                            className="w-full p-2 rounded-lg border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-brand-orange/20"
                            value={filters.class}
                            onChange={(e) => handleFilterChange('class', e.target.value)}
                        >
                            <option value="">All Classes</option>
                            {uniqueValues.classes.map(c => <option key={c} value={c}>{c}</option>)}
                        </select>
                    </div>

                    <div className="flex-1 min-w-[200px]">
                        <label className="text-sm font-medium text-slate-600 mb-1 block">Batch (Year)</label>
                        <select
                            className="w-full p-2 rounded-lg border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-brand-orange/20"
                            value={filters.academicYear}
                            onChange={(e) => handleFilterChange('academicYear', e.target.value)}
                        >
                            <option value="">All Batches</option>
                            {uniqueValues.years.map(y => <option key={y} value={y}>{y}</option>)}
                        </select>
                    </div>

                    {(filters.dept || filters.class || filters.academicYear) && (
                        <button
                            onClick={clearFilters}
                            className="p-2 text-slate-500 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors mb-[2px]"
                            title="Clear Filters"
                        >
                            <X size={20} />
                        </button>
                    )}
                </div>
            </Card>

            <Card className="overflow-hidden p-0">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-slate-50 border-b border-slate-100">
                            <tr>
                                <th className="p-4 font-semibold text-slate-600">Reg No</th>
                                <th className="p-4 font-semibold text-slate-600">Name</th>
                                <th className="p-4 font-semibold text-slate-600">Phone</th>
                                <th className="p-4 font-semibold text-slate-600">Department</th>
                                <th className="p-4 font-semibold text-slate-600">Balance</th>
                                <th className="p-4 font-semibold text-slate-600">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr><td colSpan="6" className="p-8 text-center">Loading...</td></tr>
                            ) : students.length === 0 ? (
                                <tr><td colSpan="6" className="p-8 text-center text-slate-500">No students found. Add one to get started.</td></tr>
                            ) : filteredStudents.length === 0 ? (
                                <tr><td colSpan="6" className="p-8 text-center text-slate-500">No students match the selected filters.</td></tr>
                            ) : (
                                filteredStudents.map((student) => (
                                    <tr key={student.id} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors">
                                        <td className="p-4">{student.regno}</td>
                                        <td className="p-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-brand-orange to-orange-600 flex items-center justify-center text-white font-bold text-sm">
                                                    {student.name?.charAt(0).toUpperCase()}
                                                </div>
                                                <span className="font-medium">{student.name}</span>
                                            </div>
                                        </td>
                                        <td className="p-4 text-slate-500">{student.phone || "-"}</td>
                                        <td className="p-4">{student.dept}</td>
                                        <td className={`p-4 font-medium ${student.fees?.balance > 0 ? 'text-red-500' : 'text-green-500'}`}>
                                            ₹{student.fees?.balance}
                                        </td>
                                        <td className="p-4 flex gap-2">
                                            <button
                                                onClick={() => handleEdit(student)}
                                                className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                                title={`Edit ${student.name}`}
                                            >
                                                <Pencil size={18} />
                                            </button>
                                            <button
                                                onClick={() => handleDelete(student.id, student.name)}
                                                className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                                title={`Delete ${student.name}`}
                                            >
                                                <Trash2 size={18} />
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </Card >

            <AnimatePresence>
                {isModalOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto flex flex-col"
                        >
                            <div className="p-6 border-b border-slate-100 flex justify-between items-center">
                                <h3 className="text-xl font-bold">{editingStudent ? 'Edit Student' : 'Add New Student'}</h3>
                                <button onClick={() => { setIsModalOpen(false); resetForm(); }} className="text-slate-400 hover:text-slate-600">×</button>
                            </div>

                            <form onSubmit={handleSubmit} className="p-6 space-y-4" autoComplete="off">
                                {formError && (
                                    <div className="p-3 rounded-lg bg-red-50 text-red-600 text-sm border border-red-200">
                                        {formError}
                                    </div>
                                )}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <Input name="firstName" label="First Name" value={formData.firstName} onChange={handleInputChange} required autoComplete="off" />
                                    <Input name="lastName" label="Last Name" value={formData.lastName} onChange={handleInputChange} required autoComplete="off" />
                                    <Input name="fatherName" label="Father's Name / Guardian" value={formData.fatherName} onChange={handleInputChange} required autoComplete="off" />
                                    <Input name="regno" label="Register No" value={formData.regno} onChange={handleInputChange} required autoComplete="off" />
                                    <Input name="nmId" label="NM ID (Naan Mudhalvan)" value={formData.nmId} onChange={handleInputChange} autoComplete="off" />
                                    <Input name="phone" label="Phone Number" value={formData.phone} onChange={handleInputChange} required autoComplete="off" />
                                    <Input name="email" label="Email" type="email" value={formData.email} onChange={handleInputChange} required autoComplete="off" />
                                    <Input
                                        name="password"
                                        label={editingStudent ? "New Password (Optional)" : "Password"}
                                        type="password"
                                        value={formData.password}
                                        onChange={handleInputChange}
                                        required={!editingStudent}
                                        autoComplete="new-password"
                                        placeholder={editingStudent ? "Leave blank to keep current" : "Required"}
                                    />
                                    <Input name="nationality" label="Nationality" value={formData.nationality} onChange={handleInputChange} required autoComplete="off" />
                                    <Input name="religion" label="Religion" value={formData.religion} onChange={handleInputChange} required autoComplete="off" />
                                    <Input name="community" label="Community" value={formData.community} onChange={handleInputChange} autoComplete="off" />
                                    <Select
                                        name="dept"
                                        label="Department"
                                        value={formData.dept}
                                        onChange={handleInputChange}
                                        groupedOptions={DEPARTMENT_CATEGORIES}
                                        required
                                    />
                                    <Select
                                        name="class"
                                        label="Year/Class"
                                        value={formData.class}
                                        onChange={handleInputChange}
                                        options={formData.dept ? getYearOptions(formData.dept) : ['1st Year', '2nd Year', '3rd Year']}
                                        required
                                    />

                                </div>

                                <h4 className="font-semibold text-slate-700 pt-4">TC Details</h4>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <Input name="dob" label="Date of Birth" type="date" value={formData.dob} onChange={handleInputChange} required autoComplete="off" />
                                    <Input name="admissionDate" label="Date of Admission" type="date" value={formData.admissionDate} onChange={handleInputChange} required autoComplete="off" />
                                    <Input name="academicYear" label="Academic Year" value={formData.academicYear} onChange={handleInputChange} required autoComplete="off" />
                                    <Input name="promotion" label="Promotion Status" value={formData.promotion} onChange={handleInputChange} required autoComplete="off" />
                                    <Input name="conduct" label="Conduct" value={formData.conduct} onChange={handleInputChange} required autoComplete="off" />
                                    <Input name="leavingDate" label="Leaving Date (Optional)" type="date" value={formData.leavingDate} onChange={handleInputChange} autoComplete="off" />
                                </div>

                                <h4 className="font-semibold text-slate-700 pt-4">Fee Details</h4>
                                <div className="space-y-6">
                                    {/* Tuition Fees */}
                                    <div className="space-y-4 p-4 border border-blue-100 rounded-xl bg-blue-50/50">
                                        <Input
                                            name="feesTotal"
                                            label="Total Tuition Fees (₹)"
                                            type="number"
                                            value={formData.feesTotal}
                                            onChange={handleInputChange}
                                            required
                                            autoComplete="off"
                                            placeholder="e.g., 30000"
                                            className="bg-white"
                                        />
                                        <FeePaymentInput
                                            title="Tuition Fee Payments"
                                            payments={formData.feePayments}
                                            onChange={(payments) => setFormData(prev => ({ ...prev, feePayments: payments }))}
                                        />
                                    </div>

                                    {/* Bus Fees */}
                                    <div className="space-y-4 p-4 border border-orange-100 rounded-xl bg-orange-50/50">
                                        <Input
                                            name="feesBusTotal"
                                            label="Total Bus Fees (₹)"
                                            type="number"
                                            value={formData.feesBusTotal}
                                            onChange={handleInputChange}
                                            autoComplete="off"
                                            placeholder="e.g., 15000"
                                            className="bg-white"
                                        />
                                        <FeePaymentInput
                                            title="Bus Fee Payments"
                                            payments={formData.busPayments}
                                            onChange={(payments) => setFormData(prev => ({ ...prev, busPayments: payments }))}
                                        />
                                    </div>

                                    {/* Other Fees */}
                                    <div className="space-y-4 p-4 border border-purple-100 rounded-xl bg-purple-50/50">
                                        <h5 className="font-medium text-purple-900">Other Fees (Lab, Exam, etc.)</h5>
                                        <FeePaymentInput
                                            title="Other Fee Payments"
                                            payments={formData.otherPayments}
                                            onChange={(payments) => setFormData(prev => ({ ...prev, otherPayments: payments }))}
                                            showDescription={true}
                                        />
                                    </div>
                                </div>

                                <div className="pt-6 flex justify-end gap-3">
                                    <Button type="button" variant="ghost" onClick={() => { setIsModalOpen(false); resetForm(); }}>Cancel</Button>
                                    <Button type="submit" isLoading={formLoading}>
                                        {editingStudent ? 'Update Student' : 'Create Student'}
                                    </Button>
                                </div>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence >


        </div >
    );
};

export default ManageStudents;
