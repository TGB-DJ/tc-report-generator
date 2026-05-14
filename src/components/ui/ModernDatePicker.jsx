import React, { useState, useRef, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, X } from 'lucide-react';
import clsx from 'clsx';
import { useAuth } from '../../context/AuthContext';

const ModernDatePicker = ({ value, onChange, label }) => {
    const { userData } = useAuth();
    const isSuperAdmin = userData?.isSuperAdmin;
    const [isOpen, setIsOpen] = useState(false);
    const containerRef = useRef(null);

    // Parse the current value (YYYY-MM-DD)
    const selectedDate = useMemo(() => {
        if (!value) return new Date();
        const [year, month, day] = value.split('-').map(Number);
        return new Date(year, month - 1, day);
    }, [value]);

    const [viewDate, setViewDate] = useState(new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1));

    useEffect(() => {
        const handleClickOutside = (e) => {
            if (containerRef.current && !containerRef.current.contains(e.target)) {
                setIsOpen(false);
            }
        };
        if (isOpen) document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [isOpen]);

    const daysInMonth = (year, month) => new Date(year, month + 1, 0).getDate();
    const firstDayOfMonth = (year, month) => new Date(year, month, 1).getDay();

    const generateDays = () => {
        const year = viewDate.getFullYear();
        const month = viewDate.getMonth();
        const days = [];
        const totalDays = daysInMonth(year, month);
        const startDay = firstDayOfMonth(year, month);

        // Previous month padding
        const prevMonthDays = daysInMonth(year, month - 1);
        for (let i = startDay - 1; i >= 0; i--) {
            days.push({ day: prevMonthDays - i, month: month - 1, year, current: false });
        }

        // Current month
        for (let i = 1; i <= totalDays; i++) {
            days.push({ day: i, month, year, current: true });
        }

        // Next month padding
        const remaining = 42 - days.length;
        for (let i = 1; i <= remaining; i++) {
            days.push({ day: i, month: month + 1, year, current: false });
        }

        return days;
    };

    const handleDateSelect = (d) => {
        const date = new Date(d.year, d.month, d.day);
        const formatted = date.toISOString().split('T')[0];
        onChange({ target: { value: formatted } });
        setIsOpen(false);
    };

    const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

    const nextMonth = () => setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 1));
    const prevMonth = () => setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() - 1, 1));

    const formattedDisplayDate = selectedDate.toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' });

    return (
        <div className="relative" ref={containerRef}>
            {label && (
                <label className={clsx("block text-[10px] font-bold uppercase tracking-wider mb-1.5 ml-1", isSuperAdmin ? "text-amber-500/60" : "text-slate-500")}>
                    {label}
                </label>
            )}
            <button
                type="button"
                onClick={() => setIsOpen(!isOpen)}
                className={clsx(
                    "flex items-center gap-3 px-4 py-2.5 rounded-xl border text-sm font-semibold transition-all w-full",
                    isSuperAdmin
                        ? "bg-black/40 border-amber-500/30 text-amber-500 hover:border-amber-400/50 shadow-lg shadow-black/20"
                        : "bg-white dark:bg-[#0a0a0a] border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-200 hover:border-brand-blue"
                )}
            >
                <CalendarIcon size={16} className={isSuperAdmin ? "text-amber-500" : "text-brand-blue"} />
                {formattedDisplayDate}
            </button>

            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 10, scale: 0.95 }}
                        className={clsx(
                            "absolute top-full mt-2 left-0 z-[100] w-72 rounded-2xl p-4 shadow-2xl border backdrop-blur-xl",
                            isSuperAdmin ? "card-bg border-amber-500/20" : "bg-white dark:bg-[#0a0a0a] border-slate-100 dark:border-white/10"
                        )}
                    >
                        <div className="flex items-center justify-between mb-4">
                            <button onClick={prevMonth} className="p-1.5 rounded-lg hover:bg-white/5 transition-colors text-slate-400 hover:text-white">
                                <ChevronLeft size={18} />
                            </button>
                            <h4 className={clsx("font-bold text-sm", isSuperAdmin ? "text-amber-500" : "text-slate-800 dark:text-white")}>
                                {monthNames[viewDate.getMonth()]} {viewDate.getFullYear()}
                            </h4>
                            <button onClick={nextMonth} className="p-1.5 rounded-lg hover:bg-white/5 transition-colors text-slate-400 hover:text-white">
                                <ChevronRight size={18} />
                            </button>
                        </div>

                        <div className="grid grid-cols-7 gap-1 mb-2">
                            {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(d => (
                                <div key={d} className="text-center text-[10px] font-black uppercase text-slate-500 py-1">{d}</div>
                            ))}
                        </div>

                        <div className="grid grid-cols-7 gap-1">
                            {generateDays().map((d, i) => {
                                const isSelected = selectedDate.getDate() === d.day && selectedDate.getMonth() === d.month && selectedDate.getFullYear() === d.year;
                                const isToday = new Date().getDate() === d.day && new Date().getMonth() === d.month && new Date().getFullYear() === d.year;

                                return (
                                    <button
                                        key={i}
                                        onClick={() => handleDateSelect(d)}
                                        className={clsx(
                                            "aspect-square rounded-lg text-xs font-medium flex items-center justify-center transition-all",
                                            !d.current ? "text-slate-600 opacity-30" : (isSuperAdmin ? "text-amber-500/80 hover:bg-amber-500/10" : "text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/5"),
                                            isSelected && (isSuperAdmin ? "bg-amber-600 !text-white shadow-lg shadow-amber-900/40 scale-110" : "bg-brand-blue !text-white shadow-lg scale-110"),
                                            isToday && !isSelected && (isSuperAdmin ? "border border-amber-500/50" : "border border-brand-blue/50")
                                        )}
                                    >
                                        {d.day}
                                    </button>
                                );
                            })}
                        </div>

                        <div className="mt-4 pt-4 border-t border-white/5 flex justify-between items-center">
                            <button 
                                onClick={() => {
                                    const today = new Date().toISOString().split('T')[0];
                                    onChange({ target: { value: today } });
                                    setIsOpen(false);
                                }}
                                className={clsx("text-[10px] font-bold uppercase tracking-widest", isSuperAdmin ? "text-amber-500/60 hover:text-amber-500" : "text-slate-500 hover:text-brand-blue")}
                            >
                                Today
                            </button>
                            <button 
                                onClick={() => setIsOpen(false)}
                                className="text-[10px] font-bold uppercase tracking-widest text-rose-500/60 hover:text-rose-500"
                            >
                                Close
                            </button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default ModernDatePicker;
