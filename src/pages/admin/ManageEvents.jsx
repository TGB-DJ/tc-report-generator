import { useState, useEffect } from 'react';
import { collection, addDoc, getDocs, deleteDoc, doc, query, orderBy, serverTimestamp } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Select from '../../components/Select';
import { Trash2, Send, Calendar, Users as UsersIcon } from 'lucide-react';

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
            const q = query(collection(db, "events"), orderBy("createdAt", "desc"));
            const snapshot = await getDocs(q);
            setEvents(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
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
            alert("Event posted successfully!");
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

    const getTargetLabel = (target) => {
        switch (target) {
            case 'student': return 'Students Only';
            case 'teacher': return 'Teachers Only';
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
                        <h3 className="font-bold text-lg mb-4 text-slate-700">Post New Event</h3>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <Input
                                name="title"
                                label="Event Title"
                                value={formData.title}
                                onChange={handleInputChange}
                                required
                                placeholder="e.g. Annual Sports Day"
                            />

                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Message / Details</label>
                                <textarea
                                    name="message"
                                    value={formData.message}
                                    onChange={handleInputChange}
                                    required
                                    rows="4"
                                    className="w-full rounded-lg border-slate-200 focus:border-brand-orange focus:ring-brand-orange"
                                    placeholder="Enter event details here..."
                                />
                            </div>

                            <Select
                                name="target"
                                label="Target Audience"
                                value={formData.target}
                                onChange={handleInputChange}
                                options={[
                                    { value: 'all', label: 'All Users' },
                                    { value: 'student', label: 'Students Only' },
                                    { value: 'teacher', label: 'Teachers Only' }
                                ]}
                            />

                            <Input
                                name="date"
                                label="Event Date"
                                type="date"
                                value={formData.date}
                                onChange={handleInputChange}
                                required
                            />

                            <Button type="submit" className="w-full" isLoading={submitting}>
                                <Send size={18} className="mr-2" /> Post Notification
                            </Button>
                        </form>
                    </Card>
                </div>

                {/* Events List */}
                <div className="lg:col-span-2">
                    <Card>
                        <h3 className="font-bold text-lg mb-4 text-slate-700">Recent Events</h3>

                        {loading ? (
                            <div className="text-center p-8 text-slate-500">Loading events...</div>
                        ) : events.length === 0 ? (
                            <div className="text-center p-8 text-slate-500 bg-slate-50 rounded-lg">
                                No events posted yet.
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {events.map((event) => (
                                    <div key={event.id} className="p-4 border border-slate-100 rounded-xl hover:shadow-sm transition-shadow bg-white group">
                                        <div className="flex justify-between items-start">
                                            <div>
                                                <div className="flex items-center gap-2 mb-1">
                                                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${event.target === 'all' ? 'bg-purple-100 text-purple-700' :
                                                        event.target === 'student' ? 'bg-blue-100 text-blue-700' :
                                                            'bg-orange-100 text-orange-700'
                                                        }`}>
                                                        {getTargetLabel(event.target)}
                                                    </span>
                                                    <span className="text-xs text-slate-400 flex items-center gap-1">
                                                        <Calendar size={12} />
                                                        {event.date}
                                                    </span>
                                                </div>
                                                <h4 className="font-bold text-slate-800 text-lg">{event.title}</h4>
                                                <p className="text-slate-600 mt-2 text-sm whitespace-pre-wrap">{event.message}</p>
                                            </div>
                                            <button
                                                onClick={() => handleDelete(event.id)}
                                                className="text-slate-300 hover:text-red-500 transition-colors p-2"
                                                title="Delete Event"
                                            >
                                                <Trash2 size={18} />
                                            </button>
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
