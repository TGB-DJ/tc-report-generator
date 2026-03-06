import { useState, useEffect } from 'react';
import { Plus, Trash2, ChevronDown, ChevronUp } from 'lucide-react';
import Button from './ui/Button';
import Input from './ui/Input';

const MonthlyTestForm = ({ tests = {}, onChange }) => {
    // tests structure: { "July 2025": { subjects: [], attendance: 0, totalDays: 0, attPercentage: 0 } }

    const [localTests, setLocalTests] = useState(tests || {});

    useEffect(() => {
        setLocalTests(tests || {});
    }, [tests]);

    const handleAddMonth = () => {
        const monthName = prompt("Enter Month (e.g. July 2025):");
        if (monthName && !localTests[monthName]) {
            const newTests = {
                ...localTests,
                [monthName]: {
                    subjects: [],
                    attendance: 0,
                    totalDays: 0,
                    attPercentage: 0
                }
            };
            onChange(newTests);
        }
    };

    const handleRemoveMonth = (month) => {
        if (window.confirm(`Are you sure you want to delete ${month}?`)) {
            const newTests = { ...localTests };
            delete newTests[month];
            onChange(newTests);
        }
    };

    const handleMonthDataChange = (month, field, value) => {
        const newTests = { ...localTests };
        const monthData = { ...newTests[month], [field]: value };

        // Auto-calc percentage
        if (field === 'attendance' || field === 'totalDays') {
            const att = Number(field === 'attendance' ? value : monthData.attendance) || 0;
            const total = Number(field === 'totalDays' ? value : monthData.totalDays) || 0;
            if (total > 0) {
                monthData.attPercentage = ((att / total) * 100).toFixed(1);
            } else {
                monthData.attPercentage = 0;
            }
        }

        newTests[month] = monthData;
        onChange(newTests);
    };

    const handleAddSubject = (month) => {
        const newTests = { ...localTests };
        newTests[month].subjects.push({ name: "", mark: "", total: 50 });
        onChange(newTests);
    };

    const handleRemoveSubject = (month, index) => {
        const newTests = { ...localTests };
        newTests[month].subjects = newTests[month].subjects.filter((_, i) => i !== index);
        onChange(newTests);
    };

    const handleSubjectChange = (month, index, field, value) => {
        const newTests = { ...localTests };
        newTests[month].subjects[index] = { ...newTests[month].subjects[index], [field]: value };
        onChange(newTests);
    };

    return (
        <div className="space-y-4 border rounded-xl p-4 bg-purple-50/30">
            <div className="flex justify-between items-center">
                <h4 className="font-semibold text-slate-700">Monthly Tests & Attendance</h4>
                <Button type="button" size="sm" onClick={handleAddMonth} variant="secondary">
                    <Plus size={16} className="mr-2" /> Add Month
                </Button>
            </div>

            {Object.keys(localTests).length === 0 && (
                <p className="text-center text-slate-400 text-sm py-4">No monthly tests added.</p>
            )}

            {Object.entries(localTests).map(([month, data]) => (
                <div key={month} className="bg-white border border-purple-100 rounded-lg p-4 shadow-sm relative">
                    <button
                        type="button"
                        onClick={() => handleRemoveMonth(month)}
                        className="absolute top-4 right-4 text-slate-300 hover:text-red-500"
                        title="Remove Month"
                    >
                        <Trash2 size={18} />
                    </button>

                    <h5 className="font-bold text-purple-900 mb-4">{month}</h5>

                    {/* Attendance Section */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4 bg-purple-50 p-3 rounded-lg">
                        <Input
                            label="Days Present"
                            type="number"
                            value={data.attendance}
                            onChange={(e) => handleMonthDataChange(month, 'attendance', e.target.value)}
                        />
                        <Input
                            label="Total Working Days"
                            type="number"
                            value={data.totalDays}
                            onChange={(e) => handleMonthDataChange(month, 'totalDays', e.target.value)}
                        />
                        <div className="flex flex-col justify-end">
                            <label className="text-xs font-semibold text-slate-500 mb-1">Percentage</label>
                            <div className="h-10 px-3 flex items-center bg-white border rounded font-bold text-purple-700">
                                {data.attPercentage}%
                            </div>
                        </div>
                    </div>

                    {/* Subjects Table */}
                    <div className="mb-2">
                        <div className="flex justify-between items-center mb-2">
                            <span className="text-sm font-semibold text-slate-600">Subjects</span>
                            <Button type="button" size="xs" variant="ghost" onClick={() => handleAddSubject(month)}>
                                <Plus size={14} className="mr-1" /> Add Subject
                            </Button>
                        </div>
                        <div className="space-y-2">
                            {data.subjects.map((sub, index) => (
                                <div key={index} className="flex gap-2 items-center">
                                    <input
                                        className="flex-1 border rounded p-1 text-sm"
                                        placeholder="Subject Name"
                                        value={sub.name}
                                        onChange={(e) => handleSubjectChange(month, index, 'name', e.target.value)}
                                    />
                                    <input
                                        className="w-20 border rounded p-1 text-sm"
                                        placeholder="Mark"
                                        type="number"
                                        value={sub.mark}
                                        onChange={(e) => handleSubjectChange(month, index, 'mark', e.target.value)}
                                    />
                                    <span className="text-slate-400">/</span>
                                    <input
                                        className="w-20 border rounded p-1 text-sm bg-slate-50"
                                        placeholder="Total"
                                        type="number"
                                        value={sub.total}
                                        onChange={(e) => handleSubjectChange(month, index, 'total', e.target.value)}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => handleRemoveSubject(month, index)}
                                        className="text-slate-400 hover:text-red-500"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
};

export default MonthlyTestForm;
