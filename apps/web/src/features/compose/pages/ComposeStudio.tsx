import React, { useState, useEffect, useCallback } from 'react';
import { 
  Workflow, 
  Play, 
  Terminal, 
  CheckCircle, 
  AlertTriangle, 
  List, 
  RefreshCw, 
  X, 
  Clock, 
  Box
} from 'lucide-react';
import { useCompose, useOperationProgress } from '../hooks/useCompose';
import { validateCompose, analyzeCompose } from '../api/composeApi';
import type { ComposeValidationResult, ComposeProjectDetails } from '@dockverse/types';

export function ComposeStudio() {
  const { templates, history, runCommand, isRunningCommand, refetchHistory } = useCompose();

  const [projectName, setProjectName] = useState('web-stack');
  const [content, setContent] = useState(`version: '3.8'\n\nservices:\n  web:\n    image: nginx:alpine\n    ports:\n      - "80:80"\n`);

  // Active Operation ID for Polling Logs
  const [activeOperationId, setActiveOperationId] = useState<string | null>(null);

  // Validation/Analysis State
  const [validation, setValidation] = useState<ComposeValidationResult | null>(null);
  const [analysis, setAnalysis] = useState<ComposeProjectDetails | null>(null);
  const [isValidating, setIsValidating] = useState(false);

  const handleValidateAndAnalyze = useCallback(async () => {
    setIsValidating(true);
    try {
      const valResult = await validateCompose(content);
      const anaResult = await analyzeCompose(content);
      setValidation(valResult);
      setAnalysis(anaResult);
    } catch (err: any) {
      alert(err.message || 'Analysis failed');
    } finally {
      setIsValidating(false);
    }
  }, [content]);

  // Debounce parsing check
  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      handleValidateAndAnalyze();
    }, 1200);

    return () => clearTimeout(delayDebounceFn);
  }, [content, handleValidateAndAnalyze]);

  const handleAction = async (action: 'up' | 'down' | 'restart' | 'build') => {
    if (!projectName.trim()) {
      alert('Project name is required');
      return;
    }

    if (validation && !validation.isValid && action !== 'down') {
      alert('Cannot run: Resolve YAML validation errors first.');
      return;
    }

    try {
      const result = await runCommand({
        projectName: projectName.trim(),
        content,
        action
      });
      setActiveOperationId(result.operationId);
    } catch (err: any) {
      alert(err.message || 'Command failed');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 pb-4 border-b border-border/40 select-none">
        <div>
          <h1 className="text-xl font-bold text-slate-100 flex items-center gap-2">
            <Workflow className="w-5 h-5 text-blue-500" />
            Compose Studio
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Author, analyze, run, and inspect multi-container Docker applications inside the workspace
          </p>
        </div>
      </div>

      {/* Grid panels */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        
        {/* Left 2 cols: Code Editor & Structure */}
        <div className="xl:col-span-2 space-y-6">
          
          {/* Templates Select */}
          <div className="bg-card border border-border/60 p-4 rounded-lg space-y-3">
            <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider select-none">Compose Templates</h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {templates.map((tpl) => (
                <button
                  key={tpl.name}
                  onClick={() => {
                    if (confirm(`Overwrite current editor content with ${tpl.name}?`)) {
                      setContent(tpl.content);
                    }
                  }}
                  className="p-3 bg-slate-950 hover:bg-slate-900 border border-border rounded text-left transition space-y-1"
                >
                  <div className="text-xs font-bold text-slate-200 truncate">{tpl.name}</div>
                  <div className="text-[10px] text-slate-500 truncate">{tpl.description}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Editor Container */}
          <div className="bg-card border border-border rounded-lg overflow-hidden flex flex-col h-[500px]">
            <div className="flex justify-between items-center bg-sidebar px-4 py-2 border-b border-border select-none">
              <span className="text-xs font-bold text-slate-400">docker-compose.yml</span>
              <button 
                onClick={handleValidateAndAnalyze}
                disabled={isValidating}
                className="py-1 px-2.5 bg-slate-900 hover:bg-slate-800 text-[11px] text-slate-300 border border-border rounded transition flex items-center gap-1.5"
              >
                <RefreshCw className={`w-3 h-3 ${isValidating ? 'animate-spin text-blue-400' : ''}`} />
                Parse
              </button>
            </div>
            
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="flex-1 bg-slate-950 p-4 font-mono text-xs text-slate-200 focus:outline-none resize-none leading-relaxed select-text"
              placeholder="# Write docker-compose.yml contents here..."
            />
          </div>

          {/* Validation & Analysis tabs */}
          <div className="bg-card border border-border/60 p-4 rounded-lg space-y-4">
            <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider select-none">Real-Time Validation & Structure</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Validation panel */}
              <div className="space-y-3">
                <h4 className="text-xs font-semibold text-slate-400 border-b border-border/40 pb-1 flex items-center gap-1.5 select-none">
                  {validation?.isValid ? (
                    <CheckCircle className="w-3.5 h-3.5 text-green-500" />
                  ) : (
                    <AlertTriangle className="w-3.5 h-3.5 text-red-400" />
                  )}
                  YAML Schema Validation
                </h4>
                
                {!validation ? (
                  <p className="text-xs text-slate-500 italic">No syntax analysis compiled yet</p>
                ) : validation.errors.length === 0 ? (
                  <div className="text-xs text-green-400 flex items-center gap-1.5 p-3 bg-green-500/5 border border-green-500/10 rounded">
                    <span>Compose YAML schema is valid and ready to deploy.</span>
                  </div>
                ) : (
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {validation.errors.map((err, idx) => (
                      <div 
                        key={idx} 
                        className="text-xs p-2 rounded bg-red-500/5 border border-red-500/20 text-red-400"
                      >
                        {err}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Analysis panel */}
              <div className="space-y-3">
                <h4 className="text-xs font-semibold text-slate-400 border-b border-border/40 pb-1 flex items-center gap-1.5 select-none">
                  <List className="w-3.5 h-3.5 text-blue-500" />
                  Compose Service Stack
                </h4>
                
                {!analysis || analysis.services.length === 0 ? (
                  <p className="text-xs text-slate-500 italic">No services parsed yet</p>
                ) : (
                  <div className="space-y-3 max-h-56 overflow-y-auto">
                    {analysis.services.map((svc) => (
                      <div key={svc.name} className="border border-border/60 bg-slate-950/40 rounded p-3 text-xs font-mono space-y-1">
                        <div className="flex items-center justify-between border-b border-border/30 pb-1 mb-1">
                          <span className="text-blue-400 font-bold flex items-center gap-1">
                            <Box className="w-3.5 h-3.5" />
                            {svc.name}
                          </span>
                          <span className="text-[10px] text-slate-500 truncate max-w-[150px]">{svc.image}</span>
                        </div>
                        {svc.ports && svc.ports.length > 0 && (
                          <div className="text-[11px] text-slate-400">Ports: {svc.ports.join(', ')}</div>
                        )}
                        {svc.dependsOn && svc.dependsOn.length > 0 && (
                          <div className="text-[11px] text-slate-400">Depends On: {svc.dependsOn.join(', ')}</div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Right col: Build config */}
        <div className="space-y-6">
          <div className="bg-card border border-border/60 p-4 rounded-lg space-y-4">
            <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider select-none flex items-center gap-1.5">
              <Play className="w-4 h-4 text-blue-500" />
              Compose Commands
            </h3>
            
            <div className="space-y-4">
              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-slate-400">Project Stack Name *</label>
                <input 
                  type="text" 
                  value={projectName}
                  onChange={(e) => setProjectName(e.target.value)}
                  className="w-full bg-slate-950 border border-border rounded px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-blue-500"
                  placeholder="e.g. web-stack"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-2 pt-2 border-t border-border/40 select-none">
                <button
                  type="button"
                  onClick={() => handleAction('up')}
                  disabled={isRunningCommand}
                  className="py-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 active:bg-blue-700 text-white text-xs font-semibold rounded transition flex items-center justify-center gap-1.5"
                >
                  Compose Up
                </button>
                <button
                  type="button"
                  onClick={() => handleAction('down')}
                  disabled={isRunningCommand}
                  className="py-2 bg-slate-900 border border-border hover:bg-red-950 hover:text-red-400 hover:border-red-900 text-slate-300 text-xs font-semibold rounded transition flex items-center justify-center gap-1.5"
                >
                  Compose Down
                </button>
                <button
                  type="button"
                  onClick={() => handleAction('restart')}
                  disabled={isRunningCommand}
                  className="py-2 bg-slate-900 border border-border hover:bg-slate-800 text-slate-300 text-xs font-semibold rounded transition flex items-center justify-center gap-1.5"
                >
                  Restart
                </button>
                <button
                  type="button"
                  onClick={() => handleAction('build')}
                  disabled={isRunningCommand}
                  className="py-2 bg-slate-900 border border-border hover:bg-slate-800 text-slate-300 text-xs font-semibold rounded transition flex items-center justify-center gap-1.5"
                >
                  Build
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Operation Progress Window */}
      {activeOperationId && (
        <OperationProgressWindow 
          operationId={activeOperationId} 
          onClose={() => {
            setActiveOperationId(null);
            refetchHistory();
          }} 
        />
      )}

      {/* History Grid */}
      <div className="bg-card border border-border p-4 rounded-lg space-y-4">
        <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider select-none flex items-center gap-1.5">
          <Clock className="w-4 h-4 text-blue-500" />
          Compose Command History
        </h3>

        {history.length === 0 ? (
          <p className="text-xs text-slate-500 italic">No previous compose execution registered</p>
        ) : (
          <div className="border border-border/60 rounded overflow-hidden">
            <table className="w-full text-left text-xs font-mono text-slate-300">
              <thead className="bg-sidebar text-slate-400 text-[10px] uppercase select-none border-b border-border/60">
                <tr>
                  <th className="p-3 font-semibold">Operation ID</th>
                  <th className="p-3 font-semibold">Status</th>
                  <th className="p-3 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/40 select-text">
                {history.map((h) => (
                  <tr key={h.operationId} className="hover:bg-slate-900/20">
                    <td className="p-3 select-all">{h.operationId}</td>
                    <td className="p-3">
                      <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                        h.status === 'success' ? 'bg-green-500/10 text-green-400 border border-green-500/20' : 
                        h.status === 'failed' ? 'bg-red-500/10 text-red-400 border border-red-500/20' : 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                      }`}>
                        {h.status.toUpperCase()}
                      </span>
                    </td>
                    <td className="p-3 text-right">
                      <button 
                        onClick={() => setActiveOperationId(h.operationId)}
                        className="py-1 px-2 bg-slate-900 border border-border rounded text-[10px] hover:bg-slate-800"
                      >
                        Logs
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

interface OperationProgressProps {
  operationId: string;
  onClose: () => void;
}

function OperationProgressWindow({ operationId, onClose }: OperationProgressProps) {
  const { data: progress, isLoading } = useOperationProgress(operationId);

  // Auto-scroll logs terminal
  const terminalEndRef = React.useRef<HTMLDivElement>(null);
  useEffect(() => {
    terminalEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [progress?.logs]);

  return (
    <div className="fixed inset-0 bg-slate-950/85 backdrop-blur-sm flex items-center justify-center p-4 z-50 select-none">
      <div className="bg-card border border-border rounded-lg max-w-3xl w-full h-[550px] overflow-hidden shadow-2xl flex flex-col">
        <div className="flex justify-between items-center p-4 border-b border-border bg-sidebar">
          <h3 className="text-sm font-bold text-slate-200 flex items-center gap-1.5">
            <Terminal className="w-4 h-4 text-blue-500 animate-pulse" />
            Docker Compose CLI output
          </h3>
          <button 
            onClick={onClose}
            className="p-1 hover:bg-slate-800 text-slate-400 hover:text-white rounded transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Console logs output */}
        <div className="flex-1 bg-black p-4 overflow-y-auto font-mono text-[11px] text-slate-300 select-text space-y-1">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center h-full text-slate-500 animate-pulse">
              <RefreshCw className="w-6 h-6 animate-spin text-blue-500 mb-1" />
              <p>Connecting to operation thread logs...</p>
            </div>
          ) : !progress || !progress.logs ? (
            <p className="text-slate-500 italic">Initiating compose thread...</p>
          ) : (
            <>
              {progress.logs.map((line, idx) => (
                <div key={idx} className="whitespace-pre-wrap select-all">{line}</div>
              ))}
              <div ref={terminalEndRef} />
            </>
          )}
        </div>

        {/* Footer status bar */}
        <div className="p-3 border-t border-border bg-sidebar flex justify-between items-center">
          <div className="text-[11px] text-slate-400">
            Operation status: <span className="font-bold text-slate-200 capitalize">{progress?.status || 'loading'}</span>
          </div>
          <button
            onClick={onClose}
            className="py-1.5 px-4 bg-slate-900 border border-border text-slate-300 rounded text-xs hover:bg-slate-800 transition"
          >
            Close Console
          </button>
        </div>
      </div>
    </div>
  );
}

export default ComposeStudio;
