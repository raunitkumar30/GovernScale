import React from "react";
import { ShieldAlert, RotateCcw, RefreshCw } from "lucide-react";
import { clearGovernScaleData } from "../utils/localStorage";

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("GovernScale ErrorBoundary caught an error:", error, errorInfo);
    this.setState({ errorInfo });
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
    window.location.href = "/";
  };

  handleWipeAndReset = () => {
    if (
      window.confirm(
        "Clear all local storage and reload GovernScale? This will reset all stores to initial baseline."
      )
    ) {
      clearGovernScaleData();
      localStorage.clear();
      window.location.href = "/login";
    }
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#F4F6F8] flex flex-col items-center justify-center p-4 text-center select-none font-sans">
          <div className="max-w-md w-full p-8 rounded-3xl bg-white border border-rose-200 shadow-2xl flex flex-col items-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-rose-50 text-rose-600 mb-5 border border-rose-100">
              <ShieldAlert size={36} strokeWidth={2.2} />
            </div>

            <span className="text-xs font-extrabold uppercase tracking-widest text-rose-700 bg-rose-50 px-3 py-1 rounded-full mb-2">
              Application Error Caught
            </span>

            <h1 className="text-xl font-black text-slate-900 tracking-tight mt-1">
              Rendering Interrupted
            </h1>

            <p className="text-xs text-slate-500 font-medium mt-2 mb-6 leading-relaxed">
              GovernScale encountered an unexpected runtime error. You can reload the application or reset localStorage stores.
            </p>

            <div className="w-full bg-slate-50 rounded-xl p-3 border border-slate-200 text-left mb-6 font-mono text-[10px] text-rose-700 overflow-x-auto max-h-24">
              {this.state.error?.toString()}
            </div>

            <div className="flex flex-col sm:flex-row gap-3 w-full">
              <button
                type="button"
                onClick={this.handleReset}
                className="flex-1 flex items-center justify-center gap-2 rounded-full bg-[#154B38] py-2.5 px-4 text-xs font-bold text-white shadow-xs hover:bg-[#0D3427] active:scale-95 transition cursor-pointer"
              >
                <RefreshCw size={14} />
                <span>Reload App</span>
              </button>

              <button
                type="button"
                onClick={this.handleWipeAndReset}
                className="flex-1 flex items-center justify-center gap-2 rounded-full border border-rose-200 bg-white py-2.5 px-4 text-xs font-bold text-rose-700 hover:bg-rose-50 active:scale-95 transition cursor-pointer"
              >
                <RotateCcw size={14} />
                <span>Reset Storage</span>
              </button>
            </div>
          </div>

          <p className="text-[11px] font-semibold text-slate-400 mt-6">
            GovernScale Productivity OS • Error Isolation Shield
          </p>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
