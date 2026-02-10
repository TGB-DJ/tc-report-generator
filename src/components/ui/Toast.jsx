import { useEffect } from 'react';
import { CheckCircle, XCircle, AlertCircle, X } from 'lucide-react';

const Toast = ({ message, type = 'success', onClose, duration = 3000 }) => {
    useEffect(() => {
        if (duration) {
            const timer = setTimeout(() => {
                onClose();
            }, duration);
            return () => clearTimeout(timer);
        }
    }, [duration, onClose]);

    const icons = {
        success: <CheckCircle size={20} className="text-green-600" />,
        error: <XCircle size={20} className="text-red-600" />,
        warning: <AlertCircle size={20} className="text-yellow-600" />
    };

    const colors = {
        success: 'bg-green-50 border-green-200 text-green-800',
        error: 'bg-red-50 border-red-200 text-red-800',
        warning: 'bg-yellow-50 border-yellow-200 text-yellow-800'
    };

    return (
        <div className={`fixed top-4 right-4 z-50 flex items-center gap-3 px-4 py-3 rounded-lg border-2 shadow-lg ${colors[type]} animate-slide-in-right`}>
            {icons[type]}
            <p className="font-medium">{message}</p>
            <button onClick={onClose} className="ml-2 hover:opacity-70">
                <X size={16} />
            </button>
        </div>
    );
};

export default Toast;
