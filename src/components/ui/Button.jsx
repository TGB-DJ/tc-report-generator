import { motion } from 'framer-motion';
import clsx from 'clsx';

const Button = ({ children, variant = 'primary', className, isLoading, ...props }) => {
    const variants = {
        primary: 'bg-gradient-to-r from-brand-orange to-brand-accent text-white hover:shadow-lg hover:shadow-orange-500/30',
        secondary: 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50 hover:border-slate-300',
        danger: 'bg-red-500 text-white hover:bg-red-600 hover:shadow-lg hover:shadow-red-500/30',
        ghost: 'bg-transparent text-slate-600 hover:bg-slate-100',
    };

    return (
        <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className={clsx(
                "px-4 py-2 rounded-xl font-medium transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2",
                variants[variant],
                className
            )}
            disabled={isLoading}
            {...props}
        >
            {isLoading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : children}
        </motion.button>
    );
};

export default Button;
