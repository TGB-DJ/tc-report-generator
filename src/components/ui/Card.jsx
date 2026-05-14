import { forwardRef } from 'react';
import { motion } from 'framer-motion';
import clsx from 'clsx';
import { useAuth } from '../../context/AuthContext';

const Card = forwardRef(({ children, className, hover = true, ...props }, ref) => {
    const auth = useAuth();
    const isSuperAdmin = auth?.userData?.isSuperAdmin ?? false;

    return (
        <motion.div
            ref={ref}
            whileHover={hover ? { y: -2 } : {}}
            className={clsx(
                "rounded-2xl transition-all duration-300 p-6 backdrop-blur-xl",
                isSuperAdmin 
                    ? "card-bg border-amber-500/20 shadow-[0_8px_32px_rgba(0,0,0,0.4)]" 
                    : "bg-white dark:bg-[#0a0a0a] border-slate-100 dark:border-white/10 shadow-xl shadow-slate-200/50 dark:shadow-none",
                className
            )}
            {...props}
        >
            {children}
        </motion.div>
    );
});

Card.displayName = 'Card';

export default Card;
