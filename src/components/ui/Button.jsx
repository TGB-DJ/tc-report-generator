import { motion } from 'framer-motion';
import clsx from 'clsx';
import { useAuth } from '../../context/AuthContext';

const Button = ({ children, variant = 'primary', className, isLoading, ...props }) => {
    const auth = useAuth();
    const isSuperAdmin = auth?.userData?.isSuperAdmin;

    const variants = {
        primary: isSuperAdmin 
            ? 'bg-gradient-to-r from-[#fff5d1] via-[#d4af37] to-[#b08d20] text-[#1a1505] font-bold hover:shadow-[0_0_20px_rgba(212,175,55,0.4)]'
            : 'bg-gradient-to-r from-brand-blue to-brand-accent text-white hover:shadow-lg hover:shadow-blue-500/30',
        secondary: isSuperAdmin
            ? 'bg-black/40 text-amber-500 border border-amber-500/30 hover:bg-black/60 hover:border-amber-500'
            : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50 hover:border-slate-300',
        danger: 'bg-red-500 text-white hover:bg-red-600 hover:shadow-lg hover:shadow-red-500/30',
        ghost: isSuperAdmin
            ? 'bg-transparent text-amber-500/60 hover:text-amber-500 hover:bg-amber-500/10'
            : 'bg-transparent text-slate-600 hover:bg-slate-100',
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
