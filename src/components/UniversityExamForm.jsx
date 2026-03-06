import { useState, useEffect } from 'react';
import { Plus, Trash2, ChevronDown, ChevronUp } from 'lucide-react';
import Button from './ui/Button';
import Input from './ui/Input';

const UniversityExamForm = ({ exams = [], onChange }) => {
    // exams is an array of sessions: [{ semester: "1", examSession: "April 2025", results: [] }]

    const handleAddSession = () => {
        onChange([
            ...exams,
            {
                semester: "",
                examSession: "",
                results: []
            }
        ]);
    };

    const handleRemoveSession = (index) => {
        const newExams = exams.filter((_, i) => i !== index);
        onChange(newExams);
    };

    const handleSessionChange = (index, field, value) => {
        const newExams = [...exams];
        newExams[index] = { ...newExams[index], [field]: value };
        onChange(newExams);
    };

    const handleAddSubject = (sessionIndex) => {
        const newExams = [...exams];
        newExams[sessionIndex].results.push({
            subjectCode: "",
            ue: "",
            ia: "",
            total: "",
            result: "",
            remark: ""
        });
        onChange(newExams);
    };

    const handleRemoveSubject = (sessionIndex, subjectIndex) => {
        const newExams = [...exams];
        newExams[sessionIndex].results = newExams[sessionIndex].results.filter((_, i) => i !== subjectIndex);
        onChange(newExams);
    };

    const handleSubjectChange = (sessionIndex, subjectIndex, field, value) => {
        const newExams = [...exams];
        const subject = { ...newExams[sessionIndex].results[subjectIndex], [field]: value };

        // Auto-calculate Total
        if (field === 'ue' || field === 'ia') {
            const ue = Number(field === 'ue' ? value : subject.ue) || 0;
            const ia = Number(field === 'ia' ? value : subject.ia) || 0;
            subject.total = (ue + ia).toString();

            // Simple Pass Logic (Example: Total >= 40)
            if (subject.total >= 40) subject.result = "PASS";
            else subject.result = "FAIL";
        }

        newExams[sessionIndex].results[subjectIndex] = subject;
        onChange(newExams);
    };

    return (
        <div className="space-y-4 border rounded-xl p-4 bg-slate-50">
            <div className="flex justify-between items-center">
                <h4 className="font-semibold text-slate-700">University Exam Records</h4>
                <Button type="button" size="sm" onClick={handleAddSession} variant="secondary">
                    <Plus size={16} className="mr-2" /> Add Session
                </Button>
            </div>

            {exams.length === 0 && (
                <p className="text-center text-slate-400 text-sm py-4">No exam records added.</p>
            )}

            {exams.map((session, sIndex) => (
                <div key={sIndex} className="bg-white border border-slate-200 rounded-lg p-4 shadow-sm">
                    <div className="flex justify-between items-start gap-4 mb-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 flex-1">
                            <Input
                                label="Semester"
                                value={session.semester}
                                onChange={(e) => handleSessionChange(sIndex, 'semester', e.target.value)}
                                placeholder="e.g. 1"
                            />
                            <Input
                                label="Session Name"
                                value={session.examSession}
                                onChange={(e) => handleSessionChange(sIndex, 'examSession', e.target.value)}
                                placeholder="e.g. April-2025"
                            />
                        </div>
                        <button
                            type="button"
                            onClick={() => handleRemoveSession(sIndex)}
                            className="text-red-400 hover:text-red-600 p-2"
                            title="Remove Session"
                        >
                            <Trash2 size={18} />
                        </button>
                    </div>

                    {/* Subjects Table */}
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead className="bg-slate-100 text-slate-600">
                                <tr>
                                    <th className="p-2 text-left">Code</th>
                                    <th className="p-2 text-left w-20">UE</th>
                                    <th className="p-2 text-left w-20">IA</th>
                                    <th className="p-2 text-left w-20">Total</th>
                                    <th className="p-2 text-left w-24">Result</th>
                                    <th className="p-2 text-left">Remark</th>
                                    <th className="p-2 w-10"></th>
                                </tr>
                            </thead>
                            <tbody>
                                {session.results.map((sub, subIndex) => (
                                    <tr key={subIndex} className="border-b border-slate-50 last:border-0">
                                        <td className="p-2">
                                            <input
                                                className="w-full border rounded p-1"
                                                value={sub.subjectCode}
                                                onChange={(e) => handleSubjectChange(sIndex, subIndex, 'subjectCode', e.target.value)}
                                                placeholder="Sub Code"
                                            />
                                        </td>
                                        <td className="p-2">
                                            <input
                                                type="number"
                                                className="w-full border rounded p-1"
                                                value={sub.ue}
                                                onChange={(e) => handleSubjectChange(sIndex, subIndex, 'ue', e.target.value)}
                                            />
                                        </td>
                                        <td className="p-2">
                                            <input
                                                type="number"
                                                className="w-full border rounded p-1"
                                                value={sub.ia}
                                                onChange={(e) => handleSubjectChange(sIndex, subIndex, 'ia', e.target.value)}
                                            />
                                        </td>
                                        <td className="p-2">
                                            <input
                                                className="w-full border rounded p-1 bg-slate-50 font-bold"
                                                value={sub.total}
                                                readOnly
                                            />
                                        </td>
                                        <td className="p-2">
                                            <select
                                                className={`w-full border rounded p-1 font-bold ${sub.result === 'PASS' ? 'text-green-600' : 'text-red-600'}`}
                                                value={sub.result}
                                                onChange={(e) => handleSubjectChange(sIndex, subIndex, 'result', e.target.value)}
                                            >
                                                <option value="">-</option>
                                                <option value="PASS">PASS</option>
                                                <option value="FAIL">FAIL</option>
                                                <option value="ABSENT">ABSENT</option>
                                            </select>
                                        </td>
                                        <td className="p-2">
                                            <input
                                                className="w-full border rounded p-1"
                                                value={sub.remark}
                                                onChange={(e) => handleSubjectChange(sIndex, subIndex, 'remark', e.target.value)}
                                            />
                                        </td>
                                        <td className="p-2">
                                            <button
                                                type="button"
                                                onClick={() => handleRemoveSubject(sIndex, subIndex)}
                                                className="text-slate-400 hover:text-red-500"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                    <div className="mt-2">
                        <Button type="button" size="xs" variant="ghost" onClick={() => handleAddSubject(sIndex)}>
                            <Plus size={14} className="mr-1" /> Add Subject
                        </Button>
                    </div>
                </div>
            ))}
        </div>
    );
};

export default UniversityExamForm;
