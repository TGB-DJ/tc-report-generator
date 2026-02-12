import React from 'react';

const Select = ({ label, name, value, onChange, options, required, className = '', groupedOptions = null }) => {
    return (
        <div className="space-y-2">
            {label && (
                <label className="block text-sm font-medium text-slate-700">
                    {label} {required && <span className="text-red-500">*</span>}
                </label>
            )}
            <select
                name={name}
                value={value}
                onChange={onChange}
                required={required}
                className={`w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-orange focus:border-transparent transition-all ${className}`}
            >
                <option value="">Select {label}</option>
                {groupedOptions ? (
                    Object.entries(groupedOptions).map(([category, items]) => (
                        <optgroup key={category} label={category}>
                            {items.map((item) => (
                                <option key={item} value={item}>
                                    {item}
                                </option>
                            ))}
                        </optgroup>
                    ))
                ) : (
                    options?.map((option) => {
                        const isObject = typeof option === 'object' && option !== null;
                        const value = isObject ? option.value : option;
                        const label = isObject ? option.label : option;
                        return (
                            <option key={value} value={value}>
                                {label}
                            </option>
                        );
                    })
                )}
            </select>
        </div>
    );
};

export default Select;
