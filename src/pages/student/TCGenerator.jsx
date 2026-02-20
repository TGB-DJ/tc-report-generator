import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { useAuth } from '../../context/AuthContext';
import Button from '../../components/ui/Button';
import { ArrowLeft } from 'lucide-react';

const TCGenerator = () => {
    const navigate = useNavigate();
    const { user } = useAuth();
    const [student, setStudent] = useState(null);
    const [loading, setLoading] = useState(true);
    const [tcData, setTcData] = useState({
        folioNo: '',
        admissionNo: '',
        date: new Date().toLocaleDateString('en-GB').replace(/\//g, '.')
    });

    useEffect(() => {
        const fetchProfile = async () => {
            try {
                const docRef = doc(db, "students", user.uid);
                const docSnap = await getDoc(docRef);
                if (docSnap.exists()) {
                    const data = docSnap.data();
                    setStudent(data);

                    // Generate folio number
                    const folioNo = `${new Date().getFullYear()}${data.regno || '0000'}`;
                    setTcData(prev => ({
                        ...prev,
                        folioNo: folioNo,
                        admissionNo: data.admissionNo || 'N/A'
                    }));
                }
            } catch (error) {
                console.error("Error:", error);
            } finally {
                setLoading(false);
            }
        };
        if (user) fetchProfile();
    }, [user]);



    if (loading) return <div className="p-10 text-center">Loading...</div>;
    if (!student) return <div className="p-10 text-center">Student not found.</div>;

    return (
        <div className="max-w-4xl mx-auto p-4">
            {/* Navigation Button */}
            <div className="mb-4 no-print">
                <Button variant="outline" onClick={() => navigate('/student')}>
                    <ArrowLeft size={16} className="mr-2" />
                    Back to Dashboard
                </Button>
            </div>

            {/* TC Document - Wrapper for Print Targeting */}
            <div className="tc-print-container">
                <div
                    className="tc-content-border bg-white mx-auto p-12 border-2 border-blue-900" // Simple solid border
                    style={{
                        fontFamily: 'Times New Roman, serif',
                        fontFamily: 'Times New Roman, serif',
                        maxWidth: '210mm'
                    }}
                >
                    {/* Header with Logo */}
                    <div className="text-center mb-6">
                        <div className="flex items-center justify-center gap-4 mb-4">
                            {/* College Logo */}
                            <div className="w-24 h-24 flex-shrink-0">
                                <img
                                    src="/college-logo.png"
                                    alt="College Logo"
                                    className="w-full h-full object-contain"
                                    onError={(e) => { e.target.style.display = 'none'; }}
                                />
                            </div>

                            <div className="flex-1 text-center">
                                <h1 className="text-3xl font-bold uppercase tracking-wide text-blue-900" style={{ letterSpacing: '1px' }}>
                                    KANCHI SHRI KRISHNA
                                </h1>
                                <h2 className="text-2xl font-bold uppercase text-blue-900">
                                    COLLEGE OF ARTS AND SCIENCE
                                </h2>
                                <p className="text-sm mt-1 font-bold text-slate-700">
                                    NATIONAL ASSESSMENT AND ACCREDITATION COUNCIL (NAAC) 'B' GRADE
                                </p>
                                <p className="text-sm font-bold text-slate-700">
                                    Kilambi, Pin: 631 551. &nbsp;&nbsp; Kancheepuram Tk.
                                </p>
                            </div>
                        </div>

                        <div className="flex justify-between items-center mt-4 text-sm px-4 font-bold">
                            <div>
                                Folio No. <span className="text-lg ml-2">{tcData.folioNo}</span>
                            </div>
                            <div>
                                Admission No. <span className="text-lg ml-2">{tcData.admissionNo}</span>
                            </div>
                        </div>
                    </div>

                    {/* Title */}
                    <div className="text-center mb-8">
                        <h3 className="inline-block text-2xl font-bold uppercase border-b-4 border-double border-black pb-1 tracking-wider">
                            TRANSFER CERTIFICATE
                        </h3>
                    </div>

                    {/* TC Fields */}
                    <div className="space-y-3 text-sm px-2 font-medium">
                        {/* Field 1 */}
                        <div className="flex items-baseline">
                            <div className="w-8">1.</div>
                            <div className="w-64">Name of the Student</div>
                            <div className="flex-1 border-b border-dotted border-black pl-2 font-bold uppercase text-lg">
                                : {student.name || 'N/A'}
                            </div>
                        </div>

                        {/* Field 2 */}
                        <div className="flex items-baseline">
                            <div className="w-8">2.</div>
                            <div className="w-64">Father's Name /Guardian</div>
                            <div className="flex-1 border-b border-dotted border-black pl-2 uppercase">
                                : {student.fatherName || 'N/A'}
                            </div>
                        </div>

                        {/* Field 3 */}
                        <div className="flex items-baseline">
                            <div className="w-8">3.</div>
                            <div className="w-64">Nationality</div>
                            <div className="flex-1 border-b border-dotted border-black pl-2 uppercase">
                                : {student.nationality || 'INDIAN'}
                            </div>
                        </div>

                        {/* Field 4 */}
                        <div className="flex items-baseline">
                            <div className="w-8">4.</div>
                            <div className="w-64">Religion & Community</div>
                            <div className="flex-1 border-b border-dotted border-black pl-2 uppercase">
                                : {student.religion || 'N/A'} {student.community ? `(${student.community})` : ''}
                            </div>
                        </div>

                        {/* Field 5 */}
                        <div className="flex items-baseline">
                            <div className="w-8">5.</div>
                            <div className="w-64">Date of birth as entered<br />in the Admission Register</div>
                            <div className="flex-1 border-b border-dotted border-black pl-2 uppercase">
                                : {student.dob ? new Date(student.dob).toLocaleDateString('en-GB').replace(/\//g, '.') : 'N/A'} <span className="ml-2 text-xs normal-case">[ {student.dob ? new Intl.DateTimeFormat('en-US', { day: 'numeric', month: 'long', year: 'numeric' }).format(new Date(student.dob)) : ''} ]</span>
                            </div>
                        </div>

                        {/* Field 6 */}
                        <div className="flex items-baseline">
                            <div className="w-8">6.</div>
                            <div className="w-64">Class in which the Student<br />was studying at the time of<br />leaving</div>
                            <div className="flex-1 border-b border-dotted border-black pl-2 uppercase">
                                : {student.class || 'N/A'}, {student.dept || 'N/A'}
                            </div>
                        </div>

                        {/* Field 7 */}
                        <div className="flex items-baseline">
                            <div className="w-8">7.</div>
                            <div className="w-64">Date of Admission</div>
                            <div className="flex-1 border-b border-dotted border-black pl-2 uppercase">
                                : {student.admissionDate ? new Date(student.admissionDate).toLocaleDateString('en-GB').replace(/\//g, '.') : 'N/A'}
                            </div>
                        </div>

                        {/* Field 8 */}
                        <div className="flex items-baseline">
                            <div className="w-8">8.</div>
                            <div className="w-64">Whether qualified for<br />Promotion to higher class</div>
                            <div className="flex-1 border-b border-dotted border-black pl-2 uppercase">
                                : {student.promotion || 'REFER MARK LIST'}
                            </div>
                        </div>

                        {/* Field 9 */}
                        <div className="flex items-baseline">
                            <div className="w-8">9.</div>
                            <div className="w-64">Whether the Student has<br />paid all the fees due to the<br />College</div>
                            <div className="flex-1 border-b border-dotted border-black pl-2 uppercase">
                                : {student.fees?.balance <= 0 ? 'YES' : 'NO'}
                            </div>
                        </div>

                        {/* Field 10 */}
                        <div className="flex items-baseline">
                            <div className="w-8">10.</div>
                            <div className="w-64">Date on which the Student<br />actually left the College</div>
                            <div className="flex-1 border-b border-dotted border-black pl-2 uppercase">
                                : {student.leavingDate ? new Date(student.leavingDate).toLocaleDateString('en-GB').replace(/\//g, '.') : tcData.date}
                            </div>
                        </div>

                        {/* Field 11 */}
                        <div className="flex items-baseline">
                            <div className="w-8">11.</div>
                            <div className="w-64">Date of the Transfer Certificate</div>
                            <div className="flex-1 border-b border-dotted border-black pl-2 uppercase">
                                : {tcData.date}
                            </div>
                        </div>

                        {/* Field 12 */}
                        <div className="flex items-baseline">
                            <div className="w-8">12.</div>
                            <div className="w-64">Student's Conduct & Character</div>
                            <div className="flex-1 border-b border-dotted border-black pl-2 uppercase">
                                : {student.conduct || 'GOOD'}
                            </div>
                        </div>
                    </div>

                    {/* Footer with Date and Signatures */}
                    <div className="mt-16 px-4 flex justify-between items-end">
                        <div>
                            <p className="text-sm font-bold">Date: {tcData.date}</p>
                        </div>
                        <div className="text-center">
                            <div className="mb-8">
                                {/* Placeholder for Signature Image */}
                            </div>
                            <p className="font-bold border-t border-black pt-2 w-48 text-center mx-auto">PRINCIPAL</p>
                            <p className="text-xs text-slate-500 uppercase">Kanchi Shri Krishna College of<br />Arts and Science</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default TCGenerator;
