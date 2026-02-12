import { useState, useEffect } from 'react';
import { collection, addDoc, getDocs, deleteDoc, doc, query, orderBy, serverTimestamp } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Select from '../../components/Select';
import { Trash2, Send, Calendar, Users as UsersIcon, RefreshCw, Copy, Bell } from 'lucide-react';

const ManageEvents = () => {
    const [events, setEvents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [formData, setFormData] = useState({
        title: '',
        message: '',
        target: 'all', // all, student, teacher
        date: new Date().toISOString().split('T')[0]
    });
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        fetchEvents();
    }, []);

    const fetchEvents = async () => {
        try {
            const q = query(collection(db, "events"));
            const snapshot = await getDocs(q);
            const loadedEvents = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

            // Client-side Sort (Newest First)
            loadedEvents.sort((a, b) => {
                const da = a.createdAt?.toDate ? a.createdAt.toDate() : new Date(a.createdAt || 0);
                const db = b.createdAt?.toDate ? b.createdAt.toDate() : new Date(b.createdAt || 0);
                return db - da; // Descending
            });

            setEvents(loadedEvents);
        } catch (error) {
            console.error("Error fetching events:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSubmitting(true);

        if (!formData.title || !formData.message) {
            alert("Title and Message are required!");
            setSubmitting(false);
            return;
        }

        try {
            await addDoc(collection(db, "events"), {
                ...formData,
                createdAt: serverTimestamp(),
                timestamp: new Date().toISOString() // Identify when it was posted
            });

            setFormData({
                title: '',
                message: '',
                target: 'all',
                date: new Date().toISOString().split('T')[0]
            });
            fetchEvents();
            alert("Notification posted successfully!");
        } catch (error) {
            console.error("Error posting event:", error);
            alert("Failed to post event.");
        } finally {
            setSubmitting(false);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm("Are you sure you want to delete this event?")) return;
        try {
            await deleteDoc(doc(db, "events", id));
            setEvents(prev => prev.filter(e => e.id !== id));
        } catch (error) {
            console.error("Error deleting event:", error);
            alert("Failed to delete event.");
        }
    };

    const handleResend = (event) => {
        // Populate form with existing event data
        setFormData({
            title: event.title || '',
            message: event.message || '',
            target: event.target || 'all',
            date: new Date().toISOString().split('T')[0] // Reset date to today for new post
        });
        window.scrollTo({ top: 0, behavior: 'smooth' }); // Scroll to top to see form
    };

    const getTargetLabel = (target) => {
        switch (target) {
            case 'student': return 'Students Only';
            case 'teacher': return 'Staff / Teachers Only';
            case 'all': return 'All Users (Students & Staff)';
            default: return 'All Users';
        }
    };

    return (
        <div className="space-y-6">
            <h2 className="text-2xl font-bold text-slate-800">Manage Events & Notifications</h2>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Create Event Form */}
                <div className="lg:col-span-1">
                    <Card className="sticky top-6">
                        <div className="flex items-center gap-2 mb-4">
                            <Send className="text-brand-orange" size={20} />
                            <h3 className="font-bold text-lg text-slate-700">Create Notification</h3>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-4">
                            <Input
                                name="title"
                                label="Title / Subject"
                                value={formData.title}
                                onChange={handleInputChange}
                                required
                                placeholder="e.g. Holiday Notice"
                            />

                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Message Body</label>
                                <textarea
                                    name="message"
                                    value={formData.message}
                                    onChange={handleInputChange}
                                    required
                                    rows="5"
                                    className="w-full p-3 rounded-xl border border-slate-200 focus:border-brand-orange focus:ring-2 focus:ring-brand-orange/20 outline-none transition-all resize-none bg-slate-50 focus:bg-white"
                                    placeholder="Type your message here..."
                                />
                            </div>

                            <Select
                                name="target"
                                label="Send To"
                                value={formData.target}
                                onChange={handleInputChange}
                                options={[
                                    { value: 'all', label: 'All Users (Students & Staff)' },
                                    { value: 'student', label: 'Students Only' },
                                    { value: 'teacher', label: 'Staff / Teachers Only' }
                                ]}
                            />

                            <Input
                                name="date"
                                label="Display Date"
                                type="date"
                                value={formData.date}
                                onChange={handleInputChange}
                                required
                            />

                            <Button type="submit" className="w-full bg-brand-orange hover:bg-orange-600 text-white" isLoading={submitting}>
                                <Send size={18} className="mr-2" /> Post Notification
                            </Button>
                        </form>
                    </Card>
                </div>

                {/* Events List / History */}
                <div className="lg:col-span-2">
                    <Card>
                        <div className="flex items-center justify-between mb-6">
                            <div className="flex items-center gap-2">
                                <RefreshCw className="text-slate-400" size={20} />
                                <h3 className="font-bold text-lg text-slate-700">Notification History</h3>
                            </div>
                            <span className="text-xs text-slate-400 font-medium bg-slate-100 px-2 py-1 rounded-full">
                                {events.length} Posted
                            </span>
                        </div>

                        {loading ? (
                            <div className="flex flex-col items-center justify-center p-12 text-slate-400">
                                <div className="w-8 h-8 border-2 border-slate-200 border-t-brand-orange rounded-full animate-spin mb-2"></div>
                                <p>Loading history...</p>
                            </div>
                        ) : events.length === 0 ? (
                            <div className="text-center p-12 text-slate-400 bg-slate-50/50 rounded-xl border border-dashed border-slate-200">
                                <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-3">
                                    <Bell size={20} className="text-slate-400" />
                                </div>
                                <p>No notifications posted yet.</p>
                                <p className="text-xs text-slate-400 mt-1">Create your first notification on the left.</p>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {events.map((event) => (
                                    <div key={event.id} className="p-5 border border-slate-100 rounded-xl hover:shadow-md transition-all bg-white group relative overflow-hidden">
                                        <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-brand-orange to-brand-accent opacity-0 group-hover:opacity-100 transition-opacity"></div>

                                        <div className="flex justify-between items-start gap-4">
                                            <div className="flex-1">
                                                <div className="flex flex-wrap items-center gap-2 mb-2">
                                                    <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider ${event.target === 'all' ? 'bg-purple-100 text-purple-700' :
                                                        event.target === 'student' ? 'bg-blue-100 text-blue-700' :
                                                            'bg-orange-100 text-orange-700'
                                                        }`}>
                                                        {getTargetLabel(event.target)}
                                                    </span>
                                                    <span className="text-xs text-slate-400 flex items-center gap-1 bg-slate-50 px-2 py-1 rounded-full">
                                                        <Calendar size={12} />
                                                        {event.date}
                                                    </span>
                                                </div>
                                                <h4 className="font-bold text-slate-800 text-lg mb-1">{event.title}</h4>
                                                <p className="text-slate-600 text-sm whitespace-pre-wrap leading-relaxed">{event.message}</p>
                                            </div>

                                            <div className="flex flex-col gap-2">
                                                <button
                                                    onClick={() => handleResend(event)}
                                                    className="flex items-center justify-center p-2 text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors"
                                                    title="Use this as template"
                                                >
                                                    <Copy size={16} />
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(event.id)}
                                                    className="flex items-center justify-center p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                                    title="Delete permanently"
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </Card>
                </div>
            </div>
        </div>
    );
};

export default ManageEvents;
