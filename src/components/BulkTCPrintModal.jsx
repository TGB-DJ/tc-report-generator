import { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import TCPrintTemplate from './TCPrintTemplate';
import Button from './ui/Button';
import { Printer, X, Loader } from 'lucide-react';
import { motion } from 'framer-motion';

const BulkTCPrintModal = ({ studentIds, onClose }) => {
    const [students, setStudents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchStudents = async () => {
            try {
                setLoading(true);
                setError('');

                const studentPromises = studentIds.map(async (id) => {
                    const docRef = doc(db, "students", id);
                    const docSnap = await getDoc(docRef);
                    if (docSnap.exists()) {
                        return { id, ...docSnap.data() };
                    }
                    return null;
                });

                const fetchedStudents = await Promise.all(studentPromises);
                const validStudents = fetchedStudents.filter(s => s !== null);

                if (validStudents.length === 0) {
                    setError('No student data found');
                } else {
                    setStudents(validStudents);
                }
            } catch (err) {
                console.error('Error fetching students:', err);
                setError('Failed to load student data. Please try again.');
            } finally {
                setLoading(false);
            }
        };

        if (studentIds && studentIds.length > 0) {
            fetchStudents();
        }
    }, [studentIds]);

    const handlePrint = () => {
        window.print();
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className="bg-white rounded-2xl shadow-2xl w-full max-w-6xl max-h-[90vh] overflow-y-auto flex flex-col"
            >
                {/* Header - Hidden when printing */}
                <div className="no-print p-6 border-b border-slate-100 flex justify-between items-center sticky top-0 bg-white z-10">
                    <div>
                        <h3 className="text-xl font-bold">Transfer Certificates</h3>
                        <p className="text-sm text-slate-500 mt-1">
                            {loading ? 'Loading...' : `${students.length} student${students.length !== 1 ? 's' : ''} selected`}
                        </p>
                    </div>
                    <div className="flex gap-2">
                        {!loading && students.length > 0 && (
                            <Button onClick={handlePrint}>
                                <Printer size={16} className="mr-2" />
                                Print All
                            </Button>
                        )}
                        <button
                            onClick={onClose}
                            className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                        >
                            <X size={20} />
                        </button>
                    </div>
                </div>

                {/* Content */}
                <div className="p-6">
                    {loading && (
                        <div className="flex flex-col items-center justify-center py-20">
                            <Loader className="animate-spin text-brand-orange mb-4" size={48} />
                            <p className="text-slate-600">Loading student data...</p>
                        </div>
                    )}

                    {error && (
                        <div className="p-6 rounded-lg bg-red-50 text-red-600 border border-red-200">
                            <p className="font-medium">Error</p>
                            <p className="text-sm mt-1">{error}</p>
                        </div>
                    )}

                    {!loading && !error && students.length > 0 && (
                        <div id="tc-print-container">
                            {students.map((student, index) => (
                                <TCPrintTemplate
                                    key={student.id}
                                    student={student}
                                    isLast={index === students.length - 1}
                                />
                            ))}
                        </div>
                    )}
                </div>
            </motion.div>
        </div>
    );
};

BulkTCPrintModal.propTypes = {
    studentIds: PropTypes.arrayOf(PropTypes.string).isRequired,
    onClose: PropTypes.func.isRequired
};

export default BulkTCPrintModal;
