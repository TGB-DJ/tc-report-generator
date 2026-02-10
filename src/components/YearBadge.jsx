const YearBadge = ({ year, role }) => {
    // Determine badge style based on year or role
    const getBadgeConfig = () => {
        if (role === 'hod') {
            return {
                label: 'HOD',
                className: 'bg-gradient-to-r from-purple-600 via-pink-600 to-purple-600 text-white shadow-2xl',
                glow: 'shadow-[0_0_20px_rgba(168,85,247,0.8),0_0_40px_rgba(236,72,153,0.6)]',
                animation: 'animate-pulse'
            };
        }
        if (role === 'staff' || role === 'teacher') {
            return {
                label: 'STAFF',
                className: 'bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-xl',
                glow: 'shadow-[0_0_15px_rgba(245,158,11,0.7)]',
                animation: ''
            };
        }

        // Student badges based on year
        if (year?.includes('MSc') || year?.includes('MA')) {
            if (year?.includes('2nd')) {
                return {
                    label: 'EXPERT',
                    className: 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg',
                    glow: 'shadow-[0_0_10px_rgba(99,102,241,0.5)]',
                    animation: ''
                };
            }
            return {
                label: 'ADVANCED',
                className: 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md',
                glow: '',
                animation: ''
            };
        }

        // BSc/BA/BCom badges
        if (year?.includes('3rd')) {
            return {
                label: 'SENIOR',
                className: 'bg-gradient-to-r from-green-600 to-teal-600 text-white shadow-md',
                glow: '',
                animation: ''
            };
        }
        if (year?.includes('2nd')) {
            return {
                label: 'INTERMEDIATE',
                className: 'bg-gradient-to-r from-cyan-500 to-blue-500 text-white',
                glow: '',
                animation: ''
            };
        }
        // 1st year
        return {
            label: 'FRESHMAN',
            className: 'bg-gradient-to-r from-slate-400 to-slate-500 text-white',
            glow: '',
            animation: ''
        };
    };

    const config = getBadgeConfig();

    return (
        <div className={`absolute -bottom-1 -right-1 px-2 py-0.5 rounded-full text-[9px] font-bold tracking-wider ${config.className} ${config.glow} ${config.animation}`}>
            {config.label}
        </div>
    );
};

export default YearBadge;
