import React, { useState } from 'react';
import { 
  Box, 
  Search, 
  SlidersHorizontal, 
  Play, 
  Square, 
  RotateCw, 
  Pause, 
  RefreshCw, 
  Trash2, 
  Info, 
  Terminal, 
  X, 
  AlertOctagon, 
  Plus, 
  Settings, 
  Network, 
  HardDrive 
} from 'lucide-react';
import { useContainers, useContainer } from '../hooks/useContainers';

export function Containers() {
  const { 
    containers, 
    isLoading, 
    isError, 
    error, 
    refetch, 
    isFetching,
    createContainer,
    startContainer,
    stopContainer,
    restartContainer,
    pauseContainer,
    unpauseContainer,
    killContainer,
    removeContainer,
    renameContainer,
    isCreating
  } = useContainers();

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'running' | 'paused' | 'exited'>('all');
  const [sortBy, setSortBy] = useState<'name' | 'created'>('name');
  
  // Modals & Panels
  const [selectedContainerId, setSelectedContainerId] = useState<string | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isRenameContainerId, setIsRenameContainerId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState('');
  
  // Confirm deletion overlay
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);

  // Create Form State
  const [createImage, setCreateImage] = useState('');
  const [createName, setCreateName] = useState('');
  const [createPorts, setCreatePorts] = useState('');
  const [createEnv, setCreateEnv] = useState('');
  const [createCmd, setCreateCmd] = useState('');
  const [createError, setCreateError] = useState<string | null>(null);

  const handleAction = async (id: string, action: () => Promise<any>) => {
    setActionLoadingId(id);
    try {
      await action();
    } catch (err: any) {
      alert(err.message || 'Action failed');
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreateError(null);
    if (!createImage.trim()) {
      setCreateError('Docker image reference is required');
      return;
    }

    // Parse ports (format: host:container, host:container)
    const portPairs: Array<{ hostPort: number; containerPort: number }> = [];
    if (createPorts.trim()) {
      const mappings = createPorts.split(',').map(m => m.trim());
      for (const m of mappings) {
        const parts = m.split(':');
        const host = parseInt(parts[0] || '', 10);
        const container = parseInt(parts[1] || '', 10);
        if (isNaN(host) || isNaN(container)) {
          setCreateError('Ports must be in host:container format (e.g. 8080:80)');
          return;
        }
        portPairs.push({ hostPort: host, containerPort: container });
      }
    }

    // Parse Env variables (format: KEY=VAL, KEY=VAL)
    const envVars: string[] = [];
    if (createEnv.trim()) {
      envVars.push(...createEnv.split(',').map(e => e.trim()).filter(Boolean));
    }

    try {
      await createContainer({
        image: createImage.trim(),
        name: createName.trim() || undefined,
        ports: portPairs.length > 0 ? portPairs : undefined,
        env: envVars.length > 0 ? envVars : undefined,
        cmd: createCmd.trim() || undefined
      });
      setIsCreateModalOpen(false);
      setCreateImage('');
      setCreateName('');
      setCreatePorts('');
      setCreateEnv('');
      setCreateCmd('');
    } catch (err: any) {
      setCreateError(err.message || 'Failed to create container');
    }
  };

  const handleRename = async (id: string) => {
    if (!renameValue.trim()) return;
    try {
      await renameContainer({ id, name: renameValue.trim() });
      setIsRenameContainerId(null);
      setRenameValue('');
    } catch (err: any) {
      alert(err.message || 'Rename failed');
    }
  };

  // Filtered & Sorted containers list
  const filteredContainers = containers
    .filter((c) => {
      const matchSearch = c.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
        c.image.toLowerCase().includes(searchTerm.toLowerCase()) || 
        c.id.toLowerCase().includes(searchTerm.toLowerCase());
      
      if (statusFilter === 'all') return matchSearch;
      return matchSearch && c.state === statusFilter;
    })
    .sort((a, b) => {
      if (sortBy === 'name') {
        return a.name.localeCompare(b.name);
      }
      return b.created - a.created;
    });

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-slate-500 animate-pulse">
        <Box className="w-8 h-8 text-blue-500 animate-bounce mb-2" />
        <p className="text-xs">Loading Containers...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 pb-4 border-b border-border/40 select-none">
        <div>
          <h1 className="text-xl font-bold text-slate-100 flex items-center gap-2">
            <Box className="w-5 h-5 text-blue-500" />
            Container Manager
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Run, inspect, and manage Docker containers on the host daemon
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => refetch()}
            disabled={isFetching}
            className="py-1.5 px-3 bg-slate-900 hover:bg-slate-800 active:bg-slate-950 text-slate-300 border border-border hover:border-slate-600 disabled:opacity-50 rounded-lg text-xs font-semibold flex items-center gap-2 transition"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isFetching ? 'animate-spin text-blue-400' : ''}`} />
            Refresh
          </button>
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="py-1.5 px-3 bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white rounded-lg text-xs font-semibold flex items-center gap-2 transition"
          >
            <Plus className="w-3.5 h-3.5" />
            Create Container
          </button>
        </div>
      </div>

      {isError && (
        <div className="bg-red-500/10 border border-red-500/30 text-red-400 p-4 rounded-lg flex items-center gap-3 text-xs">
          <AlertOctagon className="w-4 h-4 shrink-0" />
          <span>Error connecting to Docker Engine: {error instanceof Error ? error.message : 'Unreachable socket'}</span>
        </div>
      )}

      {/* Toolbar Filter / Search */}
      <div className="flex flex-col md:flex-row justify-between items-center gap-3 bg-card border border-border/60 p-3 rounded-lg select-none">
        <div className="relative w-full md:w-80">
          <Search className="absolute left-3 top-2.5 w-3.5 h-3.5 text-slate-500" />
          <input 
            type="text" 
            placeholder="Search containers by name, ID, or image..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-slate-950 border border-border rounded pl-9 pr-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-blue-500 transition"
          />
        </div>

        <div className="flex items-center gap-4 w-full md:w-auto justify-end">
          <div className="flex items-center gap-2">
            <SlidersHorizontal className="w-3.5 h-3.5 text-slate-500" />
            <span className="text-[11px] text-slate-400">Filter:</span>
            <select 
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="bg-slate-950 border border-border rounded px-2 py-1 text-xs text-slate-300 focus:outline-none focus:border-blue-500"
            >
              <option value="all">All States</option>
              <option value="running">Running</option>
              <option value="paused">Paused</option>
              <option value="exited">Stopped</option>
            </select>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[11px] text-slate-400">Sort:</span>
            <select 
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="bg-slate-950 border border-border rounded px-2 py-1 text-xs text-slate-300 focus:outline-none focus:border-blue-500"
            >
              <option value="name">Name</option>
              <option value="created">Created Date</option>
            </select>
          </div>
        </div>
      </div>

      {/* Grid List */}
      {filteredContainers.length === 0 ? (
        <div className="bg-card border border-border/65 rounded-lg p-10 flex flex-col items-center justify-center text-center space-y-3">
          <Box className="w-12 h-12 text-slate-600" />
          <h3 className="text-sm font-semibold text-slate-300">No Containers Found</h3>
          <p className="text-xs text-slate-500 max-w-sm">
            Make sure Docker Daemon has containers, or run a new one from the header action button.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {filteredContainers.map((c) => {
            const isRunning = c.state === 'running';
            const isPaused = c.state === 'paused';
            
            return (
              <div 
                key={c.id} 
                className="bg-card border border-border hover:border-slate-700 rounded-lg p-4 flex flex-col justify-between transition group relative"
              >
                <div className="space-y-3">
                  <div className="flex justify-between items-start">
                    <div className="space-y-1 truncate pr-6">
                      {isRenameContainerId === c.id ? (
                        <div className="flex gap-1.5 items-center">
                          <input 
                            type="text" 
                            value={renameValue}
                            onChange={(e) => setRenameValue(e.target.value)}
                            className="bg-slate-950 border border-border rounded p-1 text-xs text-slate-200 focus:outline-none focus:border-blue-500 w-32"
                            required
                          />
                          <button 
                            onClick={() => handleRename(c.id)}
                            className="px-2 py-1 bg-blue-600 text-white rounded text-[10px]"
                          >
                            Save
                          </button>
                          <button 
                            onClick={() => setIsRenameContainerId(null)}
                            className="p-1 hover:bg-slate-800 rounded text-slate-500"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ) : (
                        <h3 
                          onClick={() => {
                            setIsRenameContainerId(c.id);
                            setRenameValue(c.name);
                          }}
                          className="text-sm font-bold text-slate-200 group-hover:text-blue-400 cursor-pointer transition truncate"
                          title="Click to rename"
                        >
                          {c.name}
                        </h3>
                      )}
                      <p className="text-[10px] font-mono text-slate-500 select-all shrink-0">
                        {c.id.slice(0, 12)}
                      </p>
                    </div>

                    <span className={`px-2 py-0.5 rounded text-[10px] uppercase font-bold shrink-0 ${
                      isRunning 
                        ? 'bg-status-connected/10 text-status-connected border border-status-connected/20' 
                        : isPaused 
                          ? 'bg-status-warning/10 text-status-warning border border-status-warning/20' 
                          : 'bg-status-disconnected/10 text-status-disconnected border border-status-disconnected/20'
                    }`}>
                      {c.state}
                    </span>
                  </div>

                  <div className="space-y-1.5 text-xs text-slate-400">
                    <div className="flex justify-between">
                      <span className="text-slate-500 text-[11px]">Image:</span>
                      <span className="truncate max-w-[180px] font-mono text-[11px]" title={c.image}>{c.image}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500 text-[11px]">Status:</span>
                      <span className="text-[11px]">{c.status}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500 text-[11px]">Ports:</span>
                      <span className="font-mono text-[10px] truncate max-w-[180px]">
                        {c.ports.length === 0 
                          ? 'none' 
                          : c.ports.map(p => p.publicPort ? `${p.publicPort}->${p.privatePort}` : p.privatePort).join(', ')}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Operations buttons */}
                <div className="mt-5 pt-3 border-t border-border/40 flex justify-between items-center gap-2 select-none">
                  <div className="flex gap-1.5">
                    {isRunning ? (
                      <>
                        <button 
                          onClick={() => handleAction(c.id, () => stopContainer(c.id))}
                          disabled={actionLoadingId === c.id}
                          className="p-1.5 hover:bg-slate-800 text-slate-400 hover:text-white border border-border rounded transition"
                          title="Stop container"
                        >
                          <Square className="w-3.5 h-3.5 fill-current" />
                        </button>
                        <button 
                          onClick={() => handleAction(c.id, () => pauseContainer(c.id))}
                          disabled={actionLoadingId === c.id}
                          className="p-1.5 hover:bg-slate-800 text-slate-400 hover:text-white border border-border rounded transition"
                          title="Pause container"
                        >
                          <Pause className="w-3.5 h-3.5 fill-current" />
                        </button>
                      </>
                    ) : isPaused ? (
                      <button 
                        onClick={() => handleAction(c.id, () => unpauseContainer(c.id))}
                        disabled={actionLoadingId === c.id}
                        className="p-1.5 hover:bg-slate-800 text-slate-400 hover:text-white border border-border rounded transition"
                        title="Unpause container"
                      >
                        <Play className="w-3.5 h-3.5 fill-current" />
                      </button>
                    ) : (
                      <button 
                        onClick={() => handleAction(c.id, () => startContainer(c.id))}
                        disabled={actionLoadingId === c.id}
                        className="p-1.5 hover:bg-slate-800 text-slate-400 hover:text-white border border-border rounded transition"
                        title="Start container"
                      >
                        <Play className="w-3.5 h-3.5 fill-current" />
                      </button>
                    )}

                    <button 
                      onClick={() => handleAction(c.id, () => restartContainer(c.id))}
                      disabled={actionLoadingId === c.id}
                      className="p-1.5 hover:bg-slate-800 text-slate-400 hover:text-white border border-border rounded transition"
                      title="Restart container"
                    >
                      <RotateCw className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div className="flex gap-1.5">
                    <button 
                      onClick={() => setSelectedContainerId(c.id)}
                      className="p-1.5 bg-slate-900 hover:bg-slate-800 text-slate-300 border border-border rounded transition flex items-center gap-1 text-[11px] font-semibold"
                      title="Inspect & Logs"
                    >
                      <Info className="w-3.5 h-3.5" />
                      Inspect
                    </button>

                    {!isRunning && !isPaused && (
                      <button 
                        onClick={() => setConfirmDeleteId(c.id)}
                        className="p-1.5 hover:bg-red-950 text-slate-500 hover:text-red-400 border border-border hover:border-red-900 rounded transition"
                        title="Remove container"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Confirm Delete Overlay */}
                {confirmDeleteId === c.id && (
                  <div className="absolute inset-0 bg-slate-950/95 rounded-lg p-4 flex flex-col justify-between z-10 border border-red-500/40">
                    <div className="space-y-1.5">
                      <h4 className="text-xs font-bold text-red-400 flex items-center gap-1.5">
                        <AlertOctagon className="w-3.5 h-3.5" />
                        Remove Container
                      </h4>
                      <p className="text-[11px] text-slate-400">
                        Are you sure you want to permanently delete container <strong>{c.name}</strong>?
                      </p>
                    </div>
                    <div className="flex gap-2 justify-end">
                      <button 
                        onClick={() => setConfirmDeleteId(null)}
                        className="px-2.5 py-1 bg-slate-900 border border-border text-slate-400 rounded text-xs transition"
                      >
                        Cancel
                      </button>
                      <button 
                        onClick={() => handleAction(c.id, () => removeContainer(c.id))}
                        className="px-2.5 py-1 bg-red-600 hover:bg-red-500 text-white rounded text-xs transition"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Inspect & Logs Slide Panel */}
      {selectedContainerId && (
        <DetailsPanel 
          id={selectedContainerId} 
          onClose={() => setSelectedContainerId(null)} 
          onKill={() => handleAction(selectedContainerId, () => killContainer(selectedContainerId))}
        />
      )}

      {/* Create Container Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-card border border-border rounded-lg max-w-md w-full overflow-hidden shadow-2xl flex flex-col">
            <div className="flex justify-between items-center p-4 border-b border-border bg-sidebar select-none">
              <h3 className="text-sm font-bold text-slate-200">Create New Container</h3>
              <button 
                onClick={() => setIsCreateModalOpen(false)}
                className="p-1 hover:bg-slate-800 text-slate-400 hover:text-white rounded transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreate} className="p-4 space-y-4">
              {createError && (
                <div className="bg-red-500/10 border border-red-500/30 text-red-400 p-3 rounded text-xs">
                  {createError}
                </div>
              )}

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-400">Docker Image *</label>
                <input 
                  type="text" 
                  value={createImage} 
                  onChange={(e) => setCreateImage(e.target.value)}
                  placeholder="e.g. nginx:latest, alpine"
                  className="w-full bg-slate-950 border border-border rounded p-2 text-xs text-slate-200 focus:outline-none focus:border-blue-500 transition"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-400">Container Name</label>
                <input 
                  type="text" 
                  value={createName} 
                  onChange={(e) => setCreateName(e.target.value)}
                  placeholder="e.g. my-web-server (optional)"
                  className="w-full bg-slate-950 border border-border rounded p-2 text-xs text-slate-200 focus:outline-none focus:border-blue-500 transition"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-400">Port Mapping</label>
                <input 
                  type="text" 
                  value={createPorts} 
                  onChange={(e) => setCreatePorts(e.target.value)}
                  placeholder="e.g. 8080:80, 3000:3000 (optional)"
                  className="w-full bg-slate-950 border border-border rounded p-2 text-xs text-slate-200 focus:outline-none focus:border-blue-500 transition"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-400">Environment Variables</label>
                <input 
                  type="text" 
                  value={createEnv} 
                  onChange={(e) => setCreateEnv(e.target.value)}
                  placeholder="e.g. NODE_ENV=production,PORT=3000 (optional)"
                  className="w-full bg-slate-950 border border-border rounded p-2 text-xs text-slate-200 focus:outline-none focus:border-blue-500 transition"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-400">Command</label>
                <input 
                  type="text" 
                  value={createCmd} 
                  onChange={(e) => setCreateCmd(e.target.value)}
                  placeholder="e.g. npm start (optional)"
                  className="w-full bg-slate-950 border border-border rounded p-2 text-xs text-slate-200 focus:outline-none focus:border-blue-500 transition"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-border/40 select-none">
                <button 
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="py-2 px-4 bg-slate-900 hover:bg-slate-800 border border-border text-slate-400 rounded text-xs transition"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  disabled={isCreating}
                  className="py-2 px-4 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white rounded text-xs transition"
                >
                  Create
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

interface DetailsPanelProps {
  id: string;
  onClose: () => void;
  onKill: () => void;
}

function DetailsPanel({ id, onClose, onKill }: DetailsPanelProps) {
  const { container, logs, isLoading, isLoadingLogs } = useContainer(id);
  const [activeTab, setActiveTab] = useState<'inspect' | 'logs'>('inspect');

  if (isLoading) {
    return (
      <div className="fixed inset-y-0 right-0 w-full md:w-[600px] bg-sidebar border-l border-border shadow-2xl p-6 flex flex-col justify-center items-center text-slate-500 z-40">
        <Box className="w-8 h-8 text-blue-500 animate-bounce mb-2" />
        <p className="text-xs">Loading container configurations...</p>
      </div>
    );
  }

  if (!container) {
    return (
      <div className="fixed inset-y-0 right-0 w-full md:w-[600px] bg-sidebar border-l border-border shadow-2xl p-6 flex flex-col justify-center items-center text-slate-500 z-40">
        <p className="text-xs">Failed to fetch container details</p>
        <button onClick={onClose} className="mt-4 px-3 py-1.5 bg-slate-900 border border-border rounded text-xs">
          Close
        </button>
      </div>
    );
  }

  return (
    <div className="fixed inset-y-0 right-0 w-full md:w-[600px] bg-sidebar border-l border-border shadow-2xl flex flex-col z-40 select-none">
      {/* Panel Header */}
      <div className="p-4 border-b border-border bg-card flex justify-between items-center">
        <div className="space-y-1 pr-6 truncate">
          <h3 className="text-sm font-bold text-slate-200 flex items-center gap-1.5 truncate">
            <Box className="w-4 h-4 text-blue-500 shrink-0" />
            {container.name}
          </h3>
          <p className="text-[10px] font-mono text-slate-500 select-all truncate">{container.id}</p>
        </div>
        <div className="flex items-center gap-2">
          {container.state.running && (
            <button 
              onClick={onKill}
              className="py-1 px-2.5 bg-red-950/40 hover:bg-red-950 text-red-400 hover:text-red-300 border border-red-900 rounded text-[10px] font-semibold transition"
            >
              Kill
            </button>
          )}
          <button 
            onClick={onClose}
            className="p-1 hover:bg-slate-800 text-slate-400 hover:text-white rounded transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Tabs Selector */}
      <div className="flex border-b border-border bg-card select-none">
        <button 
          onClick={() => setActiveTab('inspect')}
          className={`flex-1 py-2 text-center text-xs font-semibold border-b-2 transition ${
            activeTab === 'inspect' ? 'border-blue-500 text-blue-400 bg-slate-950/20' : 'border-transparent text-slate-400 hover:bg-slate-900/40'
          }`}
        >
          <Settings className="w-3.5 h-3.5 inline mr-1.5" />
          Inspect Settings
        </button>
        <button 
          onClick={() => setActiveTab('logs')}
          className={`flex-1 py-2 text-center text-xs font-semibold border-b-2 transition ${
            activeTab === 'logs' ? 'border-blue-500 text-blue-400 bg-slate-950/20' : 'border-transparent text-slate-400 hover:bg-slate-900/40'
          }`}
        >
          <Terminal className="w-3.5 h-3.5 inline mr-1.5" />
          Live Logs
        </button>
      </div>

      {/* Panel Scrollable Content */}
      <div className="flex-1 overflow-y-auto p-4 bg-slate-950/30">
        {activeTab === 'inspect' ? (
          <div className="space-y-5">
            {/* Basic Info */}
            <div className="bg-card border border-border/60 rounded-lg p-4 space-y-3">
              <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider">System State</h4>
              <div className="grid grid-cols-2 gap-3 text-xs font-mono">
                <div>
                  <span className="text-slate-500">Status:</span>{' '}
                  <span className="text-slate-300">{container.state.status}</span>
                </div>
                <div>
                  <span className="text-slate-500">Exit Code:</span>{' '}
                  <span className="text-slate-300">{container.state.exitCode}</span>
                </div>
                <div className="col-span-2">
                  <span className="text-slate-500">Started:</span>{' '}
                  <span className="text-slate-300">{new Date(container.state.startedAt).toLocaleString()}</span>
                </div>
              </div>
            </div>

            {/* Network Settings */}
            <div className="bg-card border border-border/60 rounded-lg p-4 space-y-3">
              <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                <Network className="w-3.5 h-3.5 text-slate-400" />
                Network Configuration
              </h4>
              {Object.keys(container.networks).length === 0 ? (
                <p className="text-xs text-slate-500 italic">No network links linked</p>
              ) : (
                Object.entries(container.networks).map(([name, net]) => (
                  <div key={name} className="border-b border-border/40 pb-2 last:border-b-0 last:pb-0 font-mono text-xs space-y-1">
                    <div className="text-blue-400 font-semibold text-[11px]">{name}</div>
                    <div className="grid grid-cols-2 gap-2 text-slate-400">
                      <div>IP: <span className="text-slate-300">{net.ipAddress || 'none'}</span></div>
                      <div>Gateway: <span className="text-slate-300">{net.gateway || 'none'}</span></div>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Mounts */}
            <div className="bg-card border border-border/60 rounded-lg p-4 space-y-3">
              <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                <HardDrive className="w-3.5 h-3.5 text-slate-400" />
                Volume Mounts
              </h4>
              {container.mounts.length === 0 ? (
                <p className="text-xs text-slate-500 italic text-[11px]">No active volume mounts</p>
              ) : (
                container.mounts.map((m, i) => (
                  <div key={i} className="border-b border-border/40 pb-2 last:border-b-0 last:pb-0 text-xs font-mono space-y-1 text-slate-400">
                    <div>Type: <span className="text-slate-300 capitalize">{m.type}</span></div>
                    <div className="truncate">Source: <span className="text-slate-300 select-all">{m.source}</span></div>
                    <div className="truncate">Dest: <span className="text-slate-300 select-all">{m.destination}</span></div>
                  </div>
                ))
              )}
            </div>

            {/* Env Variables */}
            <div className="bg-card border border-border/60 rounded-lg p-4 space-y-3">
              <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider">Environment Variables</h4>
              {container.env.length === 0 ? (
                <p className="text-xs text-slate-500 italic text-[11px]">No variables defined</p>
              ) : (
                <div className="bg-slate-950 p-2 border border-border/60 rounded font-mono text-[10px] text-slate-300 max-h-48 overflow-y-auto space-y-1 select-text">
                  {container.env.map((e, idx) => (
                    <div key={idx} className="truncate select-all">{e}</div>
                  ))}
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="flex flex-col h-full space-y-3">
            <div className="flex justify-between items-center text-xs text-slate-400 select-none">
              <span>Displaying last 100 log lines</span>
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" title="Streaming logs active"></span>
            </div>
            <div className="flex-1 bg-slate-950 border border-border rounded p-3 font-mono text-[10px] text-slate-300 overflow-y-auto space-y-1 h-[60vh] select-text">
              {isLoadingLogs ? (
                <p className="text-slate-500 italic">Connecting stream...</p>
              ) : logs.length === 0 ? (
                <p className="text-slate-500 italic">No logs generated yet</p>
              ) : (
                logs.map((line, idx) => (
                  <div key={idx} className="whitespace-pre-wrap select-all">{line}</div>
                ))
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default Containers;
