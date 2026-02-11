import { useState, useEffect } from 'react';
import { collection, addDoc, getDocs, updateDoc, deleteDoc, doc, query, where, writeBatch } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '../../lib/firebase';
import { useAuth } from '../../context/AuthContext';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Select from '../../components/Select';
import FeePaymentInput from '../../components/FeePaymentInput';
import Toast from '../../components/ui/Toast';
import { Trash2, Plus, Filter, X, Pencil, Printer } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import { DEPARTMENT_CATEGORIES, getYearOptions } from '../../constants/departments';
import BulkTCPrintModal from '../../components/BulkTCPrintModal';

const ManageStudents = () => {
    // Data State
    const [students, setStudents] = useState([]);
    const [filteredStudents, setFilteredStudents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [formLoading, setFormLoading] = useState(false);
    const { createUser } = useAuth(); // Assuming createUser is exposed in AuthContext for admin actions

    // Filters State
    const [filters, setFilters] = useState({
        dept: '',
        class: '',
        academicYear: ''
    });

    // Form Error & Success State
    const [formError, setFormError] = useState('');
    const [successMessage, setSuccessMessage] = useState('');

    // Bulk Print State
    const [selectedStudents, setSelectedStudents] = useState([]);
    const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);
    const [printStudentIds, setPrintStudentIds] = useState([]);

    // Edit Modal State
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingStudent, setEditingStudent] = useState(null);
    const [photoFile, setPhotoFile] = useState(null); // NEW: File state

    // Bulk Actions State
    const [isPromoteModalOpen, setIsPromoteModalOpen] = useState(false);
    const [isFeeModalOpen, setIsFeeModalOpen] = useState(false);
    const [bulkAmount, setBulkAmount] = useState({ tuition: '', bus: '' });
    const [promoteConfirm, setPromoteConfirm] = useState('');

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
        semester: '', // NEW
        // TC Required Fields
        fatherName: '',
        nationality: 'INDIAN',
        religion: '',
        community: '', // REMOVED DUPLICATE NATIONALITY/RELIGION
        gender: '',      // NEW
        admissionNo: '', // NEW
        aadharNo: '',    // NEW
        panNo: '',       // NEW
        otherInfo: '',   // NEW
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
            setLoading(true);
            const querySnapshot = await getDocs(collection(db, "students"));
            const studentsList = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setStudents(studentsList);
            setFilteredStudents(studentsList); // Initialize filtered list
        } catch (error) {
            console.error("Error fetching students:", error);
        } finally {
            setLoading(false);
        }
    };

    // Filter Logic
    useEffect(() => {
        let result = [...students];

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


    // Handlers
    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    // NEW: Handle File Selection
    const handleFileChange = (e) => {
        if (e.target.files[0]) {
            setPhotoFile(e.target.files[0]);
        }
    };

    const resetForm = () => {
        setFormData({
            firstName: '', lastName: '', name: '', email: '', phone: '', password: '',
            regno: '', nmId: '', dept: '', class: '', semester: '',
            fatherName: '', nationality: 'INDIAN', religion: '', community: '', gender: '', admissionNo: '', aadharNo: '', panNo: '', otherInfo: '',
            dob: '', admissionDate: '',
            academicYear: '2025-2026', promotion: 'REFER MARK LIST', conduct: 'GOOD', leavingDate: '',
            feePayments: [], busPayments: [], otherPayments: [], feesTotal: '', feesBusTotal: '', feesPaid: '', feesBus: ''
        });
        setPhotoFile(null);
        setEditingStudent(null);
        setFormError('');
    };

    const handleEdit = (student) => {
        setEditingStudent(student);
        setPhotoFile(null); // Reset file
        setFormData({
            firstName: student.firstName || '',
            lastName: student.lastName || '',
            name: student.name || '',
            email: student.email || '',
            phone: student.phone || '',
            password: student.password || '',
            regno: student.regno || '',
            nmId: student.nmId || '',
            dept: student.dept || '',
            class: student.class || '',
            semester: student.semester || '',
            fatherName: student.fatherName || '',
            nationality: student.nationality || 'INDIAN',
            religion: student.religion || '',
            community: student.community || '',
            gender: student.gender || '',
            admissionNo: student.admissionNo || '',
            aadharNo: student.aadharNo || '',
            panNo: student.panNo || '',
            otherInfo: student.otherInfo || '',
            dob: student.dob || '',
            admissionDate: student.admissionDate || '',
            academicYear: student.academicYear || '2025-2026',
            promotion: student.promotion || 'REFER MARK LIST',
            conduct: student.conduct || 'GOOD',
            leavingDate: student.leavingDate || '',
            feePayments: student.fees?.payments || [],
            busPayments: student.fees?.busPayments || [],
            otherPayments: student.fees?.otherPayments || [],
            feesTotal: student.fees?.total || '',
            feesBusTotal: student.fees?.busTotal || '',
            feesPaid: student.fees?.paid || '',
            feesBus: student.fees?.busPaid || ''
        });
        setIsModalOpen(true);
    };

    const handleDelete = async (id, name) => {
        if (!window.confirm(`Are you sure you want to delete ${name}? This cannot be undone.`)) return;
        try {
            await deleteDoc(doc(db, "students", id));
            // Attempt to delete user auth linkage if possible, or just the doc
            await deleteDoc(doc(db, "users", id));

            setStudents(prev => prev.filter(s => s.id !== id));
            setSuccessMessage(`Deleted ${name} successfully.`);
            setTimeout(() => setSuccessMessage(''), 3000);
        } catch (error) {
            console.error("Error deleting student:", error);
            alert("Failed to delete student.");
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setFormLoading(true);
        setFormError('');

        try {
            const fullName = `${formData.firstName} ${formData.lastName}`.trim();

            // Calculate Fees
            const tuitionPaid = formData.feePayments.reduce((sum, p) => sum + (Number(p.amount) || 0), 0);
            const busPaid = formData.busPayments.reduce((sum, p) => sum + (Number(p.amount) || 0), 0);
            const otherPaid = formData.otherPayments.reduce((sum, p) => sum + (Number(p.amount) || 0), 0);

            // Base Student Data
            let passwordToUse = formData.password;
            if (!passwordToUse && formData.dob) {
                // Default Password: DD-MM-YYYY
                passwordToUse = formData.dob.split('-').reverse().join('-');
            }

            const studentData = {
                firstName: formData.firstName,
                lastName: formData.lastName,
                name: fullName,
                email: formData.email,
                phone: formData.phone,
                regno: formData.regno,
                nmId: formData.nmId,
                dept: formData.dept,
                class: formData.class,
                semester: formData.semester,
                fatherName: formData.fatherName,
                nationality: formData.nationality,
                religion: formData.religion,
                community: formData.community,
                gender: formData.gender,
                admissionNo: formData.admissionNo,
                aadharNo: formData.aadharNo,
                panNo: formData.panNo,
                otherInfo: formData.otherInfo,
                dob: formData.dob,
                admissionDate: formData.admissionDate,
                academicYear: formData.academicYear,
                promotion: formData.promotion,
                conduct: formData.conduct,
                leavingDate: formData.leavingDate,
                fees: {
                    total: Number(formData.feesTotal) || 0,
                    paid: tuitionPaid,
                    balance: (Number(formData.feesTotal) || 0) - tuitionPaid,
                    busTotal: Number(formData.feesBusTotal) || 0,
                    busPaid: busPaid,
                    busBalance: (Number(formData.feesBusTotal) || 0) - busPaid,
                    otherPaid: otherPaid,
                    payments: formData.feePayments,
                    busPayments: formData.busPayments,
                    otherPayments: formData.otherPayments
                },
                password: passwordToUse // Store password for admin visibility
            };

            let docId;

            if (editingStudent) {
                const studentRef = doc(db, "students", editingStudent.id);
                await updateDoc(studentRef, studentData);

                // Update User Mapping if email/phone changed
                const userRef = doc(db, "users", editingStudent.id);
                await updateDoc(userRef, {
                    name: studentData.name,
                    email: studentData.email,
                    phone: studentData.phone,
                    // Only update password in users collection if provided? 
                    // Ideally auth update happens via cloud function or client SDK re-auth, but here we just update the doc.
                });

                setSuccessMessage("Student updated successfully.");
            } else {
                // Create
                // Use computed password (either entered or default DOB)
                if (!passwordToUse) throw new Error("Password is required (or DOB for default).");

                await createUser(formData.email, passwordToUse, 'student', studentData);
                setSuccessMessage("Student created successfully.");
            }

            setIsModalOpen(false);
            resetForm();
            fetchStudents();
            setTimeout(() => setSuccessMessage(''), 3000);

        } catch (error) {
            console.error("Error saving student:", error);
            setFormError(error.message || "Failed to save student.");
        } finally {
            setFormLoading(false);
        }
    };

    // Bulk Actions
    const handleSelectAll = (e) => {
        if (e.target.checked) {
            setSelectedStudents(filteredStudents.map(s => s.id));
        } else {
            setSelectedStudents([]);
        }
    };

    const handleSelectStudent = (id) => {
        setSelectedStudents(prev => {
            if (prev.includes(id)) {
                return prev.filter(sid => sid !== id);
            } else {
                return [...prev, id];
            }
        });
    };

    const handleBulkPrint = () => {
        if (selectedStudents.length === 0) {
            alert("Please select at least one student to print TC.");
            return;
        }
        setPrintStudentIds(selectedStudents);
        setIsPrintModalOpen(true);
    };

    const handleSinglePrint = (id) => {
        setPrintStudentIds([id]);
        setIsPrintModalOpen(true);
    };

    // --- Bulk Operations ---

    const handlePromoteBatch = async () => {
        if (promoteConfirm !== 'CONFIRM') return;

        setFormLoading(true);
        try {
            const batchStudents = filteredStudents; // Students in current filter (or all if no filter)
            if (batchStudents.length === 0) throw new Error("No students to promote.");

            const updates = batchStudents.map(student => {
                let currentSem = Number(student.semester) || 0;
                let currentClass = student.class;

                // Logic: If no semester, infer from class (Assume start of year)
                if (currentSem === 0) {
                    if (currentClass === '1st Year') currentSem = 1;
                    else if (currentClass === '2nd Year') currentSem = 3;
                    else if (currentClass === '3rd Year') currentSem = 5;
                }

                // Promote to next semester
                let newSem = currentSem + 1;
                let newClass = currentClass;

                // Define Class based on New Semester
                if (newSem === 1 || newSem === 2) newClass = '1st Year';
                else if (newSem === 3 || newSem === 4) newClass = '2nd Year';
                else if (newSem === 5 || newSem === 6) newClass = '3rd Year';
                else if (newSem > 6) newClass = 'Alumni';

                return updateDoc(doc(db, "students", student.id), {
                    class: newClass,
                    semester: newSem.toString()
                });
            });

            await Promise.all(updates);
            setSuccessMessage(`Promoted ${updates.length} students successfully.`);
            setIsPromoteModalOpen(false);
            setPromoteConfirm('');
            fetchStudents(); // Refresh
        } catch (error) {
            console.error("Promotion failed:", error);
            alert("Promotion failed: " + error.message);
        } finally {
            setFormLoading(false);
        }
    };

    const handleBulkFeeUpdate = async () => {
        if (!filters.dept || !filters.class) {
            alert("Please select both Department and Class filters to update fees.");
            return;
        }

        const tuitionAdd = Number(bulkAmount.tuition) || 0;
        const busAdd = Number(bulkAmount.bus) || 0;

        if (tuitionAdd === 0 && busAdd === 0) {
            alert("Please enter an amount to add.");
            return;
        }

        setFormLoading(true);
        try {
            const batchStudents = filteredStudents;
            if (batchStudents.length === 0) throw new Error("No students found in this batch.");

            const updates = batchStudents.map(student => {
                const currentFees = student.fees || {};
                const newTotal = (Number(currentFees.total) || 0) + tuitionAdd;
                const newBalance = (Number(currentFees.balance) || 0) + tuitionAdd;

                const newBusTotal = (Number(currentFees.busTotal) || 0) + busAdd;
                // Only increase bus balance if they already use the bus? 
                // Or assume everyone in the batch gets the hike?
                // Safety: Only add bus fee if they have existing bus fee or logic implies it.
                // For simplified "Semester Switch", we assume the admin knows who they filtered.
                const newBusBalance = (Number(currentFees.busBalance) || 0) + busAdd;



                // Create Fee History Record
                const newHistory = {
                    date: new Date().toISOString(),
                    semester: currentSem.toString() || 'Unknown',
                    tuition: tuitionAdd,
                    bus: busAdd,
                    total: tuitionAdd + busAdd,
                    desc: `Semester ${currentSem} Fee Update`
                };

                const currentHistory = currentFees.history || [];

                return updateDoc(doc(db, "students", student.id), {
                    fees: {
                        ...currentFees,
                        total: newTotal,
                        balance: newBalance,
                        busTotal: newBusTotal,
                        busBalance: newBusBalance,
                        history: [...currentHistory, newHistory] // Append new record
                    }
                });
            });

            await Promise.all(updates);
            setSuccessMessage(`Updated fees for ${updates.length} students.`);
            setIsFeeModalOpen(false);
            setBulkAmount({ tuition: '', bus: '' });
            fetchStudents();
        } catch (error) {
            console.error("Fee update failed:", error);
            alert("Fee update failed: " + error.message);
        } finally {
            setFormLoading(false);
        }
    };

    // Helper to check if all filtered students are selected
    const isAllSelected = filteredStudents.length > 0 && filteredStudents.every(s => selectedStudents.includes(s.id));


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
                <div className="flex gap-2">
                    {selectedStudents.length > 0 && (
                        <Button onClick={handleBulkPrint} variant="secondary">
                            <Printer size={20} className="mr-2" />
                            Print TC ({selectedStudents.length})
                        </Button>
                    )}
                    <Button onClick={() => { resetForm(); setIsModalOpen(true); }}>
                        <Plus size={20} /> Add Student
                    </Button>
                </div>
            </div>

            {/* Filter Section */}
            <Card className="p-4">
                <div className="flex items-center gap-2 mb-3 text-slate-600">
                    <Filter size={18} />
                    <span className="font-medium">Filters</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Select
                        label="Department"
                        value={filters.dept}
                        onChange={(e) => setFilters(prev => ({ ...prev, dept: e.target.value }))}
                        groupedOptions={DEPARTMENT_CATEGORIES}
                    />
                    <Select
                        label="Class/Year"
                        value={filters.class}
                        onChange={(e) => setFilters(prev => ({ ...prev, class: e.target.value }))}
                        options={['1st Year', '2nd Year', '3rd Year']} // Simplified for filter
                    />
                    {/* Add more filters if needed */}
                </div>

                {/* Bulk Actions Toolbar (Visible only when filters active) */}
                <div className="mt-4 flex gap-3 border-t border-slate-100 pt-3">
                    <Button
                        variant="secondary"
                        onClick={() => {
                            setIsPromoteModalOpen(true);
                        }}
                        disabled={filteredStudents.length === 0}
                    >
                        Switch to Next Sem
                    </Button>
                    <Button
                        variant="secondary"
                        onClick={() => {
                            if (!filters.dept || !filters.class) return alert("Select Department and Class.");
                            setIsFeeModalOpen(true);
                        }}
                        disabled={!filters.dept || !filters.class || filteredStudents.length === 0}
                    >
                        Update Fees
                    </Button>
                </div>
            </Card>

            <Card className="overflow-hidden p-0">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-slate-50 border-b border-slate-100">
                            <tr>
                                <th className="p-4 w-10">
                                    <input
                                        type="checkbox"
                                        checked={isAllSelected}
                                        onChange={handleSelectAll}
                                        className="rounded border-slate-300 text-brand-orange focus:ring-brand-orange"
                                    />
                                </th>
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
                                <tr><td colSpan="7" className="p-8 text-center">Loading...</td></tr>
                            ) : students.length === 0 ? (
                                <tr><td colSpan="7" className="p-8 text-center text-slate-500">No students found. Add one to get started.</td></tr>
                            ) : filteredStudents.length === 0 ? (
                                <tr><td colSpan="7" className="p-8 text-center text-slate-500">No students match the selected filters.</td></tr>
                            ) : (
                                filteredStudents.map((student) => (
                                    <tr key={student.id} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors">
                                        <td className="p-4">
                                            <input
                                                type="checkbox"
                                                checked={selectedStudents.includes(student.id)}
                                                onChange={() => handleSelectStudent(student.id)}
                                                className="rounded border-slate-300 text-brand-orange focus:ring-brand-orange"
                                            />
                                        </td>
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
                                            ₹{student.fees?.balance || 0}
                                        </td>
                                        <td className="p-4 flex gap-2">
                                            <button
                                                onClick={() => handleSinglePrint(student.id)}
                                                className="p-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                                                title={`Print TC for ${student.name}`}
                                            >
                                                <Printer size={18} />
                                            </button>
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
            </Card>

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
                                    {/* NEW: Profile Picture Input */}
                                    <div className="md:col-span-2">
                                        <label className="block text-sm font-medium text-slate-700 mb-1">Profile Picture</label>
                                        <div className="flex items-center gap-4">
                                            {editingStudent?.photoUrl && (
                                                <img
                                                    src={editingStudent.photoUrl}
                                                    alt="Current Profile"
                                                    className="w-12 h-12 rounded-full object-cover border border-slate-200"
                                                />
                                            )}
                                            <input
                                                type="file"
                                                accept="image/*"
                                                onChange={handleFileChange}
                                                className="block w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-orange-50 file:text-brand-orange hover:file:bg-orange-100"
                                            />
                                        </div>
                                        <p className="text-xs text-slate-400 mt-1">Upload a square image (JPG/PNG). It will be synced with the user profile.</p>
                                    </div>

                                    <Input name="firstName" label="First Name" value={formData.firstName} onChange={handleInputChange} required autoComplete="off" />
                                    <Input name="lastName" label="Last Name" value={formData.lastName} onChange={handleInputChange} required autoComplete="off" />
                                    <Input name="fatherName" label="Father's Name / Guardian" value={formData.fatherName} onChange={handleInputChange} required autoComplete="off" />
                                    <Input name="regno" label="Register No" value={formData.regno} onChange={handleInputChange} required autoComplete="off" />
                                    <Input name="admissionNo" label="Admission No" value={formData.admissionNo} onChange={handleInputChange} required autoComplete="off" />
                                    <Input name="nmId" label="NM ID (Naan Mudhalvan)" value={formData.nmId} onChange={handleInputChange} autoComplete="off" />
                                    <Input name="phone" label="Phone Number" value={formData.phone} onChange={handleInputChange} required autoComplete="off" />
                                    <Input name="email" label="Email" type="email" value={formData.email} onChange={handleInputChange} required autoComplete="off" />
                                    <Input
                                        name="password"
                                        label={editingStudent ? "Password (leave blank to keep current)" : "Password"}
                                        type="text"
                                        value={formData.password}
                                        onChange={handleInputChange}
                                        required={!editingStudent}
                                        autoComplete="new-password"
                                        placeholder={editingStudent ? "Leave blank to keep current" : "Required"}
                                    />
                                    <Input name="nationality" label="Nationality" value={formData.nationality} onChange={handleInputChange} required autoComplete="off" />
                                    <Select
                                        name="gender"
                                        label="Gender"
                                        value={formData.gender}
                                        onChange={handleInputChange}
                                        options={['Male', 'Female', 'Other']}
                                        required
                                    />
                                    <Input name="religion" label="Religion" value={formData.religion} onChange={handleInputChange} required autoComplete="off" />
                                    <Input name="community" label="Community" value={formData.community} onChange={handleInputChange} autoComplete="off" />
                                    <Input name="aadharNo" label="Aadhar No" value={formData.aadharNo} onChange={handleInputChange} autoComplete="off" />
                                    <Input name="panNo" label="PAN No" value={formData.panNo} onChange={handleInputChange} autoComplete="off" />
                                    <div className="md:col-span-2">
                                        <Input name="otherInfo" label="Other Info" value={formData.otherInfo} onChange={handleInputChange} autoComplete="off" placeholder="Any other remarks..." />
                                    </div>
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
                                    <Select
                                        name="semester"
                                        label="Semester"
                                        value={formData.semester}
                                        onChange={handleInputChange}
                                        options={['1', '2', '3', '4', '5', '6']}
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

            {/* Print Modal */}
            <AnimatePresence>
                {isPrintModalOpen && (
                    <BulkTCPrintModal
                        studentIds={printStudentIds}
                        onClose={() => setIsPrintModalOpen(false)}
                    />
                )}
            </AnimatePresence>

            {/* Promote Modal */}
            <AnimatePresence>
                {isPromoteModalOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6"
                        >
                            <h3 className="text-xl font-bold text-slate-800 mb-2">Promote Students</h3>
                            <p className="text-slate-600 mb-4">
                                You are about to promote <b>{filteredStudents.length}</b> students
                                {filters.class ? <span> from <span className="font-bold text-brand-orange">{filters.class}</span></span> : " across ALL classes"}
                                to the next year.
                            </p>
                            <div className="p-3 bg-red-50 text-red-700 text-sm rounded-lg mb-4">
                                ⚠️ This action cannot be easily undone. Please verify the filter before proceeding.
                            </div>
                            <Input
                                label="Type 'CONFIRM' to proceed"
                                value={promoteConfirm}
                                onChange={(e) => setPromoteConfirm(e.target.value)}
                                placeholder="CONFIRM"
                            />
                            <div className="flex justify-end gap-3 mt-6">
                                <Button variant="ghost" onClick={() => setIsPromoteModalOpen(false)}>Cancel</Button>
                                <Button
                                    onClick={handlePromoteBatch}
                                    isLoading={formLoading}
                                    disabled={promoteConfirm !== 'CONFIRM'}
                                >
                                    Promote Students
                                </Button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Fee Update Modal */}
            <AnimatePresence>
                {isFeeModalOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6"
                        >
                            <h3 className="text-xl font-bold text-slate-800 mb-2">Update Batch Fees</h3>
                            <div className="mb-4 text-sm text-slate-600">
                                Target: <b>{filters.dept} - {filters.class}</b> ({filteredStudents.length} Students)
                            </div>
                            <div className="space-y-4">
                                <Input
                                    label="Add to Tuition Fee (₹)"
                                    type="number"
                                    value={bulkAmount.tuition}
                                    onChange={(e) => setBulkAmount(prev => ({ ...prev, tuition: e.target.value }))}
                                    placeholder="e.g. 15000"
                                />
                                <Input
                                    label="Add to Bus Fee (₹)"
                                    type="number"
                                    value={bulkAmount.bus}
                                    onChange={(e) => setBulkAmount(prev => ({ ...prev, bus: e.target.value }))}
                                    placeholder="Optional"
                                />
                            </div>
                            <div className="flex justify-end gap-3 mt-6">
                                <Button variant="ghost" onClick={() => setIsFeeModalOpen(false)}>Cancel</Button>
                                <Button onClick={handleBulkFeeUpdate} isLoading={formLoading}>
                                    Update Fees
                                </Button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>


        </div >
    );
};

export default ManageStudents;
