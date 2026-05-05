import React from 'react';
import { AlertTriangle, RefreshCcw } from 'lucide-react';
import Button from './ui/Button';

class GlobalErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    // Update state so the next render will show the fallback UI.
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    // You can also log the error to an error reporting service
    console.error("Uncaught error in application:", error, errorInfo);
    this.setState({ errorInfo });
  }

  render() {
    if (this.state.hasError) {
      // You can render any custom fallback UI
      return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
            <div className="max-w-md w-full bg-white rounded-2xl shadow-xl overflow-hidden">
                <div className="p-8 text-center space-y-6">
                    <div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center text-red-500 mb-4">
                        <AlertTriangle size={36} />
                    </div>
                    <div>
                        <h2 className="text-2xl font-bold text-slate-800">Something went wrong</h2>
                        <p className="text-slate-500 mt-2 text-sm">
                            The application encountered an unexpected error. Please try refreshing the page or contact the administrator if the problem persists.
                        </p>
                    </div>

                    <div className="bg-slate-50 p-4 rounded-lg text-left overflow-x-auto">
                        <p className="text-xs font-mono text-red-600 mb-1">{this.state.error?.toString()}</p>
                    </div>

                    <Button 
                        onClick={() => window.location.reload()} 
                        className="w-full flex justify-center items-center gap-2"
                    >
                        <RefreshCcw size={18} /> Reload Application
                    </Button>
                </div>
            </div>
        </div>
      );
    }

    return this.props.children; 
  }
}

export default GlobalErrorBoundary;
