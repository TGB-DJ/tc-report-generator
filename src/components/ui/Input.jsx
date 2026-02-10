import clsx from 'clsx';

const Input = ({ label, error, className, ...props }) => {
    return (
        <div className="space-y-1.5">
            {label && (
                <label className="block text-sm font-medium text-slate-700">
                    {label}
                </label>
            )}
            <input
                className={clsx(
                    "w-full px-4 py-2.5 rounded-xl border bg-slate-50 focus:bg-white transition-all duration-200 outline-none",
                    error
                        ? "border-red-300 focus:border-red-500 focus:ring-4 focus:ring-red-500/10"
                        : "border-slate-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10",
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
