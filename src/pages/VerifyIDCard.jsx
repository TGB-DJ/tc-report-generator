import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { ShieldCheck, AlertCircle, Phone, Heart, Calendar, Hash } from 'lucide-react';
import { motion } from 'framer-motion';

const VerifyIDCard = () => {
    const { regno } = useParams();
    const [student, setStudent] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchStudent = async () => {
            try {
                // Fetch student from 'users' or 'students' collection where regno matches
                const q = query(collection(db, 'users'), where('regno', '==', regno), where('role', '==', 'student'));
                const querySnapshot = await getDocs(q);
                
                if (!querySnapshot.empty) {
                    setStudent(querySnapshot.docs[0].data());
                } else {
                    const studentQ = query(collection(db, 'students'), where('regno', '==', regno));
                    const studentSnapshot = await getDocs(studentQ);
                    
                    if (!studentSnapshot.empty) {
                        setStudent(studentSnapshot.docs[0].data());
                    } else {
                        setError('Student record not found.');
                    }
                }
            } catch (err) {
                console.error("Error verifying ID:", err);
                setError('Failed to load student data. Please try again.');
            } finally {
                setLoading(false);
            }
        };

        if (regno) fetchStudent();
    }, [regno]);

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-50">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-blue"></div>
            </div>
        );
    }

    if (error || !student) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
                <div className="max-w-md w-full bg-white rounded-2xl shadow-lg p-8 text-center space-y-4">
                    <AlertCircle className="mx-auto h-16 w-16 text-red-500" />
                    <h2 className="text-2xl font-bold text-slate-800">Verification Failed</h2>
                    <p className="text-slate-500">{error || "Invalid ID Card"}</p>
                    <Link to="/" className="inline-block mt-4 text-brand-blue hover:underline font-medium">
                        Return to Home
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50 py-12 px-4 flex flex-col items-center">
            {/* Verification Banner */}
            <motion.div 
                initial={{ y: -20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                className="bg-green-50 border border-green-200 rounded-full px-6 py-2 flex items-center gap-2 mb-8 shadow-sm"
            >
                <ShieldCheck className="text-green-600 h-5 w-5" />
                <span className="text-green-700 font-medium tracking-wide">Verified Student Identity</span>
            </motion.div>

            {/* Displaying ID Card */}
            <motion.div 
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="w-full max-w-sm bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden relative"
            >
                {/* Top Header */}
                <div className="bg-brand-blue p-4 flex items-center justify-center gap-3 relative overflow-hidden">
                    <img src="/ksk-logo.jpg" alt="Logo" className="w-12 h-12 object-contain bg-white p-1 rounded-full relative z-10" />
                    <div className="relative z-10 text-white text-center">
                        <h4 className="font-bold text-[13px] leading-tight">KANCHI SHRI KRISHNA</h4>
                        <p className="text-[9px] font-medium opacity-90 tracking-wide">COLLEGE OF ARTS AND SCIENCE</p>
                    </div>
                </div>

                {/* Profile & QR Section */}
                <div className="flex flex-col p-6 relative bg-white">
                    <div className="flex justify-between items-start w-full -mt-10 mb-4 relative z-20">
                        {/* Profile Image */}
                        <div className="w-24 h-28 rounded-md border-4 border-white shadow-lg overflow-hidden bg-slate-100">
                            {student.photoUrl ? (
                                <img src={student.photoUrl} alt="Profile" className="w-full h-full object-cover" />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center text-3xl font-bold text-brand-blue bg-blue-50">
                                    {student.name?.charAt(0).toUpperCase()}
                                </div>
                            )}
                        </div>
                        
                        {/* QR Code */}
                        <div className="w-24 h-24 bg-white p-1.5 rounded-md border-2 border-white shadow-lg mt-2 flex items-center justify-center overflow-hidden">
                            <img 
                                src={`https://api.qrserver.com/v1/create-qr-code/?size=120x120&data=${encodeURIComponent(`${window.location.origin}/id/${student.regno}`)}`}
                                alt="QR" 
                                className="w-full h-full object-contain"
                            />
                        </div>
                    </div>
                    
                    <h2 className="text-xl font-extrabold text-slate-800 uppercase tracking-wide leading-tight mb-1">{student.name}</h2>
                    <div className="bg-blue-50 px-3 py-1.5 rounded-xl inline-flex flex-col self-start mb-4 border border-blue-100/50">
                        <span className="text-brand-blue font-bold text-[11px] tracking-wide leading-tight">
                            {student.dept}
                        </span>
                        <span className="text-brand-blue/80 font-bold text-[9px] tracking-wider mt-0.5 uppercase">
                            {student.year || '1st Year'} • {student.batch || '2026-2028'} Batch
                        </span>
                    </div>

                    <div className="w-full space-y-2.5 text-[13px]">
                        <div className="flex justify-between border-b border-slate-50 pb-1.5">
                            <span className="text-slate-500 font-medium flex items-center gap-1.5"><Hash size={14}/> Reg No</span>
                            <span className="font-bold text-slate-800 tracking-wide">{student.regno}</span>
                        </div>
                        <div className="flex justify-between border-b border-slate-50 pb-1.5">
                            <span className="text-slate-500 font-medium flex items-center gap-1.5"><Calendar size={14}/> DOB</span>
                            <span className="font-bold text-slate-800">{student.dob || '-'}</span>
                        </div>
                        <div className="flex justify-between border-b border-slate-50 pb-1.5">
                            <span className="text-slate-500 font-medium flex items-center gap-1.5"><Heart size={14}/> Blood Group</span>
                            <span className="font-bold text-red-600">{student.bloodGroup || '-'}</span>
                        </div>
                        <div className="flex justify-between border-b border-slate-50 pb-1.5">
                            <span className="text-slate-500 font-medium flex items-center gap-1.5"><Phone size={14}/> Phone No</span>
                            <span className="font-bold text-slate-800">{student.phone || student.fatherName || '-'}</span>
                        </div>
                        <div className="flex justify-between pb-1 pt-1 text-[11px]">
                            <span className="text-slate-500 font-medium whitespace-nowrap mr-3">Address</span>
                            <span className="font-bold text-slate-800 text-right line-clamp-2 leading-tight">{student.address || student.city || 'Kanchipuram, Tamil Nadu'}</span>
                        </div>
                    </div>
                </div>

                {/* Bottom / Signature */}
                <div className="bg-slate-50 p-3 border-t border-slate-100 flex items-center justify-end">
                    <div className="text-right">
                        <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider mb-2">Authorized Signatory</p>
                        <div className="w-20 h-[1px] bg-slate-300 ml-auto"></div>
                        <p style={{display: 'none'}} className="font-signature text-sm font-bold text-slate-800">Principal</p>
                    </div>
                </div>


            </motion.div>
        </div>
    );
};

export default VerifyIDCard;
