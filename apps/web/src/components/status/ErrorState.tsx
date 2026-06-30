import React from 'react';
import { AlertCircle, RefreshCw, Terminal } from 'lucide-react';

interface ErrorStateProps {
  onRetry: () => void;
  isRetrying: boolean;
  errorMessage?: string;
}

export function ErrorState({ onRetry, isRetrying, errorMessage }: ErrorStateProps) {
  return (
    <div className="fixed inset-0 flex items-center justify-center bg-[#07080a] z-50 p-4 font-sans select-none">
      <div className="max-w-md w-full bg-card border border-border rounded-xl p-8 shadow-2xl relative overflow-hidden">
        {/* Glow decoration */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-48 h-1 bg-gradient-to-r from-red-500 via-pink-500 to-red-500 blur-[2px]" />

        <div className="flex flex-col items-center text-center">
          <div className="w-16 h-16 bg-red-950/40 border border-red-500/30 rounded-full flex items-center justify-center text-red-500 mb-6 shadow-lg shadow-red-500/5">
            <AlertCircle className="w-8 h-8 animate-pulse" />
          </div>

          <h1 className="text-xl font-bold text-slate-100 tracking-tight">Docker Daemon Offline</h1>
          <p className="text-sm text-slate-400 mt-2 leading-relaxed">
            DockVerse was unable to connect to the Docker Engine. Please ensure the Docker service is running on your machine.
          </p>

          {errorMessage && (
            <div className="w-full mt-4 p-3 bg-red-950/20 border border-red-500/10 rounded-lg text-left text-xs font-mono text-red-400/90 max-h-24 overflow-y-auto">
              {errorMessage}
            </div>
          )}

          <div className="w-full mt-6 space-y-4">
            <div className="border border-border bg-slate-950 p-4 rounded-lg text-left space-y-2">
              <div className="flex items-center gap-2 text-slate-300 text-xs font-semibold">
                <Terminal className="w-3.5 h-3.5 text-blue-500" />
                <span>Troubleshooting Steps</span>
              </div>
              <ul className="text-[11px] text-slate-400 space-y-1.5 list-disc list-inside">
                <li>Start Docker Desktop (Windows/macOS)</li>
                <li>Run <code className="text-slate-200 font-mono px-1 py-0.5 bg-slate-900 rounded">sudo systemctl start docker</code> (Linux)</li>
                <li>Check permission settings on your user socket</li>
              </ul>
            </div>

            <button
              onClick={onRetry}
              disabled={isRetrying}
              className="w-full py-2.5 px-4 bg-red-600 hover:bg-red-500 active:bg-red-700 disabled:bg-slate-800 text-white rounded-lg text-sm font-semibold tracking-wide flex items-center justify-center gap-2 shadow-lg shadow-red-600/15 hover:shadow-red-600/20 transition-all duration-200"
            >
              <RefreshCw className={`w-4 h-4 ${isRetrying ? 'animate-spin' : ''}`} />
              {isRetrying ? 'Checking connection...' : 'Retry Connection'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
export default ErrorState;
