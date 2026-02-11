import { useState, useEffect } from 'react';
import { collection, getDocs, deleteDoc, doc, setDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { useAuth } from '../../context/AuthContext';
import { Plus, Trash2, Pencil, RefreshCw } from 'lucide-react';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Select from '../../components/Select';
import { TEACHER_DEPARTMENTS } from '../../constants/departments';
import Card from '../../components/ui/Card';
import { motion, AnimatePresence } from 'framer-motion';

const ManageTeachers = () => {
    const [teachers, setTeachers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingTeacher, setEditingTeacher] = useState(null);
    const { createUser } = useAuth();

    // Form State
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phone: '',
        password: '',
        gender: '', // NEW
        cid: '',
        dept: '',
        doj: '',
        qualification: '',
        isHod: false
    });
    const [formLoading, setFormLoading] = useState(false);
    const [formError, setFormError] = useState('');

    useEffect(() => {
        fetchTeachers();
    }, []);

    const fetchTeachers = async () => {
        try {
            const querySnapshot = await getDocs(collection(db, "teachers"));
            const list = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setTeachers(list);
        } catch (error) {
            console.error("Error fetching teachers:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleEdit = (teacher) => {
        setEditingTeacher(teacher);
        setFormData({
            name: teacher.name || '',
            email: teacher.email || '',
            phone: teacher.phone || '',
            password: teacher.password || '', // Pre-fill if available
            gender: teacher.gender || '', // NEW
            cid: teacher.cid || '',
            dept: teacher.dept || '',
            doj: teacher.doj || '',
            qualification: teacher.qualification || '',
            isHod: teacher.role === 'hod'
        });
        setIsModalOpen(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setFormLoading(true);
        setFormError('');

        try {
            const teacherData = {
                name: formData.name,
                gender: formData.gender, // NEW
                phone: formData.phone,
                cid: formData.cid,
                dept: formData.dept,
                doj: formData.doj,
                qualification: formData.qualification,
                role: formData.isHod ? 'hod' : 'teacher',
                ...(formData.password && { password: formData.password }) // Update stored password if provided
            };

            if (editingTeacher) {
                // UPDATE Logic
                await setDoc(doc(db, "teachers", editingTeacher.id), {
                    ...teacherData,
                    email: formData.email // Ensure email is synced in Firestore
                }, { merge: true });

                // Update 'users' collection too
                await setDoc(doc(db, "users", editingTeacher.id), {
                    email: formData.email,
                    phone: formData.phone,
                    role: teacherData.role
                }, { merge: true });

                alert("Teacher updated successfully!");
            } else {
                // CREATE Logic
                await createUser(formData.email, formData.password, formData.isHod ? 'hod' : 'teacher', teacherData);
                alert("Teacher created successfully!");
            }

            setIsModalOpen(false);
            setFormData({
                name: '', email: '', phone: '', password: '', gender: '', cid: '', dept: '', doj: '', qualification: '', isHod: false
            });
            setEditingTeacher(null);
            fetchTeachers();
        } catch (error) {
            console.error('Error saving teacher:', error);
            const errorMsg = error.message || 'Unknown error occurred';
            setFormError(errorMsg);
            alert("Error: " + errorMsg);
        } finally {
            setFormLoading(false);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm("Are you sure you want to delete this teacher?")) return;
        try {
            await deleteDoc(doc(db, "teachers", id));
            await deleteDoc(doc(db, "users", id));
            setTeachers(prev => prev.filter(t => t.id !== id));
        } catch (error) {
            console.error("Error deleting teacher:", error);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-slate-800">Manage Teachers</h2>
                <div className="flex gap-2">
                    <Button variant="outline" onClick={async () => {
                        if (!window.confirm("This will fix invisible teachers. Continue?")) return;
                        setLoading(true);
                        try {
                            const teachersSnap = await getDocs(collection(db, "teachers"));
                            const adminsSnap = await getDocs(collection(db, "admins"));
                            let count = 0;

                            for (const docSnap of adminsSnap.docs) {
                                const data = docSnap.data();
                                if (data.role === 'hod' || data.role === 'teacher') {
                                    // Check if not already in teachers
                                    if (!teachersSnap.docs.find(t => t.id === docSnap.id)) {
                                        await setDoc(doc(db, "teachers", docSnap.id), data);
                                        await deleteDoc(doc(db, "admins", docSnap.id));
                                        count++;
                                    }
                                }
                            }
                            alert(`Fixed ${count} teacher records. Refreshing...`);
                            fetchTeachers();
                        } catch (e) {
                            alert("Error fixing data: " + e.message);
                        } finally {
                            setLoading(false);
                        }
                    }}>
                        <RefreshCw size={20} /> Fix Data
                    </Button>
                    <Button onClick={() => {
                        setEditingTeacher(null);
                        setFormData({
                            name: '', email: '', phone: '', password: '', gender: '', cid: '', dept: '', doj: '', qualification: '', isHod: false
                        });
                        setIsModalOpen(true);
                    }}>
                        <Plus size={20} /> Add Teacher
                    </Button>
                </div>
            </div>

            <Card className="overflow-hidden p-0">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-slate-50 border-b border-slate-100">
                            <tr>
                                <th className="p-4 font-semibold text-slate-600">Details</th>
                                <th className="p-4 font-semibold text-slate-600">Department</th>
                                <th className="p-4 font-semibold text-slate-600">Qualification</th>
                                <th className="p-4 font-semibold text-slate-600">Join Date</th>
                                <th className="p-4 font-semibold text-slate-600">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr><td colSpan="5" className="p-8 text-center">Loading...</td></tr>
                            ) : teachers.length === 0 ? (
                                <tr><td colSpan="5" className="p-8 text-center text-slate-500">No teachers found.</td></tr>
                            ) : (
                                teachers.map((teacher) => (
                                    <tr key={teacher.id} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors">
                                        <td className="p-4">
                                            <div className="font-medium text-slate-900">{teacher.name}</div>
                                            <div className="text-sm text-slate-500">{teacher.email}</div>
                                            <div className="text-sm text-slate-500">{teacher.phone}</div>
                                            <div className="text-xs text-slate-400">ID: {teacher.cid}</div>
                                        </td>
                                        <td className="p-4">{teacher.dept}</td>
                                        <td className="p-4">{teacher.qualification}</td>
                                        <td className="p-4">{teacher.doj}</td>
                                        <td className="p-4 flex gap-2">
                                            <button
                                                onClick={() => handleEdit(teacher)}
                                                className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                                title="Edit"
                                            >
                                                <Pencil size={18} />
                                            </button>
                                            <button
                                                onClick={() => handleDelete(teacher.id)}
                                                className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
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

            {/* Add Teacher Modal */}
            <AnimatePresence>
                {isModalOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto flex flex-col"
                        >
                            <div className="p-6 border-b border-slate-100 flex justify-between items-center">
                                <h3 className="text-xl font-bold">{editingTeacher ? 'Edit Teacher' : 'Add New Teacher'}</h3>
                                <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600">×</button>
                            </div>

                            <form onSubmit={handleSubmit} className="p-6 space-y-4" autoComplete="off">
                                {formError && (
                                    <div className="p-3 rounded-lg bg-red-50 text-red-600 text-sm border border-red-200">
                                        {formError}
                                    </div>
                                )}
                                <Input name="name" label="Full Name" value={formData.name} onChange={handleInputChange} required autoComplete="off" />
                                <Input name="cid" label="College ID (CID)" value={formData.cid} onChange={handleInputChange} required autoComplete="off" />
                                <Input name="phone" label="Phone Number" value={formData.phone} onChange={handleInputChange} required autoComplete="off" />
                                <Input name="email" label="Email" type="email" value={formData.email} onChange={handleInputChange} required autoComplete="off" />
                                <Input
                                    name="password"
                                    label={editingTeacher ? "New Password (Optional)" : "Password"}
                                    type="text" // Visible as requested
                                    value={formData.password}
                                    onChange={handleInputChange}
                                    required={!editingTeacher}
                                    autoComplete="new-password"
                                    placeholder={editingTeacher ? "Leave blank to keep current" : "Required"}
                                />
                                <div className="grid grid-cols-2 gap-4">
                                    <Select
                                        name="gender"
                                        label="Gender"
                                        value={formData.gender}
                                        onChange={handleInputChange}
                                        options={['Male', 'Female', 'Other']}
                                        required
                                    />
                                    <Select
                                        name="dept"
                                        label="Department"
                                        value={formData.dept}
                                        onChange={handleInputChange}
                                        options={TEACHER_DEPARTMENTS}
                                        required
                                    />
                                    <Input name="qualification" label="Qualification" value={formData.qualification} onChange={handleInputChange} required autoComplete="off" />
                                </div>

                                <div className="flex items-center gap-2 p-3 bg-slate-50 rounded-lg border border-slate-200">
                                    <input
                                        type="checkbox"
                                        id="isHod"
                                        name="isHod"
                                        checked={formData.isHod}
                                        onChange={(e) => setFormData(prev => ({ ...prev, isHod: e.target.checked }))}
                                        className="w-5 h-5 text-brand-orange rounded focus:ring-brand-orange"
                                    />
                                    <label htmlFor="isHod" className="text-slate-700 font-medium cursor-pointer select-none">
                                        Assign as Head of Department (HOD)
                                    </label>
                                </div>
                                <Input name="doj" label="Date of Joining" type="date" value={formData.doj} onChange={handleInputChange} required autoComplete="off" />

                                <div className="pt-6 flex justify-end gap-3">
                                    <Button type="button" variant="ghost" onClick={() => setIsModalOpen(false)}>Cancel</Button>
                                    <Button type="submit" isLoading={formLoading}>
                                        {editingTeacher ? 'Update Teacher' : 'Create Teacher'}
                                    </Button>
                                </div>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default ManageTeachers;
