import { forwardRef } from 'react';
import { motion } from 'framer-motion';
import clsx from 'clsx';

const Card = forwardRef(({ children, className, hover = true, ...props }, ref) => {
    return (
        <motion.div
            ref={ref}
            whileHover={hover ? { y: -2 } : {}}
            className={clsx(
                "bg-white dark:bg-[#0a0a0a] rounded-2xl border border-slate-100 dark:border-white/10 shadow-xl shadow-slate-200/50 dark:shadow-none p-6 backdrop-blur-xl",
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
