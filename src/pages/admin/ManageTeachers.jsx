import { useState, useEffect } from 'react';
import clsx from 'clsx';
import { collection, getDocs, deleteDoc, doc, setDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '../../lib/firebase';
import { useAuth } from '../../context/AuthContext';
import { Plus, Trash2, Pencil, RefreshCw } from 'lucide-react';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Select from '../../components/Select';
import { TEACHER_DEPARTMENTS } from '../../constants/departments';
import Card from '../../components/ui/Card';
import { motion, AnimatePresence } from 'framer-motion';

const ManageTeachers = () => {
    const { userData } = useAuth();
    const isSuperAdmin = userData?.isSuperAdmin;
    const [teachers, setTeachers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingTeacher, setEditingTeacher] = useState(null);
    const [filterDept, setFilterDept] = useState('All');
    const [photoFile, setPhotoFile] = useState(null); // NEW: File state
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

    // NEW: Handle File Selection
    const handleFileChange = (e) => {
        if (e.target.files[0]) {
            setPhotoFile(e.target.files[0]);
        }
    };

    const handleEdit = (teacher) => {
        setEditingTeacher(teacher);
        setPhotoFile(null); // Reset file
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
        
        // Form Validation for required fields
        if (!formData.name || !formData.email || !formData.phone || !formData.dept || !formData.gender) {
            setFormError('Please fill in all required fields (Name, Email, Phone, Department, Gender).');
            return;
        }

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

            let docId;

            if (editingTeacher) {
                // UPDATE Logic
                docId = editingTeacher.id;
                await setDoc(doc(db, "teachers", docId), {
                    ...teacherData,
                    email: formData.email // Ensure email is synced in Firestore
                }, { merge: true });

                // Update 'users' collection too
                await setDoc(doc(db, "users", docId), {
                    name: teacherData.name,
                    email: formData.email,
                    phone: formData.phone,
                    role: teacherData.role
                }, { merge: true });

                alert("Teacher updated successfully!");
            } else {
                // CREATE Logic
                let passwordToUse = formData.password;
                if (!passwordToUse && formData.dob) {
                    // Default Password: DD-MM-YYYY using DOB
                    passwordToUse = formData.dob.split('-').reverse().join('-');
                } else if (!passwordToUse && formData.doj) {
                    // Fallback to DOJ if DOB missing (though DOB should be required now)
                    passwordToUse = formData.doj.split('-').reverse().join('-');
                }

                if (!passwordToUse) throw new Error("Password is required (or DOB for default).");

                const uid = await createUser(formData.email, passwordToUse, formData.isHod ? 'hod' : 'teacher', {
                    ...teacherData,
                    password: passwordToUse // Store for admin visibility
                });
                docId = uid;
                alert("Teacher created successfully!");
            }

            // NEW: Handle Photo Upload
            if (photoFile && docId) {
                const storageRef = ref(storage, `teachers/${docId}/profile.jpg`);
                await uploadBytes(storageRef, photoFile);
                const photoUrl = await getDownloadURL(storageRef);

                // Update 'teachers' and 'users' with photoUrl
                await setDoc(doc(db, "teachers", docId), { photoUrl }, { merge: true });
                await setDoc(doc(db, "users", docId), { photoUrl }, { merge: true });
            }

            setIsModalOpen(false);
            setFormData({
                name: '', email: '', phone: '', password: '', gender: '', cid: '', dept: '', doj: '', dob: '', qualification: '', isHod: false
            });
            setPhotoFile(null);
            setEditingTeacher(null);
            fetchTeachers();
        } catch (error) {
            console.error('Error saving teacher:', error);
            const errorMsg = error.message.replace("Firebase: ", "");
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

    const filteredTeachers = filterDept === 'All' 
        ? teachers 
        : teachers.filter(t => t.dept === filterDept);

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h2 className={clsx("text-2xl font-bold", isSuperAdmin ? "" : "text-slate-800")}>Manage Teachers</h2>
                <div className="flex gap-2 items-center">
                    <select
                        value={filterDept}
                        onChange={(e) => setFilterDept(e.target.value)}
                        className={clsx(
                            "px-3 py-2 rounded-lg border text-sm outline-none transition-all",
                            isSuperAdmin 
                                ? "bg-black/40 border-amber-500/30 text-amber-500 focus:border-amber-500" 
                                : "bg-white border-slate-200 text-slate-700 focus:ring-2 focus:border-brand-blue"
                        )}
                    >
                        <option value="All">All Departments</option>
                        {TEACHER_DEPARTMENTS.map(dept => (
                            <option key={dept} value={dept}>{dept}</option>
                        ))}
                    </select>
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
                            name: '', email: '', phone: '', password: '', gender: '', cid: '', dept: '', doj: '', dob: '', qualification: '', isHod: false
                        });
                        setIsModalOpen(true);
                    }}>
                        <Plus size={20} /> Add Teacher
                    </Button>
                </div>
            </div>

            <Card className={clsx("overflow-hidden p-0 border-none", isSuperAdmin ? "card-bg shadow-2xl" : "shadow-md")}>
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className={clsx("border-b", isSuperAdmin ? "bg-amber-500/10 border-amber-500/20" : "bg-slate-50 border-slate-100")}>
                            <tr>
                                <th className={clsx("p-4 font-semibold text-xs uppercase tracking-wider", isSuperAdmin ? "text-amber-500/70" : "text-slate-600")}>Details</th>
                                <th className={clsx("p-4 font-semibold text-xs uppercase tracking-wider", isSuperAdmin ? "text-amber-500/70" : "text-slate-600")}>Department</th>
                                <th className={clsx("p-4 font-semibold text-xs uppercase tracking-wider", isSuperAdmin ? "text-amber-500/70" : "text-slate-600")}>Qualification</th>
                                <th className={clsx("p-4 font-semibold text-xs uppercase tracking-wider", isSuperAdmin ? "text-amber-500/70" : "text-slate-600")}>Join Date</th>
                                <th className={clsx("p-4 font-semibold text-xs uppercase tracking-wider", isSuperAdmin ? "text-amber-500/70" : "text-slate-600")}>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr><td colSpan="5" className="p-8 text-center">Loading...</td></tr>
                            ) : filteredTeachers.length === 0 ? (
                                <tr><td colSpan="5" className="p-8 text-center text-slate-500">No teachers found.</td></tr>
                            ) : (
                                filteredTeachers.map((teacher) => (
                                    <tr key={teacher.id} className={clsx(
                                        "border-b transition-colors group",
                                        isSuperAdmin ? "border-amber-500/10 hover:bg-amber-500/5" : "border-slate-50 hover:bg-slate-50/50"
                                    )}>
                                        <td className="p-4 flex items-start gap-3">
                                            <img 
                                                src={teacher.photoUrl || `https://unavatar.io/${teacher.email}?fallback=${encodeURIComponent(`https://ui-avatars.com/api/?name=${teacher.name}&background=3b82f6&color=fff`)}`}
                                                alt={teacher.name}
                                                className={clsx("w-10 h-10 rounded-full object-cover shadow-sm transition-transform duration-300 hover:scale-110 mt-1", isSuperAdmin ? "ring-2 ring-amber-500/30" : "")}
                                                onError={(e) => {
                                                    e.target.onerror = null;
                                                    e.target.src = `https://ui-avatars.com/api/?name=${teacher.name}&background=3b82f6&color=fff`;
                                                }}
                                            />
                                            <div>
                                                <div className={clsx("font-bold", isSuperAdmin ? "text-amber-500 group-hover:text-amber-400" : "text-slate-900 group-hover:text-brand-blue")}>{teacher.name}</div>
                                                <div className={clsx("text-sm", isSuperAdmin ? "text-amber-500/60" : "text-slate-500")}>{teacher.email}</div>
                                                <div className={clsx("text-sm", isSuperAdmin ? "text-amber-500/60" : "text-slate-500")}>{teacher.phone}</div>
                                                <div className={clsx("text-xs", isSuperAdmin ? "text-amber-500/40" : "text-slate-400")}>ID: {teacher.cid}</div>
                                            </div>
                                        </td>
                                        <td className={clsx("p-4 text-sm", isSuperAdmin ? "text-amber-500/80" : "text-slate-600")}>{teacher.dept}</td>
                                        <td className={clsx("p-4 text-sm", isSuperAdmin ? "text-amber-500/80" : "text-slate-600")}>{teacher.qualification}</td>
                                        <td className={clsx("p-4 text-sm", isSuperAdmin ? "text-amber-500/80" : "text-slate-600")}>{teacher.doj}</td>
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
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={() => setIsModalOpen(false)}>
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            onClick={(e) => e.stopPropagation()}
                            className={clsx(
                                "rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto flex flex-col",
                                isSuperAdmin ? "bg-black/90 border border-amber-500/30 backdrop-blur-xl" : "bg-white"
                            )}
                        >
                            <div className={clsx("p-6 border-b flex justify-between items-center", isSuperAdmin ? "border-amber-500/20" : "border-slate-100")}>
                                <h3 className={clsx("text-xl font-bold", isSuperAdmin ? "text-amber-500" : "text-slate-900")}>{editingTeacher ? 'Edit Teacher' : 'Add New Teacher'}</h3>
                                <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600">×</button>
                            </div>

                            <form onSubmit={handleSubmit} className="p-6 space-y-4" autoComplete="off">
                                {formError && (
                                    <div className="p-3 rounded-lg bg-red-50 text-red-600 text-sm border border-red-200">
                                        {formError}
                                    </div>
                                )}

                                {/* NEW: Profile Picture Input */}
                                <div>
                                    <label className={clsx("block text-sm font-medium mb-1", isSuperAdmin ? "text-amber-500/80" : "text-slate-700")}>Profile Picture</label>
                                    <div className="flex items-center gap-4">
                                        {editingTeacher?.photoUrl && (
                                            <img
                                                src={editingTeacher.photoUrl}
                                                alt="Current Profile"
                                                className="w-12 h-12 rounded-full object-cover border border-slate-200"
                                            />
                                        )}
                                        <input
                                            type="file"
                                            accept="image/*"
                                            onChange={handleFileChange}
                                            className="block w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-brand-blue hover:file:bg-blue-100"
                                        />
                                    </div>
                                    <p className="text-xs text-slate-400 mt-1">Upload a square image (JPG/PNG).</p>
                                </div>

                                <Input name="name" label="Full Name" value={formData.name} onChange={handleInputChange} required autoComplete="off" />
                                <Input name="cid" label="College ID (CID)" value={formData.cid} onChange={handleInputChange} required autoComplete="off" />
                                <Input name="phone" label="Phone Number" value={formData.phone} onChange={handleInputChange} required autoComplete="off" />
                                <Input name="email" label="Email" type="email" value={formData.email} onChange={handleInputChange} required autoComplete="off" />
                                <Input
                                    name="password"
                                    label={editingTeacher ? "Password (leave blank to keep current)" : "Password"}
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
                                        className="w-5 h-5 text-brand-blue rounded focus:ring-brand-blue"
                                    />
                                    <label htmlFor="isHod" className="text-slate-700 font-medium cursor-pointer select-none">
                                        Assign as Head of Department (HOD)
                                    </label>
                                </div>
                                <div className="grid grid-cols-2 gap-4 mt-4">
                                    <Input name="doj" label="Date of Joining" type="date" value={formData.doj} onChange={handleInputChange} required autoComplete="off" />
                                    <Input name="dob" label="Date of Birth" type="date" value={formData.dob} onChange={handleInputChange} required autoComplete="off" />
                                </div>

                                <div className="pt-6 flex justify-end gap-3">
                                    <Button type="button" variant="ghost" onClick={() => setIsModalOpen(false)}>Cancel</Button>
                                    <Button type="submit" isLoading={formLoading}>
                                        {editingTeacher ? 'Update Teacher' : 'Create Teacher'}
                                    </Button>
                                </div>
                            </form>
                        </motion.div>
                    </div>
                )
                }
            </AnimatePresence >
        </div >
    );
};

export default ManageTeachers;
