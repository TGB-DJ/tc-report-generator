import { useState, useEffect } from 'react';
import { Plus, Trash2, ChevronDown, ChevronUp } from 'lucide-react';
import Input from './ui/Input';
import Button from './ui/Button';
import FeePaymentInput from './FeePaymentInput';

const StudentFeesForm = ({ fees, onChange }) => {
    // fees structure:
    // {
    //   registration: { total: 0, payments: [] },
    //   semester: { "Sem 1": { total: 0, payments: [] } }
    // }

    const [localFees, setLocalFees] = useState(fees || { registration: {}, semester: {} });
    const [expandedSection, setExpandedSection] = useState('registration'); // State for expanding sections

    useEffect(() => {
        setLocalFees(fees || { registration: { total: 0, payments: [] }, semester: {} });
    }, [fees]);

    const calculateTotal = (payments) => {
        return (payments || []).reduce((sum, p) => sum + (Number(p.amount) || 0), 0);
    };

    const updateRegistration = (field, value) => {
        const newFees = { ...localFees, registration: { ...localFees.registration, [field]: value } };
        // Recalculate paid/balance if payments change? 
        // FeePaymentInput handles payments array.
        // We will let the parent/submit handler logic calc totals if needed, or do it here.
        onChange(newFees);
    };

    const handleAddSemester = () => {
        const currentSems = Object.keys(localFees.semester || {});
        const nextSemNum = currentSems.length + 1;
        const newSemName = `Sem ${nextSemNum}`;

        const newFees = {
            ...localFees,
            semester: {
                ...localFees.semester,
                [newSemName]: { total: 0, payments: [] }
            }
        };
        onChange(newFees);
    };

    const removeSemester = (semName) => {
        const newSems = { ...localFees.semester };
        delete newSems[semName];
        onChange({ ...localFees, semester: newSems });
    };

    const updateSemester = (semName, field, value) => {
        const newFees = {
            ...localFees,
            semester: {
                ...localFees.semester,
                [semName]: { ...localFees.semester[semName], [field]: value }
            }
        };
        onChange(newFees);
    };

    // calculate derived values for display
    const regTotal = Number(localFees.registration?.total) || 0;
    const regPaid = (localFees.registration?.payments || []).reduce((sum, p) => sum + (Number(p.amount) || 0), 0);
    const regBalance = regTotal - regPaid;

    return (
        <div className="space-y-6">
            {/* Registration Fees Section */}
            <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
                <div className="flex justify-between items-center mb-4 cursor-pointer" onClick={() => setExpandedSection(prev => prev === 'registration' ? '' : 'registration')}>
                    <h3 className="text-lg font-bold text-slate-700">Registration / Admission Fees</h3>
                    <span>{expandedSection === 'registration' ? '▼' : '▶'}</span>
                </div>

                {expandedSection === 'registration' && (
                    <div className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <Input
                                label="Total Registration Fee"
                                type="number"
                                value={localFees?.registration?.total || ''}
                                onChange={(e) => updateRegistration('total', e.target.value)}
                            />
                            <div className="grid grid-cols-2 gap-2">
                                <Input
                                    label="Bill No"
                                    value={localFees?.registration?.billNo || ''}
                                    onChange={(e) => updateRegistration('billNo', e.target.value)}
                                />
                                <Input
                                    label="Bill Date"
                                    type="date"
                                    value={localFees?.registration?.billDate || ''}
                                    onChange={(e) => updateRegistration('billDate', e.target.value)}
                                />
                            </div>
                        </div>

                        {/* Registration Payments */}
                        <div className="pl-4 border-l-2 border-slate-300">
                            <h4 className="font-semibold text-sm text-slate-600 mb-2">Payment History (Registration)</h4>
                            <FeePaymentInput
                                payments={localFees?.registration?.payments || []}
                                onChange={(payments) => updateRegistration('payments', payments)}
                            />
                            <div className="mt-2 text-sm">
                                <span className="font-medium">Total Paid: </span>
                                <span className="text-green-600">₹{calculateTotal(localFees?.registration?.payments)}</span>
                                <span className="mx-2">|</span>
                                <span className="font-medium">Balance: </span>
                                <span className="text-red-600">
                                    ₹{(Number(localFees?.registration?.total) || 0) - calculateTotal(localFees?.registration?.payments)}
                                </span>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Semester Fees Section */}
            <div className="space-y-4">
                <div className="flex justify-between items-center">
                    <h4 className="font-bold text-slate-700">Semester Fees</h4>
                    <Button type="button" size="sm" onClick={handleAddSemester} variant="secondary">
                        <Plus size={16} className="mr-2" /> Add Semester
                    </Button>
                </div>

                {Object.entries(localFees.semester || {}).map(([semName, semData], index) => {
                    const semTotal = Number(semData.total) || 0;
                    const semPaid = (semData.payments || []).reduce((sum, p) => sum + (Number(p.amount) || 0), 0);
                    const semBalance = semTotal - semPaid;

                    return (
                        <div key={semName} className="p-4 border border-orange-200 rounded-xl bg-orange-50/30 relative">
                            <button
                                type="button"
                                onClick={() => removeSemester(semName)}
                                className="absolute top-4 right-4 text-orange-300 hover:text-red-500"
                                title="Remove Semester"
                            >
                                <Trash2 size={18} />
                            </button>

                            <div className="flex justify-between items-center mb-4 pr-8">
                                <h5 className="font-bold text-orange-900">{semName}</h5>
                                <div className="text-sm space-x-3">
                                    <span className="text-slate-600">Paid: <b className="text-green-600">₹{semPaid}</b></span>
                                    <span className="text-slate-600">Bal: <b className={semBalance > 0 ? "text-red-500" : "text-green-600"}>₹{semBalance}</b></span>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <Input
                                    label={`Total Fee for ${semName} (₹)`}
                                    type="number"
                                    value={semData.total || ''}
                                    onChange={(e) => updateSemester(semName, 'total', e.target.value)}
                                    placeholder="e.g. 20000"
                                    className="bg-white"
                                />
                                <div className="grid grid-cols-2 gap-2">
                                    <Input
                                        label="Bill No"
                                        value={semData.billNo || ''}
                                        onChange={(e) => updateSemester(semName, 'billNo', e.target.value)}
                                        placeholder="Bill #"
                                    />
                                    <Input
                                        label="Bill Date"
                                        type="date"
                                        value={semData.billDate || ''}
                                        onChange={(e) => updateSemester(semName, 'billDate', e.target.value)}
                                    />
                                </div>
                                <FeePaymentInput
                                    title={`${semName} Payments`}
                                    payments={semData.payments || []}
                                    onChange={(payments) => updateSemester(semName, 'payments', payments)}
                                />
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default StudentFeesForm;
