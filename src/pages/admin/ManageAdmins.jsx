import { useState, useEffect } from 'react';
import clsx from 'clsx';
import { collection, getDocs, deleteDoc, doc, setDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '../../lib/firebase';
import { useAuth } from '../../context/AuthContext';
import { Plus, Trash2, Pencil, ShieldAlert, Search, Eye, EyeOff, ShieldCheck, Lock } from 'lucide-react';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import { motion, AnimatePresence } from 'framer-motion';

const ManageAdmins = () => {
    const [admins, setAdmins] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingAdmin, setEditingAdmin] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [visiblePasswords, setVisiblePasswords] = useState({}); // Map of ID -> true/false
    const [photoFile, setPhotoFile] = useState(null);
    const { createUser, user, userData } = useAuth();

    // Form State
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phone: '',
        password: ''
    });
    const [formLoading, setFormLoading] = useState(false);
    const [formError, setFormError] = useState('');

    const isSuperAdmin = userData?.isSuperAdmin || user?.email === 'chirenjeevi7616@gmail.com';

    useEffect(() => {
        if (isSuperAdmin) {
            fetchAdmins();
            // Silent Auto-Upgrade if missing flag
            if (!userData?.isSuperAdmin && user?.uid) {
                const upgrade = async () => {
                    try {
                        console.log("Auto-upgrading to Super Admin...");
                        await setDoc(doc(db, "users", user.uid), { isSuperAdmin: true }, { merge: true });
                        await setDoc(doc(db, "admins", user.uid), { isSuperAdmin: true }, { merge: true });
                    } catch (e) { console.error("Auto-upgrade failed", e); }
                };
                upgrade();
            }
        } else {
            setLoading(false);
        }
    }, [user, userData, isSuperAdmin]);

    const fetchAdmins = async () => {
        try {
            const querySnapshot = await getDocs(collection(db, "admins"));
            const list = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setAdmins(list);
        } catch (error) {
            console.error("Error fetching admins:", error);
        } finally {
            setLoading(false);
        }
    };

    // Access Denied View
    if (!loading && !isSuperAdmin) {
        return (
            <div className="h-[70vh] flex flex-col items-center justify-center text-center p-4">
                <motion.div
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="bg-red-50 p-6 rounded-full mb-4"
                >
                    <ShieldAlert size={48} className="text-red-500" />
                </motion.div>
                <h2 className="text-2xl font-bold text-slate-800 mb-2">Access Denied</h2>
                <p className="text-slate-500 max-w-md">
                    Only the Super Admin has permission to manage administrative accounts.
                </p>
            </div>
        );
    }

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleEdit = (admin) => {
        setEditingAdmin(admin);
        setFormData({
            name: admin.name || '',
            email: admin.email || '',
            phone: admin.phone || '',
            password: '',
        });
        setIsModalOpen(true);
    };

    const togglePasswordVisibility = (id) => {
        setVisiblePasswords(prev => ({ ...prev, [id]: !prev[id] }));
    };

    const handleFileChange = (e) => {
        if (e.target.files[0]) {
            setPhotoFile(e.target.files[0]);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setFormLoading(true);
        setFormError('');

        try {
            const adminData = {
                name: formData.name,
                phone: formData.phone,
                role: 'admin',
                updatedAt: new Date().toISOString()
            };

            // If a password is provided (new or update), we should ideally store it securely. 
            // Since the user requested "viewing current password", it implies we are storing it in Firestore.
            // WARNING: Storing passwords in Firestore is NOT secure practice, but fulfilling USER REQUEST.
            if (formData.password) {
                adminData.password = formData.password;
            }

            let docId;
            if (editingAdmin) {
                // UPDATE Logic
                docId = editingAdmin.id;
                await setDoc(doc(db, "admins", docId), {
                    ...adminData,
                    email: formData.email
                }, { merge: true });

                const userUpdateData = {
                    name: formData.name,
                    email: formData.email,
                    phone: formData.phone,
                    role: 'admin',
                    ...(formData.password ? { password: formData.password } : {})
                };

                await setDoc(doc(db, "users", docId), userUpdateData, { merge: true });
            } else {
                // CREATE Logic
                docId = await createUser(formData.email, formData.password, 'admin', adminData);
            }

            // Handle Photo Upload
            if (photoFile && docId) {
                const storageRef = ref(storage, `admins/${docId}/profile.jpg`);
                await uploadBytes(storageRef, photoFile);
                const photoUrl = await getDownloadURL(storageRef);

                await setDoc(doc(db, "admins", docId), { photoUrl }, { merge: true });
                await setDoc(doc(db, "users", docId), { photoUrl }, { merge: true });
            }

            alert("Admin saved successfully!");

            setIsModalOpen(false);
            setFormData({ name: '', email: '', phone: '', password: '' });
            setEditingAdmin(null);
            fetchAdmins();
        } catch (error) {
            console.error('Error saving admin:', error);
            setFormError(error.message || 'Unknown error occurred');
        } finally {
            setFormLoading(false);
        }
    };

    const handleDelete = async (id) => {
        if (id === user?.uid) {
            alert("You cannot delete your own account.");
            return;
        }
        if (!window.confirm("Are you sure you want to delete this admin?")) return;

        try {
            await deleteDoc(doc(db, "admins", id));
            await deleteDoc(doc(db, "users", id));
            setAdmins(prev => prev.filter(a => a.id !== id));
        } catch (error) {
            console.error("Error deleting admin:", error);
            alert("Error deleting admin: " + error.message);
        }
    };

    const filteredAdmins = admins.filter(admin =>
        admin.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        admin.email?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="space-y-8">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h2 className={clsx(
                        "text-3xl font-extrabold",
                        isSuperAdmin ? "bg-gradient-to-r from-amber-200 via-yellow-500 to-amber-600 bg-clip-text text-transparent" : "bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent"
                    )}>
                        Super Admin Panel
                    </h2>
                    <p className={isSuperAdmin ? "text-amber-500/80 font-medium" : "text-slate-500 font-medium"}>Manage system administrators</p>
                </div>

                <div className="flex gap-3 w-full md:w-auto">
                    <div className="relative flex-1 md:w-64">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                        <input
                            type="text"
                            placeholder="Search admins..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className={clsx(
                                "w-full pl-10 pr-4 py-2 backdrop-blur-sm border rounded-xl focus:ring-2 focus:outline-none transition-all",
                                isSuperAdmin ? "bg-black/20 border-amber-500/20 text-white focus:ring-amber-500/20 focus:border-amber-500/40" : "bg-white/50 border-slate-200 focus:ring-blue-500/20"
                            )}
                        />
                    </div>
                    <Button onClick={() => {
                        setEditingAdmin(null);
                        setFormData({ name: '', email: '', phone: '', password: '' });
                        setIsModalOpen(true);
                    }} className={isSuperAdmin ? "bg-brand-blue shadow-lg shadow-amber-500/20" : "shadow-lg shadow-blue-500/30"}>
                        <Plus size={20} /> Add Admin
                    </Button>
                </div>
            </div>

            {/* Futuristic Glass Table */}
            <div className={clsx(
                "rounded-3xl overflow-hidden border shadow-2xl",
                isSuperAdmin ? "card-bg border-amber-500/20" : "bg-white border-white/40 backdrop-blur-xl ring-1 ring-black/5"
            )}>
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className={clsx(
                                "border-b backdrop-blur-sm",
                                isSuperAdmin ? "bg-amber-500/10 border-amber-500/20" : "bg-slate-50/80 border-slate-200/50"
                            )}>
                                <th className={clsx("p-5 font-bold uppercase tracking-wider text-xs", isSuperAdmin ? "text-amber-500" : "text-slate-600")}>Admin Profile</th>
                                <th className={clsx("p-5 font-bold uppercase tracking-wider text-xs", isSuperAdmin ? "text-amber-500" : "text-slate-600")}>Credentials</th>
                                <th className={clsx("p-5 font-bold uppercase tracking-wider text-xs", isSuperAdmin ? "text-amber-500" : "text-slate-600")}>Status</th>
                                <th className={clsx("p-5 font-bold uppercase tracking-wider text-xs text-right", isSuperAdmin ? "text-amber-500" : "text-slate-600")}>Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100/50">
                            {loading ? (
                                <tr><td colSpan="4" className="p-10 text-center animate-pulse">Loading data...</td></tr>
                            ) : filteredAdmins.length === 0 ? (
                                <tr><td colSpan="4" className="p-10 text-center text-slate-500">No admins found matching your search.</td></tr>
                            ) : (
                                filteredAdmins.map((admin, index) => (
                                    <motion.tr
                                        key={admin.id}
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: index * 0.05 }}
                                        className={clsx(
                                            "transition-colors group",
                                            isSuperAdmin ? "hover:bg-amber-500/5" : "hover:bg-white/60"
                                        )}
                                    >
                                        <td className="p-5">
                                            <div className="flex items-center gap-3">
                                                <div className={clsx(
                                                    "w-10 h-10 rounded-full flex items-center justify-center text-white font-bold shadow-lg",
                                                    isSuperAdmin ? "bg-gradient-to-br from-amber-400 to-yellow-700 shadow-amber-500/20" : "bg-gradient-to-br from-indigo-500 to-purple-600 shadow-indigo-500/30"
                                                )}>
                                                    {admin.name?.charAt(0).toUpperCase()}
                                                </div>
                                                <div>
                                                    <div className={clsx("font-bold transition-colors", isSuperAdmin ? "text-amber-500 group-hover:text-amber-400" : "text-slate-900 group-hover:text-brand-blue")}>{admin.name}</div>
                                                    <div className={clsx("text-xs transition-colors", isSuperAdmin ? "text-amber-500/60" : "text-slate-500")}>{admin.phone || 'No phone'}</div>
                                                    <div className={clsx("text-[10px] transition-colors mt-0.5", isSuperAdmin ? "text-amber-500/40" : "text-slate-400")}>CID: {admin.id?.slice(-6).toUpperCase()}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="p-5">
                                            <div className="space-y-1">
                                                <div className={clsx("text-sm font-medium transition-colors", isSuperAdmin ? "text-amber-500/80" : "text-slate-700")}>{admin.email}</div>
                                                <div className="flex items-center gap-2">
                                                    <div className={clsx(
                                                        "text-xs font-mono px-2 py-1 rounded border",
                                                        isSuperAdmin 
                                                            ? (visiblePasswords[admin.id] ? 'text-amber-200 bg-amber-500/10 border-amber-500/20' : 'text-amber-700 bg-black/20 border-amber-500/10')
                                                            : (visiblePasswords[admin.id] ? 'text-slate-800 bg-slate-100 border-slate-200' : 'text-slate-400 bg-slate-50 border-slate-100')
                                                    )}>
                                                        {visiblePasswords[admin.id]
                                                            ? (admin.password || "Hidden/Not Stored")
                                                            : "••••••••••••"}
                                                    </div>
                                                    <button
                                                        onClick={() => togglePasswordVisibility(admin.id)}
                                                        className="text-slate-400 hover:text-indigo-600 transition-colors"
                                                        title="Toggle Password Visibility"
                                                    >
                                                        {visiblePasswords[admin.id] ? <EyeOff size={14} /> : <Eye size={14} />}
                                                    </button>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="p-5">
                                            {admin.isSuperAdmin ? (
                                                <span className={clsx(
                                                    "inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold border",
                                                    isSuperAdmin ? "bg-amber-500/20 text-amber-200 border-amber-500/30" : "bg-amber-100 text-amber-700 border-amber-200"
                                                )}>
                                                    <ShieldCheck size={12} /> Super Admin
                                                </span>
                                            ) : (
                                                <span className={clsx(
                                                    "inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold border",
                                                    isSuperAdmin ? "bg-amber-500/10 text-amber-400 border-amber-500/20" : "bg-blue-100 text-blue-700 border-blue-200"
                                                )}>
                                                    <ShieldCheck size={12} /> Admin
                                                </span>
                                            )}
                                        </td>
                                        <td className="p-5 text-right">
                                            <div className="flex items-center justify-end gap-2 opacity-80 group-hover:opacity-100 transition-opacity">
                                                <button
                                                    onClick={() => handleEdit(admin)}
                                                    className={clsx(
                                                        "p-2 rounded-lg transition-all hover:scale-105 active:scale-95",
                                                        isSuperAdmin ? "text-amber-400 bg-amber-500/10 hover:bg-amber-500/20" : "text-blue-600 bg-blue-50 hover:bg-blue-100"
                                                    )}
                                                    title="Edit"
                                                >
                                                    <Pencil size={18} />
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(admin.id)}
                                                    className={clsx(
                                                        "p-2 rounded-lg transition-all hover:scale-105 active:scale-95",
                                                        admin.id === user?.uid 
                                                            ? (isSuperAdmin ? 'text-amber-900 bg-amber-950/20' : 'text-slate-300 bg-slate-50')
                                                            : (isSuperAdmin ? 'text-red-400 bg-red-500/10 hover:bg-red-500/20' : 'text-red-500 bg-red-50 hover:bg-red-100')
                                                    )}
                                                    disabled={admin.id === user?.uid}
                                                    title="Delete"
                                                >
                                                    <Trash2 size={18} />
                                                </button>
                                            </div>
                                        </td>
                                    </motion.tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Futuristic Modal */}
            <AnimatePresence>
                {isModalOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0, y: 20 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.9, opacity: 0, y: 20 }}
                            className={clsx(
                                "rounded-2xl shadow-2xl w-full max-w-lg flex flex-col overflow-hidden ring-1 ring-white/20",
                                isSuperAdmin ? "card-bg border-amber-500/30" : "bg-white"
                            )}
                        >
                            <div className={clsx(
                                "p-6 border-b flex justify-between items-center",
                                isSuperAdmin ? "bg-amber-500/10 border-amber-500/20" : "bg-gradient-to-r from-slate-50 to-white border-slate-100"
                            )}>
                                <h3 className={clsx(
                                    "text-xl font-bold",
                                    isSuperAdmin ? "text-amber-400" : "bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-purple-600"
                                )}>
                                    {editingAdmin ? 'Edit Administrator' : 'New Administrator'}
                                </h3>
                                <button onClick={() => setIsModalOpen(false)} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors">×</button>
                            </div>

                            <form onSubmit={handleSubmit} className="p-8 space-y-5" autoComplete="off">
                                {formError && (
                                    <div className="p-4 rounded-xl bg-red-50 text-red-600 text-sm border border-red-100 flex items-center gap-3 animate-shake">
                                        <ShieldAlert size={20} />
                                        {formError}
                                    </div>
                                )}

                                <div className="space-y-4">
                                    <Input
                                        name="name"
                                        label="Full Name"
                                        value={formData.name}
                                        onChange={handleInputChange}
                                        required
                                        className={isSuperAdmin ? "bg-black/20 border-amber-500/20 text-white focus:border-amber-500/40" : "bg-slate-50 border-transparent focus:bg-white focus:border-indigo-200"}
                                    />
                                    <Input
                                        name="email"
                                        label="Email Address"
                                        type="email"
                                        value={formData.email}
                                        onChange={handleInputChange}
                                        required
                                        className={isSuperAdmin ? "bg-black/20 border-amber-500/20 text-white focus:border-amber-500/40" : "bg-slate-50 border-transparent focus:bg-white focus:border-indigo-200"}
                                    />
                                    <Input
                                        name="phone"
                                        label="Phone Number"
                                        value={formData.phone}
                                        onChange={handleInputChange}
                                        required
                                        className={isSuperAdmin ? "bg-black/20 border-amber-500/20 text-white focus:border-amber-500/40" : "bg-slate-50 border-transparent focus:bg-white focus:border-indigo-200"}
                                    />
                                    <div className="relative">
                                        <Input
                                            name="password"
                                            label={editingAdmin ? "New Password (Optional)" : "Password"}
                                            type="text"
                                            value={formData.password}
                                            onChange={handleInputChange}
                                            required={!editingAdmin}
                                            placeholder={editingAdmin ? "Leave blank to keep current" : "Required"}
                                            minLength={6}
                                            className={isSuperAdmin ? "bg-black/20 border-amber-500/20 text-white focus:border-amber-500/40" : "bg-slate-50 border-transparent focus:bg-white focus:border-indigo-200"}
                                        />
                                        <Lock className="absolute right-3 top-[2.4rem] text-slate-400 opacity-50" size={16} />
                                    </div>
                                </div>

                                <div className="pt-6 flex justify-end gap-3">
                                    <Button type="button" variant="ghost" onClick={() => setIsModalOpen(false)}>Cancel</Button>
                                    <Button type="submit" isLoading={formLoading} className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 shadow-lg shadow-indigo-500/30 border-none">
                                        {editingAdmin ? 'Save Changes' : 'Create Account'}
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

export default ManageAdmins;
