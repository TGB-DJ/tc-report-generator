import React, { useState } from 'react';
import Input from './ui/Input';
import Button from './ui/Button';
import { Trash2, Plus } from 'lucide-react';

const FeePaymentInput = ({ title = "Fee Payments", payments = [], onChange, showDescription = false }) => {
    const [localPayments, setLocalPayments] = useState(payments.length > 0 ? payments : []);

    // Sync local state when prop changes (important for edit mode)
    React.useEffect(() => {
        setLocalPayments(payments.length > 0 ? payments : []);
    }, [payments]);

    const handlePaymentChange = (index, field, value) => {
        const updated = [...localPayments];
        updated[index] = { ...updated[index], [field]: value };
        setLocalPayments(updated);
        onChange(updated);
    };

    const addPayment = () => {
        const newPayment = { billNo: '', date: '', amount: '' };
        if (showDescription) newPayment.description = '';

        const updated = [...localPayments, newPayment];
        setLocalPayments(updated);
        onChange(updated);
    };

    const removePayment = (index) => {
        const updated = localPayments.filter((_, i) => i !== index);
        setLocalPayments(updated);
        onChange(updated);
    };

    const totalPaid = localPayments.reduce((sum, p) => sum + (Number(p.amount) || 0), 0);

    return (
        <div className="space-y-4 border border-slate-200 rounded-xl p-4 bg-white/50">
            <div className="flex justify-between items-center">
                <h4 className="font-semibold text-slate-700">{title}</h4>
                <div className="text-sm text-slate-600">
                    Total: <span className="font-bold text-brand-orange">₹{totalPaid.toLocaleString()}</span>
                </div>
            </div>

            {localPayments.length === 0 && (
                <div className="text-center py-4 text-slate-400 text-sm italic">
                    No payments added yet.
                </div>
            )}

            {localPayments.map((payment, index) => (
                <div key={index} className="p-4 bg-slate-50 rounded-lg border border-slate-200 space-y-3 relative group">
                    <button
                        type="button"
                        onClick={() => removePayment(index)}
                        className="absolute top-2 right-2 text-slate-400 hover:text-red-500 transition-colors p-1"
                        title="Remove Payment"
                    >
                        <Trash2 size={16} />
                    </button>

                    <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
                        <div className="md:col-span-3">
                            <Input
                                label="Bill Number"
                                value={payment.billNo}
                                onChange={(e) => handlePaymentChange(index, 'billNo', e.target.value)}
                                placeholder="BILL001"
                                required
                                autoComplete="off" // No specific autocomplete needed
                            />
                        </div>
                        <div className="md:col-span-3">
                            <Input
                                label="Date"
                                type="date"
                                value={payment.date}
                                onChange={(e) => handlePaymentChange(index, 'date', e.target.value)}
                                required
                            />
                        </div>
                        {showDescription && (
                            <div className="md:col-span-3">
                                <Input
                                    label="Description"
                                    value={payment.description}
                                    onChange={(e) => handlePaymentChange(index, 'description', e.target.value)}
                                    placeholder="e.g. Lab Fee"
                                    required
                                />
                            </div>
                        )}
                        <div className={showDescription ? "md:col-span-3" : "md:col-span-6"}>
                            <Input
                                label="Amount (₹)"
                                type="number"
                                value={payment.amount}
                                onChange={(e) => handlePaymentChange(index, 'amount', e.target.value)}
                                placeholder="0"
                                required
                            />
                        </div>
                    </div>
                </div>
            ))}

            <Button
                type="button"
                variant="ghost"
                onClick={addPayment}
                className="w-full border-dashed border-2 border-slate-200 hover:border-brand-orange/50 hover:bg-brand-orange/5"
            >
                <Plus size={16} className="mr-2" />
                Add {title} Entry
            </Button>
        </div>
    );
};


export default FeePaymentInput;
