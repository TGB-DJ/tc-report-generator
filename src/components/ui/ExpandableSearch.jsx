import React, { useState, useRef, useEffect } from 'react';
import { Search, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const ExpandableSearch = ({ value, onChange, placeholder = "Search..." }) => {
    const [isExpanded, setIsExpanded] = useState(false);
    const inputRef = useRef(null);

    useEffect(() => {
        if (isExpanded && inputRef.current) {
            inputRef.current.focus();
        }
    }, [isExpanded]);

    // Keep expanded if there's text
    useEffect(() => {
        if (value && !isExpanded) {
            setIsExpanded(true);
        }
    }, [value, isExpanded]);

    return (
        <div className="relative flex items-center justify-end h-10" style={{ minWidth: isExpanded ? '250px' : '40px' }}>
            <AnimatePresence mode="wait">
                {isExpanded ? (
                    <motion.div
                        key="expanded"
                        initial={{ width: 40, opacity: 0 }}
                        animate={{ width: 250, opacity: 1 }}
                        exit={{ width: 40, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="overflow-hidden flex items-center bg-white border border-slate-200 rounded-full shadow-sm w-full"
                    >
                        <div className="pl-3 text-slate-400">
                            <Search size={16} />
                        </div>
                        <input
                            ref={inputRef}
                            type="text"
                            value={value}
                            onChange={(e) => onChange(e.target.value)}
                            placeholder={placeholder}
                            className="w-full bg-transparent border-none focus:ring-0 text-sm px-2 py-2 outline-none text-slate-700"
                        />
                        <button 
                            onClick={() => {
                                onChange('');
                                setIsExpanded(false);
                            }}
                            className="pr-3 text-slate-400 hover:text-slate-600 transition-colors"
                        >
                            <X size={16} />
                        </button>
                    </motion.div>
                ) : (
                    <motion.button
                        key="collapsed"
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.8 }}
                        onClick={() => setIsExpanded(true)}
                        className="p-2 bg-white rounded-full border border-slate-200 text-slate-500 hover:text-brand-blue hover:border-brand-blue hover:shadow-md transition-all shadow-sm absolute right-0"
                        title="Search"
                    >
                        <Search size={20} />
                    </motion.button>
                )}
            </AnimatePresence>
        </div>
    );
};

export default ExpandableSearch;
