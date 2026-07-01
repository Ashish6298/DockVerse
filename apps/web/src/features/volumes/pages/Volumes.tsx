import React, { useState } from 'react';
import { 
  HardDrive, 
  Search, 
  Trash2, 
  Info, 
  X, 
  AlertTriangle, 
  Plus, 
  RefreshCw, 
  FolderOpen,
  Tag
} from 'lucide-react';
import { useVolumes, useVolume } from '../hooks/useVolumes';
import { formatBytes } from '@dockverse/utils';

export function Volumes() {
  const {
    volumes,
    isLoading,
    isError,
    error,
    refetch,
    isFetching,
    createVolume,
    deleteVolume,
    pruneVolumes,
    isCreating,
    isPruning
  } = useVolumes();

  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<'name' | 'driver'>('name');

  // Modals & Panels
  const [selectedVolumeName, setSelectedVolumeName] = useState<string | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  // Confirms
  const [confirmDeleteName, setConfirmDeleteName] = useState<string | null>(null);
  const [isPruneConfirmOpen, setIsPruneConfirmOpen] = useState(false);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);

  // Form State
  const [createName, setCreateName] = useState('');
  const [createDriver, setCreateDriver] = useState('local');
  const [createError, setCreateError] = useState<string | null>(null);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreateError(null);
    if (!createName.trim()) {
      setCreateError('Volume name is required');
      return;
    }

    try {
      await createVolume({
        name: createName.trim(),
        driver: createDriver,
      });
      setIsCreateModalOpen(false);
      setCreateName('');
      setCreateDriver('local');
    } catch (err: any) {
      setCreateError(err.message || 'Failed to create volume');
    }
  };

  const handleDelete = async (name: string) => {
    setActionLoadingId(name);
    try {
      await deleteVolume(name);
      setConfirmDeleteName(null);
    } catch (err: any) {
      alert(err.message || 'Failed to delete volume');
    } finally {
      setActionLoadingId(null);
    }
  };

  const handlePrune = async () => {
    setActionLoadingId('prune');
    try {
      const result = await pruneVolumes();
      setIsPruneConfirmOpen(false);
      alert(`Pruned successfully. Reclaimed ${formatBytes(result.spaceReclaimed)}.`);
    } catch (err: any) {
      alert(err.message || 'Prune failed');
    } finally {
      setActionLoadingId(null);
    }
  };

  const filteredVolumes = volumes
    .filter((vol) => {
      const matchSearch = vol.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        vol.driver.toLowerCase().includes(searchTerm.toLowerCase());
      return matchSearch;
    })
    .sort((a, b) => {
      if (sortBy === 'name') {
        return a.name.localeCompare(b.name);
      }
      return a.driver.localeCompare(b.driver);
    });

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-slate-500 animate-pulse">
        <HardDrive className="w-8 h-8 text-blue-500 animate-bounce mb-2" />
        <p className="text-xs">Loading volumes...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 pb-4 border-b border-border/40 select-none">
        <div>
          <h1 className="text-xl font-bold text-slate-100 flex items-center gap-2">
            <HardDrive className="w-5 h-5 text-blue-500" />
            Volume Manager
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Create, inspect, and remove persistent storage volumes for container filesystems
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
            onClick={() => setIsPruneConfirmOpen(true)}
            disabled={isPruning}
            className="py-1.5 px-3 bg-slate-900 hover:bg-red-950 hover:text-red-300 hover:border-red-900 text-slate-400 border border-border rounded-lg text-xs font-semibold flex items-center gap-2 transition"
          >
            Prune Unused
          </button>
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="py-1.5 px-3 bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white rounded-lg text-xs font-semibold flex items-center gap-2 transition"
          >
            <Plus className="w-3.5 h-3.5" />
            Create Volume
          </button>
        </div>
      </div>

      {isError && (
        <div className="bg-red-500/10 border border-red-500/30 text-red-400 p-4 rounded-lg flex items-center gap-3 text-xs">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          <span>Error loading volumes: {error instanceof Error ? error.message : 'Unreachable Docker Engine'}</span>
        </div>
      )}

      {/* Toolbar */}
      <div className="flex flex-col md:flex-row justify-between items-center gap-3 bg-card border border-border/60 p-3 rounded-lg select-none">
        <div className="relative w-full md:w-80">
          <Search className="absolute left-3 top-2.5 w-3.5 h-3.5 text-slate-500" />
          <input 
            type="text" 
            placeholder="Search volumes by name or driver..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-slate-950 border border-border rounded pl-9 pr-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-blue-500 transition"
          />
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto justify-end">
          <span className="text-[11px] text-slate-400">Sort By:</span>
          <select 
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="bg-slate-950 border border-border rounded px-2 py-1 text-xs text-slate-300 focus:outline-none focus:border-blue-500"
          >
            <option value="name">Volume Name</option>
            <option value="driver">Driver Type</option>
          </select>
        </div>
      </div>

      {/* Grid list */}
      {filteredVolumes.length === 0 ? (
        <div className="bg-card border border-border/65 rounded-lg p-10 flex flex-col items-center justify-center text-center space-y-3">
          <HardDrive className="w-12 h-12 text-slate-600" />
          <h3 className="text-sm font-semibold text-slate-300">No Volumes Found</h3>
          <p className="text-xs text-slate-500 max-w-sm">
            No persistent volumes match the criteria. Create one using the create option.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {filteredVolumes.map((vol) => {
            return (
              <div 
                key={vol.name}
                className="bg-card border border-border hover:border-slate-700 rounded-lg p-4 flex flex-col justify-between transition group relative"
              >
                <div className="space-y-3">
                  <div className="flex justify-between items-start">
                    <div className="space-y-1 truncate pr-6">
                      <h3 
                        onClick={() => setSelectedVolumeName(vol.name)}
                        className="text-sm font-bold text-slate-200 group-hover:text-blue-400 cursor-pointer transition truncate"
                        title={vol.name}
                      >
                        {vol.name}
                      </h3>
                      <p className="text-[10px] text-slate-500 truncate">
                        Mountpoint: <span className="font-mono">{vol.mountpoint}</span>
                      </p>
                    </div>

                    <span className="px-2 py-0.5 rounded text-[10px] uppercase font-bold bg-slate-900 border border-border text-slate-400 shrink-0">
                      {vol.driver}
                    </span>
                  </div>

                  <div className="space-y-1.5 text-xs text-slate-400">
                    <div className="flex justify-between">
                      <span className="text-slate-500 text-[11px]">Scope:</span>
                      <span className="text-[11px] capitalize">{vol.scope}</span>
                    </div>
                    {vol.usageData && (
                      <>
                        <div className="flex justify-between">
                          <span className="text-slate-500 text-[11px]">Size:</span>
                          <span className="text-[11px]">{formatBytes(vol.usageData.size)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-500 text-[11px]">Containers Linked:</span>
                          <span className="text-[11px]">{vol.usageData.refCount}</span>
                        </div>
                      </>
                    )}
                  </div>
                </div>

                {/* Operations buttons */}
                <div className="mt-5 pt-3 border-t border-border/40 flex justify-between items-center gap-2 select-none">
                  <button 
                    onClick={() => setSelectedVolumeName(vol.name)}
                    className="p-1.5 bg-slate-900 hover:bg-slate-800 text-slate-300 border border-border rounded transition flex items-center gap-1 text-[11px] font-semibold"
                    title="Inspect details and mounts"
                  >
                    <Info className="w-3.5 h-3.5" />
                    Inspect
                  </button>

                  <button 
                    onClick={() => setConfirmDeleteName(vol.name)}
                    disabled={actionLoadingId === vol.name}
                    className="p-1.5 hover:bg-red-950 text-slate-500 hover:text-red-400 border border-border hover:border-red-900 rounded transition"
                    title="Remove volume"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Confirm Delete Overlay */}
                {confirmDeleteName === vol.name && (
                  <div className="absolute inset-0 bg-slate-950/95 rounded-lg p-4 flex flex-col justify-between z-10 border border-red-500/40">
                    <div className="space-y-1.5">
                      <h4 className="text-xs font-bold text-red-400 flex items-center gap-1.5">
                        <AlertTriangle className="w-3.5 h-3.5" />
                        Delete Volume
                      </h4>
                      <p className="text-[11px] text-slate-400">
                        Are you sure you want to permanently delete volume? All persistent storage files inside it will be lost.
                      </p>
                    </div>
                    <div className="flex gap-2 justify-end">
                      <button 
                        onClick={() => setConfirmDeleteName(null)}
                        className="px-2.5 py-1 bg-slate-900 border border-border text-slate-400 rounded text-xs transition"
                      >
                        Cancel
                      </button>
                      <button 
                        onClick={() => handleDelete(vol.name)}
                        className="px-2.5 py-1 bg-red-600 hover:bg-red-500 text-white rounded text-xs transition"
                      >
                        Confirm
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Details Slide Panel */}
      {selectedVolumeName && (
        <DetailsPanel 
          name={selectedVolumeName} 
          onClose={() => setSelectedVolumeName(null)} 
        />
      )}

      {/* Create Volume Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-card border border-border rounded-lg max-w-md w-full overflow-hidden shadow-2xl flex flex-col">
            <div className="flex justify-between items-center p-4 border-b border-border bg-sidebar select-none">
              <h3 className="text-sm font-bold text-slate-200">Create New Volume</h3>
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
                <label className="text-xs font-semibold text-slate-400">Volume Name *</label>
                <input 
                  type="text" 
                  value={createName} 
                  onChange={(e) => setCreateName(e.target.value)}
                  placeholder="e.g. database-storage, logs-volume"
                  className="w-full bg-slate-950 border border-border rounded p-2 text-xs text-slate-200 focus:outline-none focus:border-blue-500 transition"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-400">Driver Type</label>
                <select 
                  value={createDriver}
                  onChange={(e) => setCreateDriver(e.target.value)}
                  className="w-full bg-slate-950 border border-border rounded p-2 text-xs text-slate-300 focus:outline-none focus:border-blue-500"
                >
                  <option value="local">local (Standard persistent host volume)</option>
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-border/40 select-none">
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

      {/* Pruning Confirm Modal */}
      {isPruneConfirmOpen && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-card border border-border rounded-lg max-w-sm w-full overflow-hidden shadow-2xl p-4 space-y-4">
            <h3 className="text-sm font-bold text-red-400 flex items-center gap-1.5 select-none">
              <AlertTriangle className="w-4 h-4" />
              Prune Unused Volumes
            </h3>
            <p className="text-xs text-slate-400">
              Are you sure you want to delete all dangling/unused Docker volumes? This cannot be undone and will delete volumes that are not associated with at least one container.
            </p>
            <div className="flex gap-2 justify-end select-none">
              <button 
                onClick={() => setIsPruneConfirmOpen(false)}
                className="py-1.5 px-3 bg-slate-900 border border-border text-slate-400 rounded text-xs transition"
              >
                Cancel
              </button>
              <button 
                onClick={handlePrune}
                disabled={actionLoadingId === 'prune'}
                className="py-1.5 px-3 bg-red-600 hover:bg-red-500 text-white rounded text-xs transition"
              >
                Confirm Prune
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

interface DetailsPanelProps {
  name: string;
  onClose: () => void;
}

function DetailsPanel({ name, onClose }: DetailsPanelProps) {
  const { data: volume, isLoading } = useVolume(name);

  if (isLoading) {
    return (
      <div className="fixed inset-y-0 right-0 w-full md:w-[600px] bg-sidebar border-l border-border shadow-2xl p-6 flex flex-col justify-center items-center text-slate-500 z-40">
        <HardDrive className="w-8 h-8 text-blue-500 animate-bounce mb-2" />
        <p className="text-xs">Loading volume details...</p>
      </div>
    );
  }

  if (!volume) {
    return (
      <div className="fixed inset-y-0 right-0 w-full md:w-[600px] bg-sidebar border-l border-border shadow-2xl p-6 flex flex-col justify-center items-center text-slate-500 z-40">
        <p className="text-xs">Failed to fetch volume details</p>
        <button onClick={onClose} className="mt-4 px-3 py-1.5 bg-slate-900 border border-border rounded text-xs">
          Close
        </button>
      </div>
    );
  }

  const labelEntries = Object.entries(volume.labels || {});

  return (
    <div className="fixed inset-y-0 right-0 w-full md:w-[600px] bg-sidebar border-l border-border shadow-2xl flex flex-col z-40 select-none">
      {/* Panel Header */}
      <div className="p-4 border-b border-border bg-card flex justify-between items-center">
        <div className="space-y-1 pr-6 truncate">
          <h3 className="text-sm font-bold text-slate-200 flex items-center gap-1.5 truncate">
            <HardDrive className="w-4 h-4 text-blue-500 shrink-0" />
            {volume.name}
          </h3>
          <p className="text-[10px] font-mono text-slate-500 truncate">{volume.mountpoint}</p>
        </div>
        <button 
          onClick={onClose}
          className="p-1 hover:bg-slate-800 text-slate-400 hover:text-white rounded transition"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 bg-slate-950/30 space-y-5">
        {/* Info configuration */}
        <div className="bg-card border border-border/60 rounded-lg p-4 space-y-3">
          <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider">Volume Configurations</h4>
          <div className="grid grid-cols-2 gap-3 text-xs font-mono text-slate-400">
            <div>
              Driver: <span className="text-slate-200 capitalize">{volume.driver}</span>
            </div>
            <div>
              Scope: <span className="text-slate-200 capitalize">{volume.scope}</span>
            </div>
            {volume.usageData && (
              <>
                <div>
                  Size: <span className="text-slate-200">{formatBytes(volume.usageData.size)}</span>
                </div>
                <div>
                  Containers Count: <span className="text-slate-200">{volume.usageData.refCount}</span>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Labels configuration */}
        <div className="bg-card border border-border/60 rounded-lg p-4 space-y-3">
          <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
            <Tag className="w-3.5 h-3.5 text-slate-400" />
            Labels
          </h4>
          {labelEntries.length === 0 ? (
            <p className="text-xs text-slate-500 italic text-[11px]">No labels defined</p>
          ) : (
            <div className="font-mono text-xs text-slate-400 space-y-2 max-h-48 overflow-y-auto bg-slate-950 p-3 border border-border/60 rounded select-text">
              {labelEntries.map(([k, v]) => (
                <div key={k} className="truncate select-all">{k}: <span className="text-slate-300">{v}</span></div>
              ))}
            </div>
          )}
        </div>

        {/* Mount Point configuration */}
        <div className="bg-card border border-border/60 rounded-lg p-4 space-y-3">
          <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
            <FolderOpen className="w-3.5 h-3.5 text-slate-400" />
            Host Mount Path
          </h4>
          <div className="bg-slate-950 p-3 border border-border/60 rounded font-mono text-xs text-slate-300 select-all truncate">
            {volume.mountpoint}
          </div>
        </div>
      </div>
    </div>
  );
}

export default Volumes;
