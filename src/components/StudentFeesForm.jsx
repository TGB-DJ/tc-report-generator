import { useState, useEffect } from 'react';
import { Plus, Trash2, ChevronDown, ChevronUp } from 'lucide-react';
import Input from './ui/Input';
import Button from './ui/Button';
import FeePaymentInput from './FeePaymentInput';

const StudentFeesForm = ({ fees, onChange }) => {
    const defaultFees = { registration: {}, semester: {}, busFee: {}, otherFees: [], baseSemFee: '' };
    const [localFees, setLocalFees] = useState(fees || defaultFees);
    const [expandedSection, setExpandedSection] = useState('registration');

    useEffect(() => {
        setLocalFees(fees || defaultFees);
        // eslint-disable-next-line
    }, [fees]);

    const calculateTotal = (payments) => {
        return (payments || []).reduce((sum, p) => sum + (Number(p.amount) || 0), 0);
    };

    const updateRegistration = (field, value) => {
        const newFees = { ...localFees, registration: { ...localFees.registration, [field]: value } };
        onChange(newFees);
    };

    const handleAddSemester = () => {
        const currentSems = Object.keys(localFees.semester || {});
        const nextSemNum = currentSems.length + 1;
        const newSemName = `Sem ${nextSemNum}`;
        const baseFee = Number(localFees.baseSemFee) || 0;

        const newFees = {
            ...localFees,
            semester: {
                ...localFees.semester,
                [newSemName]: { total: baseFee, payments: [] }
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

    const updateBusFee = (field, value) => {
        const newFees = { ...localFees, busFee: { ...localFees.busFee, [field]: value } };
        onChange(newFees);
    };

    const handleAddOtherFee = () => {
        const newOtherFees = [...(localFees.otherFees || []), { desc: '', total: 0, payments: [] }];
        onChange({ ...localFees, otherFees: newOtherFees });
    };

    const removeOtherFee = (index) => {
        const newOtherFees = [...(localFees.otherFees || [])];
        newOtherFees.splice(index, 1);
        onChange({ ...localFees, otherFees: newOtherFees });
    };

    const updateOtherFee = (index, field, value) => {
        const newOtherFees = [...(localFees.otherFees || [])];
        newOtherFees[index] = { ...newOtherFees[index], [field]: value };
        onChange({ ...localFees, otherFees: newOtherFees });
    };

    const toggleSection = (section) => {
        setExpandedSection(prev => prev === section ? '' : section);
    };

    return (
        <div className="space-y-6">
            {/* Registration Fees Section */}
            <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
                <div className="flex justify-between items-center mb-4 cursor-pointer" onClick={() => toggleSection('registration')}>
                    <h3 className="text-lg font-bold text-slate-700">Registration / Admission Fees</h3>
                    <span>{expandedSection === 'registration' ? <ChevronUp size={20} /> : <ChevronDown size={20} />}</span>
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
                        </div>
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
            <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
                <div className="flex justify-between items-center mb-4 cursor-pointer" onClick={() => toggleSection('semester')}>
                    <h3 className="text-lg font-bold text-slate-700">Semester Fees</h3>
                    <span>{expandedSection === 'semester' ? <ChevronUp size={20} /> : <ChevronDown size={20} />}</span>
                </div>

                {expandedSection === 'semester' && (
                    <div className="space-y-4">
                        <div className="flex flex-col md:flex-row md:items-end gap-4 mb-4">
                            <div className="flex-1">
                                <Input
                                    label="Standard Semester Fee Amount (Applied to new semesters)"
                                    type="number"
                                    value={localFees.baseSemFee || ''}
                                    onChange={(e) => onChange({ ...localFees, baseSemFee: e.target.value })}
                                    placeholder="e.g. 25000"
                                />
                            </div>
                            <Button type="button" onClick={handleAddSemester} variant="primary" className="mb-1">
                                <Plus size={16} className="mr-2" /> Add Semester
                            </Button>
                        </div>

                        {Object.entries(localFees.semester || {}).map(([semName, semData]) => {
                            const semTotal = Number(semData.total) || 0;
                            const semPaid = calculateTotal(semData.payments);
                            const semBalance = semTotal - semPaid;

                            return (
                                <div key={semName} className="p-4 border border-blue-200 rounded-xl bg-blue-50/30 relative">
                                    <button
                                        type="button"
                                        onClick={() => removeSemester(semName)}
                                        className="absolute top-4 right-4 text-blue-300 hover:text-red-500"
                                        title="Remove Semester"
                                    >
                                        <Trash2 size={18} />
                                    </button>

                                    <div className="flex justify-between items-center mb-4 pr-8">
                                        <h5 className="font-bold text-blue-900">{semName}</h5>
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
                )}
            </div>

            {/* Bus Fees Section */}
            <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
                <div className="flex justify-between items-center mb-4 cursor-pointer" onClick={() => toggleSection('bus')}>
                    <h3 className="text-lg font-bold text-slate-700">Bus Fees</h3>
                    <span>{expandedSection === 'bus' ? <ChevronUp size={20} /> : <ChevronDown size={20} />}</span>
                </div>

                {expandedSection === 'bus' && (
                    <div className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <Input
                                label="Bus Number"
                                type="text"
                                value={localFees?.busFee?.busNo || ''}
                                onChange={(e) => updateBusFee('busNo', e.target.value)}
                                placeholder="e.g. TN-01-AB-1234 or Bus 5"
                            />
                            <Input
                                label="Stopping Point"
                                type="text"
                                value={localFees?.busFee?.stopping || ''}
                                onChange={(e) => updateBusFee('stopping', e.target.value)}
                                placeholder="e.g. Main Street"
                            />
                            <Input
                                label="Total Bus Fee"
                                type="number"
                                value={localFees?.busFee?.total || ''}
                                onChange={(e) => updateBusFee('total', e.target.value)}
                            />
                        </div>
                        <div className="pl-4 border-l-2 border-slate-300">
                            <h4 className="font-semibold text-sm text-slate-600 mb-2">Payment History (Bus)</h4>
                            <FeePaymentInput
                                payments={localFees?.busFee?.payments || []}
                                onChange={(payments) => updateBusFee('payments', payments)}
                            />
                            <div className="mt-2 text-sm">
                                <span className="font-medium">Total Paid: </span>
                                <span className="text-green-600">₹{calculateTotal(localFees?.busFee?.payments)}</span>
                                <span className="mx-2">|</span>
                                <span className="font-medium">Balance: </span>
                                <span className="text-red-600">
                                    ₹{(Number(localFees?.busFee?.total) || 0) - calculateTotal(localFees?.busFee?.payments)}
                                </span>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Other Fees Section */}
            <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
                <div className="flex justify-between items-center mb-4 cursor-pointer" onClick={() => toggleSection('other')}>
                    <h3 className="text-lg font-bold text-slate-700">Other Fees</h3>
                    <div className="flex items-center gap-4">
                        {expandedSection === 'other' && (
                            <Button type="button" size="sm" onClick={(e) => { e.stopPropagation(); handleAddOtherFee(); }} variant="secondary">
                                <Plus size={16} className="mr-2" /> Add Fee
                            </Button>
                        )}
                        <span>{expandedSection === 'other' ? <ChevronUp size={20} /> : <ChevronDown size={20} />}</span>
                    </div>
                </div>

                {expandedSection === 'other' && (
                    <div className="space-y-4">
                        {(localFees.otherFees || []).map((fee, index) => {
                            const feeTotal = Number(fee.total) || 0;
                            const feePaid = calculateTotal(fee.payments);
                            const feeBalance = feeTotal - feePaid;

                            return (
                                <div key={index} className="p-4 border border-purple-200 rounded-xl bg-purple-50/30 relative">
                                    <button
                                        type="button"
                                        onClick={() => removeOtherFee(index)}
                                        className="absolute top-4 right-4 text-purple-300 hover:text-red-500"
                                        title="Remove Fee"
                                    >
                                        <Trash2 size={18} />
                                    </button>

                                    <div className="flex justify-between items-center mb-4 pr-8">
                                        <h5 className="font-bold text-purple-900">Fee #{index + 1}</h5>
                                        <div className="text-sm space-x-3">
                                            <span className="text-slate-600">Paid: <b className="text-green-600">₹{feePaid}</b></span>
                                            <span className="text-slate-600">Bal: <b className={feeBalance > 0 ? "text-red-500" : "text-green-600"}>₹{feeBalance}</b></span>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                                        <Input
                                            label="Fee Description"
                                            type="text"
                                            value={fee.desc || ''}
                                            onChange={(e) => updateOtherFee(index, 'desc', e.target.value)}
                                            placeholder="e.g. Library Penalty, Exam Fee"
                                            className="bg-white"
                                        />
                                        <Input
                                            label="Total Fee Amount (₹)"
                                            type="number"
                                            value={fee.total || ''}
                                            onChange={(e) => updateOtherFee(index, 'total', e.target.value)}
                                            className="bg-white"
                                        />
                                    </div>

                                    <FeePaymentInput
                                        title={`Payments for ${fee.desc || `Fee #${index + 1}`}`}
                                        payments={fee.payments || []}
                                        onChange={(payments) => updateOtherFee(index, 'payments', payments)}
                                    />
                                </div>
                            );
                        })}
                        {!(localFees.otherFees || []).length && (
                            <p className="text-sm text-slate-500 text-center py-4">No other fees added. Click 'Add Fee' to create one.</p>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default StudentFeesForm;
