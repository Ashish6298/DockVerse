import React, { useState, useEffect, useCallback } from 'react';
import { 
  FileCode, 
  Play, 
  Terminal, 
  HelpCircle, 
  CheckCircle, 
  AlertTriangle, 
  FileText, 
  Plus, 
  Trash2, 
  Clock, 
  Activity, 
  X,
  RefreshCw
} from 'lucide-react';
import { useDockerfiles, useBuildProgress } from '../hooks/useDockerfiles';
import { validateDockerfile, analyzeDockerfile } from '../api/dockerfileApi';
import type { DockerfileValidationResult, DockerfileAnalysis } from '@dockverse/types';

const INSTRUCTIONS_DOCS: Record<string, string> = {
  FROM: 'Sets the Base Image for subsequent instructions. E.g. FROM node:20-alpine',
  RUN: 'Executes commands in a new layer on top of the current image. E.g. RUN npm install',
  CMD: 'Provides defaults for an executing container. E.g. CMD ["node", "app.js"]',
  LABEL: 'Adds metadata key-value labels to an image. E.g. LABEL version="1.0"',
  EXPOSE: 'Informs Docker that the container listens on specified network ports. E.g. EXPOSE 8080',
  ENV: 'Sets environment variable keys. E.g. ENV PORT=3000',
  COPY: 'Copies files/directories from host source to container dest. E.g. COPY . /app',
  ADD: 'Copies local files, remote URLs, or unpacks local tar archives. (Prefer COPY)',
  ENTRYPOINT: 'Configures a container that will run as an executable. E.g. ENTRYPOINT ["node"]',
  VOLUME: 'Creates a mountpoint directory for persistent host data. E.g. VOLUME /data',
  WORKDIR: 'Sets the active working directory for RUN, CMD, COPY instructions. E.g. WORKDIR /app',
  ARG: 'Defines variables that users can pass at build-time. E.g. ARG VERSION=latest'
};

export function DockerfileStudio() {
  const { templates, buildHistory, startBuild, isStartingBuild, refetchHistory } = useDockerfiles();

  const [content, setContent] = useState('FROM alpine:latest\n\nCMD ["echo", "Hello DockVerse!"]\n');
  const [imageName, setImageName] = useState('custom-image');
  const [imageTag, setImageTag] = useState('latest');

  // Build Arguments
  const [buildArgs, setBuildArgs] = useState<Array<{ key: string; value: string }>>([]);
  const [newKey, setNewKey] = useState('');
  const [newValue, setNewValue] = useState('');

  // Active Build ID for Polling
  const [activeBuildId, setActiveBuildId] = useState<string | null>(null);

  // Validation/Analysis State
  const [validation, setValidation] = useState<DockerfileValidationResult | null>(null);
  const [analysis, setAnalysis] = useState<DockerfileAnalysis | null>(null);
  const [isValidating, setIsValidating] = useState(false);

  // Doc Panel
  const [selectedInstruction, setSelectedInstruction] = useState('FROM');

  const addBuildArg = () => {
    if (newKey.trim() && newValue.trim()) {
      setBuildArgs([...buildArgs, { key: newKey.trim(), value: newValue.trim() }]);
      setNewKey('');
      setNewValue('');
    }
  };

  const removeBuildArg = (index: number) => {
    setBuildArgs(buildArgs.filter((_, idx) => idx !== index));
  };

  const handleValidateAndAnalyze = useCallback(async () => {
    setIsValidating(true);
    try {
      const valResult = await validateDockerfile(content);
      const anaResult = await analyzeDockerfile(content);
      setValidation(valResult);
      setAnalysis(anaResult);
    } catch (err: any) {
      alert(err.message || 'Analysis failed');
    } finally {
      setIsValidating(false);
    }
  }, [content]);

  // Trigger analysis when editor content changes
  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      handleValidateAndAnalyze();
    }, 1200);

    return () => clearTimeout(delayDebounceFn);
  }, [content, handleValidateAndAnalyze]);

  const handleBuild = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!imageName.trim()) {
      alert('Image name is required');
      return;
    }

    // Block build if critical syntax errors exist
    if (validation && !validation.isValid) {
      alert('Cannot build: Please resolve critical syntax errors first.');
      return;
    }

    const argsObj: Record<string, string> = {};
    for (const arg of buildArgs) {
      argsObj[arg.key] = arg.value;
    }

    try {
      const result = await startBuild({
        name: imageName.trim(),
        tag: imageTag.trim() || 'latest',
        content,
        buildArgs: argsObj
      });
      setActiveBuildId(result.buildId);
    } catch (err: any) {
      alert(err.message || 'Build initialization failed');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 pb-4 border-b border-border/40 select-none">
        <div>
          <h1 className="text-xl font-bold text-slate-100 flex items-center gap-2">
            <FileCode className="w-5 h-5 text-blue-500" />
            Dockerfile Studio
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Write, validate, analyze, and build custom Docker images directly inside your browser workspace
          </p>
        </div>
      </div>

      {/* Grid panels */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        
        {/* Left 2 cols: Workspace Editor & Details */}
        <div className="xl:col-span-2 space-y-6">
          
          {/* Templates Toolbar */}
          <div className="bg-card border border-border/60 p-4 rounded-lg space-y-3">
            <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider select-none">Dockerfile Templates</h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {templates.map((tpl) => (
                <button
                  key={tpl.name}
                  onClick={() => {
                    if (confirm(`Overwrite current editor content with ${tpl.name} template?`)) {
                      setContent(tpl.content);
                    }
                  }}
                  className="p-2.5 bg-slate-950 hover:bg-slate-900 border border-border rounded text-left transition space-y-1"
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
              <span className="text-xs font-bold text-slate-400">workspace/Dockerfile</span>
              <button 
                onClick={handleValidateAndAnalyze}
                disabled={isValidating}
                className="py-1 px-2.5 bg-slate-900 hover:bg-slate-800 text-[11px] text-slate-300 border border-border rounded transition flex items-center gap-1.5"
              >
                <Activity className={`w-3 h-3 ${isValidating ? 'animate-spin text-blue-400' : ''}`} />
                Analyze Now
              </button>
            </div>
            
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="flex-1 bg-slate-950 p-4 font-mono text-xs text-slate-200 focus:outline-none resize-none leading-relaxed select-text"
              placeholder="# Write Dockerfile instructions here..."
            />
          </div>

          {/* Validation & Analysis Output tabs */}
          <div className="bg-card border border-border/60 p-4 rounded-lg space-y-4">
            <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider select-none">Real-Time Validation & Analysis</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Validation panel */}
              <div className="space-y-3">
                <h4 className="text-xs font-semibold text-slate-400 border-b border-border/40 pb-1 flex items-center gap-1.5 select-none">
                  {validation?.isValid ? (
                    <CheckCircle className="w-3.5 h-3.5 text-green-500" />
                  ) : (
                    <AlertTriangle className="w-3.5 h-3.5 text-red-400" />
                  )}
                  Syntax Validation
                </h4>
                
                {!validation ? (
                  <p className="text-xs text-slate-500 italic">No syntax analysis compiled yet</p>
                ) : validation.errors.length === 0 ? (
                  <div className="text-xs text-green-400 flex items-center gap-1.5 p-3 bg-green-500/5 border border-green-500/10 rounded">
                    <span>Dockerfile syntax is fully correct and ready to build.</span>
                  </div>
                ) : (
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {validation.errors.map((err, idx) => (
                      <div 
                        key={idx} 
                        className={`text-xs p-2 rounded flex justify-between items-start ${
                          err.severity === 'error' ? 'bg-red-500/5 border border-red-500/20 text-red-400' : 'bg-yellow-500/5 border border-yellow-500/20 text-yellow-400'
                        }`}
                      >
                        <div>
                          <div className="font-bold">Line {err.line}: {err.instruction}</div>
                          <div className="mt-0.5">{err.message}</div>
                        </div>
                        <span className="text-[9px] uppercase font-bold px-1 py-0.5 bg-slate-900 rounded shrink-0">
                          {err.severity}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Analysis/Structure panel */}
              <div className="space-y-3">
                <h4 className="text-xs font-semibold text-slate-400 border-b border-border/40 pb-1 flex items-center gap-1.5 select-none">
                  <FileText className="w-3.5 h-3.5 text-blue-500" />
                  Structure Analysis
                </h4>
                
                {!analysis ? (
                  <p className="text-xs text-slate-500 italic">No structural stages analyzed yet</p>
                ) : (
                  <div className="space-y-2 text-xs font-mono text-slate-400 bg-slate-950/40 p-3 border border-border/60 rounded">
                    <div>Base Image: <span className="text-blue-400">{analysis.baseImage}</span></div>
                    <div>Build Stages: <span className="text-slate-200">{analysis.stages.join(' → ') || 'none'}</span></div>
                    <div>Ports: <span className="text-slate-200">{analysis.ports.join(', ') || 'none'}</span></div>
                    <div>Volume Paths: <span className="text-slate-200">{analysis.volumePaths.join(', ') || 'none'}</span></div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Right col: Build config & documentation helper */}
        <div className="space-y-6">
          
          {/* Build Options Form */}
          <div className="bg-card border border-border/60 p-4 rounded-lg space-y-4">
            <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider select-none flex items-center gap-1.5">
              <Play className="w-4 h-4 text-blue-500" />
              Build Configuration
            </h3>
            
            <form onSubmit={handleBuild} className="space-y-4">
              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-slate-400">Target Image Name *</label>
                <input 
                  type="text" 
                  value={imageName}
                  onChange={(e) => setImageName(e.target.value)}
                  className="w-full bg-slate-950 border border-border rounded px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-blue-500"
                  placeholder="e.g. express-web"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-slate-400">Tag Reference</label>
                <input 
                  type="text" 
                  value={imageTag}
                  onChange={(e) => setImageTag(e.target.value)}
                  className="w-full bg-slate-950 border border-border rounded px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-blue-500"
                  placeholder="latest"
                />
              </div>

              {/* Build Args */}
              <div className="space-y-2 pt-2 border-t border-border/40">
                <label className="text-[11px] font-semibold text-slate-400 block select-none">Build Arguments (ARG)</label>
                
                {buildArgs.length > 0 && (
                  <div className="space-y-1.5 max-h-32 overflow-y-auto pb-1">
                    {buildArgs.map((arg, idx) => (
                      <div key={idx} className="flex justify-between items-center bg-slate-950 p-1.5 border border-border/60 rounded text-[11px] font-mono">
                        <span className="truncate text-slate-300">{arg.key}={arg.value}</span>
                        <button 
                          type="button" 
                          onClick={() => removeBuildArg(idx)}
                          className="text-red-400 hover:text-red-300 p-0.5"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                <div className="flex gap-2">
                  <input 
                    type="text" 
                    placeholder="Key" 
                    value={newKey}
                    onChange={(e) => setNewKey(e.target.value)}
                    className="w-1/2 bg-slate-950 border border-border rounded px-2 py-1 text-xs text-slate-200 focus:outline-none"
                  />
                  <input 
                    type="text" 
                    placeholder="Value" 
                    value={newValue}
                    onChange={(e) => setNewValue(e.target.value)}
                    className="w-1/2 bg-slate-950 border border-border rounded px-2 py-1 text-xs text-slate-200 focus:outline-none"
                  />
                  <button 
                    type="button" 
                    onClick={addBuildArg}
                    className="p-1 bg-slate-900 border border-border rounded text-slate-300 hover:bg-slate-800"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={isStartingBuild || (validation && !validation.isValid)}
                className="w-full py-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 active:bg-blue-700 text-white text-xs font-semibold rounded transition flex items-center justify-center gap-1.5"
              >
                <Play className="w-3.5 h-3.5" />
                Trigger Build Task
              </button>
            </form>
          </div>

          {/* Documentation Helper */}
          <div className="bg-card border border-border/60 p-4 rounded-lg space-y-3">
            <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider select-none flex items-center gap-1.5">
              <HelpCircle className="w-4 h-4 text-slate-400" />
              Instruction Documentation
            </h3>

            <div className="space-y-3">
              <select 
                value={selectedInstruction}
                onChange={(e) => setSelectedInstruction(e.target.value)}
                className="w-full bg-slate-950 border border-border rounded p-1.5 text-xs text-slate-300 focus:outline-none"
              >
                {Object.keys(INSTRUCTIONS_DOCS).map((inst) => (
                  <option key={inst} value={inst}>{inst}</option>
                ))}
              </select>

              <div className="p-3 bg-slate-950/40 border border-border/60 rounded text-xs text-slate-400 leading-relaxed leading-relaxed font-sans">
                {INSTRUCTIONS_DOCS[selectedInstruction]}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Build Progress Stream Window */}
      {activeBuildId && (
        <BuildProgressWindow 
          buildId={activeBuildId} 
          onClose={() => {
            setActiveBuildId(null);
            refetchHistory();
          }} 
        />
      )}

      {/* Build History Grid */}
      <div className="bg-card border border-border p-4 rounded-lg space-y-4">
        <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider select-none flex items-center gap-1.5">
          <Clock className="w-4 h-4 text-blue-500" />
          Studio Build History
        </h3>

        {buildHistory.length === 0 ? (
          <p className="text-xs text-slate-500 italic">No previous build tasks registered inside this session</p>
        ) : (
          <div className="border border-border/60 rounded overflow-hidden">
            <table className="w-full text-left text-xs font-mono text-slate-300">
              <thead className="bg-sidebar text-slate-400 text-[10px] uppercase select-none border-b border-border/60">
                <tr>
                  <th className="p-3 font-semibold">Build ID</th>
                  <th className="p-3 font-semibold">Target Image</th>
                  <th className="p-3 font-semibold">Timestamp</th>
                  <th className="p-3 font-semibold">Status</th>
                  <th className="p-3 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/40 select-text">
                {buildHistory.map((b) => (
                  <tr key={b.buildId} className="hover:bg-slate-900/20">
                    <td className="p-3 select-all">{b.buildId}</td>
                    <td className="p-3 font-bold">{b.name}:{b.tag}</td>
                    <td className="p-3">{new Date(b.timestamp).toLocaleString()}</td>
                    <td className="p-3">
                      <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                        b.success ? 'bg-green-500/10 text-green-400 border border-green-500/20' : 'bg-red-500/10 text-red-400 border border-red-500/20'
                      }`}>
                        {b.success ? 'SUCCESS' : 'FAILED'}
                      </span>
                    </td>
                    <td className="p-3 text-right">
                      <button 
                        onClick={() => setActiveBuildId(b.buildId)}
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

interface BuildProgressProps {
  buildId: string;
  onClose: () => void;
}

function BuildProgressWindow({ buildId, onClose }: BuildProgressProps) {
  const { data: progress, isLoading } = useBuildProgress(buildId);

  // Auto-scroll logs terminal
  const terminalEndRef = React.useRef<HTMLDivElement>(null);
  useEffect(() => {
    terminalEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [progress?.stream]);

  return (
    <div className="fixed inset-0 bg-slate-950/85 backdrop-blur-sm flex items-center justify-center p-4 z-50 select-none">
      <div className="bg-card border border-border rounded-lg max-w-3xl w-full h-[550px] overflow-hidden shadow-2xl flex flex-col">
        <div className="flex justify-between items-center p-4 border-b border-border bg-sidebar">
          <h3 className="text-sm font-bold text-slate-200 flex items-center gap-1.5">
            <Terminal className="w-4 h-4 text-blue-500 animate-pulse" />
            Docker Image Build Console Stream
          </h3>
          <button 
            onClick={onClose}
            className="p-1 hover:bg-slate-800 text-slate-400 hover:text-white rounded transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Console stream log block */}
        <div className="flex-1 bg-black p-4 overflow-y-auto font-mono text-[11px] text-slate-300 select-text space-y-1">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center h-full text-slate-500 animate-pulse">
              <RefreshCw className="w-6 h-6 animate-spin text-blue-500 mb-1" />
              <p>Connecting to build thread logs...</p>
            </div>
          ) : !progress || !progress.stream ? (
            <p className="text-slate-500 italic">Initiating layers pack download...</p>
          ) : (
            <>
              {progress.stream.split('\n').map((line, idx) => (
                <div key={idx} className="whitespace-pre-wrap select-all">{line}</div>
              ))}
              <div ref={terminalEndRef} />
            </>
          )}
        </div>

        {/* Footer info status bar */}
        <div className="p-3 border-t border-border bg-sidebar flex justify-between items-center">
          <div className="text-[11px] text-slate-400">
            Build status: <span className="font-bold text-slate-200 capitalize">{progress?.status || 'loading'}</span>
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

export default DockerfileStudio;
