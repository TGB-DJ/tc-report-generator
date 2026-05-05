
import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { Loader2, Printer } from 'lucide-react';
import Button from '../../components/ui/Button';

const UniversityMarkSheet = () => {
    const { currentUser } = useAuth();
    const [studentData, setStudentData] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchStudentData = async () => {
            if (currentUser?.uid) {
                try {
                    const docRef = doc(db, "students", currentUser.uid);
                    const docSnap = await getDoc(docRef);
                    if (docSnap.exists()) {
                        setStudentData({ id: docSnap.id, ...docSnap.data() });
                    }
                } catch (error) {
                    console.error("Error fetching student data:", error);
                } finally {
                    setLoading(false);
                }
            } else {
                setLoading(false);
            }
        };

        fetchStudentData();
    }, [currentUser]);

    if (loading) {
        return <div className="flex justify-center items-center h-screen"><Loader2 className="animate-spin text-brand-blue" size={40} /></div>;
    }

    if (!studentData || !studentData.academicRecords?.universityExams) {
        return <div className="text-center p-10 text-slate-500">No University Exam results found.</div>;
    }

    // Attempt to get the latest exam session or map all
    // For now, let's display the first one or loop through them. 
    // The screenshot shows one session: "April-2025 - All UG Examination Results..."
    const examSessions = studentData.academicRecords.universityExams;

    return (
        <div className="min-h-screen bg-slate-50 p-4 md:p-8 font-sans">
            <div className="max-w-4xl mx-auto mb-4 flex justify-end print:hidden">
                <Button onClick={() => window.print()}>
                    <Printer size={16} className="mr-2" /> Print Mark Sheet
                </Button>
            </div>
            {examSessions.map((session, index) => (
                <div key={index} className="max-w-4xl mx-auto bg-white shadow-lg border border-slate-200 mb-8 print:shadow-none print:border-0">

                    {/* Header Section */}
                    <div className="text-center space-y-2 mb-6 pt-4">
                        <h1 className="text-2xl md:text-3xl font-bold text-red-700 font-serif uppercase tracking-wider scale-y-110">University of Madras</h1>
                        <h2 className="text-blue-800 font-bold text-lg md:text-xl border-b-2 border-blue-800 inline-block px-4 pb-1">
                            {session.examSession}
                        </h2>
                    </div>

                    {/* Student Details Box */}
                    <div className="bg-[#E6E6FA] border border-blue-300 p-4 mb-6 grid grid-cols-1 md:grid-cols-2 gap-y-2 gap-x-8 text-blue-900 font-bold text-sm md:text-base shadow-inner">
                        <div className="flex">
                            <span className="w-36 text-blue-800">Name</span>
                            <span className="mr-2">:</span>
                            <span className="uppercase tracking-wide">{studentData.name}</span>
                        </div>
                        <div className="flex">
                            <span className="w-36 text-blue-800">Register Number</span>
                            <span className="mr-2">:</span>
                            <span>{studentData.regno}</span>
                        </div>
                        <div className="flex">
                            <span className="w-36 text-blue-800">Date of Birth</span>
                            <span className="mr-2">:</span>
                            <span>{studentData.dob}</span>
                        </div>
                    </div>

                    {/* Results Table */}
                    <div className="overflow-x-auto mb-6">
                        <table className="w-full border-collapse border border-green-600 text-sm md:text-base font-sans">
                            <thead>
                                <tr className="bg-[#90EE90] text-center font-bold text-black border-b border-green-600">
                                    <th className="p-2 border-r border-green-600 w-1/6">Subject Code</th>
                                    <th className="p-2 border-r border-green-600 w-1/12">UE</th>
                                    <th className="p-2 border-r border-green-600 w-1/12">IA</th>
                                    <th className="p-2 border-r border-green-600 w-1/12">Total</th>
                                    <th className="p-2 border-r border-green-600 w-1/6">Result</th>
                                    <th className="p-2 text-left pl-4">Remark</th>
                                </tr>
                            </thead>
                            <tbody>
                                {session.results.map((subject, subIndex) => (
                                    <tr key={subIndex} className="text-center bg-[#E0FFFF] border-b border-green-400 text-blue-900 font-semibold">
                                        <td className="p-2 border-r border-green-400">{subject.subjectCode}</td>
                                        <td className="p-2 border-r border-green-400">{subject.ue}</td>
                                        <td className="p-2 border-r border-green-400">{subject.ia}</td>
                                        <td className="p-2 border-r border-green-400 text-black">{subject.total}</td>
                                        <td className={`p-2 border-r border-green-400 ${subject.result === 'PASS' ? 'text-green-700' : 'text-red-600'}`}>
                                            {subject.result}
                                        </td>
                                        <td className="p-2 text-left pl-4 text-black">{subject.remark}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* Footer / Legend */}
                    <div className="p-4 space-y-4 text-xs md:text-sm text-slate-700 bg-blue-50/50">
                        <div className="flex gap-4 justify-center font-medium">
                            <span>AAA - Absent</span>
                            <span>**RA - REAPPEAR(from 2009-10 Batch)</span>
                        </div>

                        <div className="space-y-2 text-justify">
                            <p className="font-bold text-black">
                                The results published through websites are provisional only. We are not responsible for any inadvertent error that may have been crept in the data / results being published on the websites. This is being published on the websites just for the immediate information to the examinees. The final Marksheets issued by the University of Madras should only be treated as authentic and final in this regard.
                            </p>
                        </div>

                        <div className="mt-4 border-t border-slate-200 pt-2 text-center text-slate-500 text-xs">
                            Generated via College Management System
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
};

export default UniversityMarkSheet;
