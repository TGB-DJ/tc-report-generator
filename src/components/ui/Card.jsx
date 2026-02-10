import { motion } from 'framer-motion';
import clsx from 'clsx';

const Card = ({ children, className, hover = true, ...props }) => {
    return (
        <motion.div
            whileHover={hover ? { y: -5 } : {}}
            className={clsx(
                "bg-white rounded-2xl border border-slate-100 shadow-xl shadow-slate-200/50 p-6 backdrop-blur-xl",
                className
            )}
            {...props}
        >
            {children}
        </motion.div>
    );
};

export default Card;
