import { useState, useEffect } from 'react';
import { collection, getDocs, deleteDoc, doc, setDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
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
    const { createUser, user } = useAuth();

    // Form State
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phone: '',
        password: ''
    });
    const [formLoading, setFormLoading] = useState(false);
    const [formError, setFormError] = useState('');

    const isSuperAdmin = user?.isSuperAdmin || user?.email === 'chirenjeevi7616@gmail.com';

    useEffect(() => {
        if (isSuperAdmin) {
            fetchAdmins();
            // Silent Auto-Upgrade if missing flag
            if (!user?.isSuperAdmin && user?.uid) {
                const upgrade = async () => {
                    try {
                        await setDoc(doc(db, "users", user.uid), { isSuperAdmin: true }, { merge: true });
                        await setDoc(doc(db, "admins", user.uid), { isSuperAdmin: true }, { merge: true });
                    } catch (e) { console.error("Auto-upgrade failed", e); }
                };
                upgrade();
            }
        } else {
            setLoading(false);
        }
    }, [user, isSuperAdmin]);

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

            if (editingAdmin) {
                // UPDATE Logic
                await setDoc(doc(db, "admins", editingAdmin.id), {
                    ...adminData,
                    email: formData.email
                }, { merge: true });

                const userUpdateData = {
                    email: formData.email,
                    phone: formData.phone,
                    role: 'admin',
                    // Sync password to users result if needed
                    ...(formData.password ? { password: formData.password } : {})
                };

                await setDoc(doc(db, "users", editingAdmin.id), userUpdateData, { merge: true });
                alert("Admin updated successfully!");
            } else {
                // CREATE Logic
                // Note: user requested ability to see passwords. We store it in 'admins' collection too.
                await createUser(formData.email, formData.password, 'admin', adminData);
                alert("Admin created successfully!");
            }

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
                    <h2 className="text-3xl font-extrabold bg-gradient-to-r from-orange-600 to-purple-600 bg-clip-text text-transparent">
                        Super Admin Panel
                    </h2>
                    <p className="text-slate-500 font-medium">Manage system administrators</p>
                </div>

                <div className="flex gap-3 w-full md:w-auto">
                    <div className="relative flex-1 md:w-64">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                        <input
                            type="text"
                            placeholder="Search admins..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 bg-white/50 backdrop-blur-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-orange-500/20 focus:outline-none transition-all"
                        />
                    </div>
                    <Button onClick={() => {
                        setEditingAdmin(null);
                        setFormData({ name: '', email: '', phone: '', password: '' });
                        setIsModalOpen(true);
                    }} className="shadow-lg shadow-orange-500/30">
                        <Plus size={20} /> Add Admin
                    </Button>
                </div>
            </div>

            {/* Futuristic Glass Table */}
            <div className="rounded-3xl overflow-hidden border border-white/40 shadow-2xl bg-white/40 backdrop-blur-xl ring-1 ring-black/5">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="bg-slate-50/80 border-b border-slate-200/50 backdrop-blur-sm">
                                <th className="p-5 font-bold text-slate-600 uppercase tracking-wider text-xs">Admin Profile</th>
                                <th className="p-5 font-bold text-slate-600 uppercase tracking-wider text-xs">Credentials</th>
                                <th className="p-5 font-bold text-slate-600 uppercase tracking-wider text-xs">Status</th>
                                <th className="p-5 font-bold text-slate-600 uppercase tracking-wider text-xs text-right">Actions</th>
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
                                        className="hover:bg-white/60 transition-colors group"
                                    >
                                        <td className="p-5">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold shadow-lg shadow-indigo-500/30">
                                                    {admin.name?.charAt(0).toUpperCase()}
                                                </div>
                                                <div>
                                                    <div className="font-bold text-slate-800">{admin.name}</div>
                                                    <div className="text-xs text-slate-500">{admin.phone || 'No phone'}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="p-5">
                                            <div className="space-y-1">
                                                <div className="text-sm font-medium text-slate-700">{admin.email}</div>
                                                <div className="flex items-center gap-2">
                                                    <div className={`text-xs font-mono bg-slate-100 px-2 py-1 rounded border border-slate-200 ${visiblePasswords[admin.id] ? 'text-slate-800' : 'text-slate-400'}`}>
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
                                                <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-700 border border-amber-200">
                                                    <ShieldCheck size={12} /> Super Admin
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-blue-100 text-blue-700 border border-blue-200">
                                                    <ShieldCheck size={12} /> Admin
                                                </span>
                                            )}
                                        </td>
                                        <td className="p-5 text-right">
                                            <div className="flex items-center justify-end gap-2 opacity-80 group-hover:opacity-100 transition-opacity">
                                                <button
                                                    onClick={() => handleEdit(admin)}
                                                    className="p-2 text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition-all hover:scale-105 active:scale-95"
                                                    title="Edit"
                                                >
                                                    <Pencil size={18} />
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(admin.id)}
                                                    className={`p-2 rounded-lg transition-all hover:scale-105 active:scale-95 ${admin.id === user?.uid ? 'text-slate-300 bg-slate-50 cursor-not-allowed' : 'text-red-500 bg-red-50 hover:bg-red-100'}`}
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
                            className="bg-white rounded-2xl shadow-2xl w-full max-w-lg flex flex-col overflow-hidden ring-1 ring-white/20"
                        >
                            <div className="p-6 bg-gradient-to-r from-slate-50 to-white border-b border-slate-100 flex justify-between items-center">
                                <h3 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-purple-600">
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
                                        className="bg-slate-50 border-transparent focus:bg-white focus:border-indigo-200"
                                    />
                                    <Input
                                        name="email"
                                        label="Email Address"
                                        type="email"
                                        value={formData.email}
                                        onChange={handleInputChange}
                                        required
                                        className="bg-slate-50 border-transparent focus:bg-white focus:border-indigo-200"
                                    />
                                    <Input
                                        name="phone"
                                        label="Phone Number"
                                        value={formData.phone}
                                        onChange={handleInputChange}
                                        required
                                        className="bg-slate-50 border-transparent focus:bg-white focus:border-indigo-200"
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
                                            className="bg-slate-50 border-transparent focus:bg-white focus:border-indigo-200"
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
