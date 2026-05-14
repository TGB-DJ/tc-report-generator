import clsx from 'clsx';
import { useAuth } from '../../context/AuthContext';

const Input = ({ label, error, className, ...props }) => {
    const auth = useAuth();
    const isSuperAdmin = auth?.userData?.isSuperAdmin;

    return (
        <div className="space-y-1.5">
            {label && (
                <label className={clsx("block text-sm font-medium", isSuperAdmin ? "text-amber-500/80" : "text-slate-300")}>
                    {label}
                    {props.required && <span className="text-red-500 ml-1">*</span>}
                </label>
            )}
            <input
                className={clsx(
                    "w-full px-4 py-2.5 rounded-xl border transition-all duration-200 outline-none",
                    isSuperAdmin 
                        ? "bg-black/40 border-amber-500/20 text-white focus:border-amber-500 focus:ring-4 focus:ring-amber-500/10 placeholder:text-amber-500/30"
                        : "bg-white/5 dark:bg-black/20 border-slate-200 dark:border-white/10 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 text-slate-100",
                    error && (isSuperAdmin ? "border-red-500 focus:border-red-500 focus:ring-red-500/20" : "border-red-300 focus:border-red-500 focus:ring-4 focus:ring-red-500/10"),
                    className
                )}
                {...props}
            />
            {error && (
                <p className="text-xs text-red-500 mt-1">{error}</p>
            )}
        </div>
    );
};

export default Input;
