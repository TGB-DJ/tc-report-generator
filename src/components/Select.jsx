import React from 'react';
import { useAuth } from '../context/AuthContext';
import clsx from 'clsx';

const Select = ({ label, name, value, onChange, options, required, className = '', groupedOptions = null }) => {
    const auth = useAuth();
    const isSuperAdmin = auth?.userData?.isSuperAdmin;

    return (
        <div className="space-y-2">
            {label && (
                <label className={clsx("block text-sm font-medium", isSuperAdmin ? "text-amber-500/80" : "text-slate-300")}>
                    {label} {required && <span className="text-red-500">*</span>}
                </label>
            )}
            <select
                name={name}
                value={value}
                onChange={onChange}
                required={required}
                className={clsx(
                    "w-full px-4 py-2.5 rounded-xl focus:outline-none focus:ring-2 transition-all",
                    isSuperAdmin
                        ? "bg-black/40 border-amber-500/20 text-white focus:ring-amber-500/30 focus:border-amber-500"
                        : "bg-white/5 dark:bg-black/20 border-slate-200 dark:border-white/10 focus:ring-brand-blue focus:border-transparent text-slate-200",
                    className
                )}
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
