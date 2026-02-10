import React from 'react';
import { motion } from 'framer-motion';

const GlowingLogo = ({ text = "KJ" }) => {
    return (
        <motion.div
            className="relative group select-none"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
        >
            {/* External Glow (Blur) */}
            <div className="absolute -inset-1 bg-gradient-to-r from-brand-orange via-orange-400 to-blue-500 rounded-lg blur opacity-40 group-hover:opacity-100 transition duration-1000 group-hover:duration-200 animate-tilt"></div>

            {/* Main Badge Container */}
            <div className="relative px-3 py-2 bg-slate-900 rounded-lg ring-1 ring-gray-900/5 leading-none flex items-center justify-center">

                {/* Shine Animation */}
                <div className="absolute top-0 -left-10 w-20 h-full bg-white/20 skew-x-[30deg] blur-md transform -translate-x-full group-hover:translate-x-[200%] transition-transform duration-1000"></div>

                {/* Text Content */}
                <span className="font-black text-xl tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-white to-gray-200 filter drop-shadow-[0_0_2px_rgba(255,255,255,0.5)]">
                    {text}
                </span>

                {/* Orange Dot/Accent similar to the 'Freshman' badge idea */}
                <span className="absolute -top-1 -right-1 flex h-3 w-3">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-brand-orange opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-brand-orange"></span>
                </span>
            </div>
        </motion.div>
    );
};

export default GlowingLogo;
