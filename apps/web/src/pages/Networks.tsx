import React, { useState } from 'react';
import { 
  Network, 
  Search, 
  Trash2, 
  Link, 
  Unlink, 
  Info, 
  X, 
  AlertTriangle, 
  Plus, 
  RefreshCw, 
  Globe, 
  Box 
} from 'lucide-react';
import { useNetworks, useNetwork } from '../hooks/useNetworks';
import { useContainers } from '../hooks/useContainers';

export function Networks() {
  const {
    networks,
    isLoading,
    isError,
    error,
    refetch,
    isFetching,
    createNetwork,
    deleteNetwork,
    connectContainer,
    disconnectContainer,
    pruneNetworks,
    isCreating,
    isPruning
  } = useNetworks();

  const { containers } = useContainers(); // Fetch containers list to populate the connection select box

  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<'name' | 'driver'>('name');

  // Modals & Panels
  const [selectedNetworkId, setSelectedNetworkId] = useState<string | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [connectContainerNetworkId, setConnectContainerNetworkId] = useState<string | null>(null);
  const [selectedContainerIdToConnect, setSelectedContainerIdToConnect] = useState('');

  // Confirms
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [isPruneConfirmOpen, setIsPruneConfirmOpen] = useState(false);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);

  // Form State
  const [createName, setCreateName] = useState('');
  const [createDriver, setCreateDriver] = useState('bridge');
  const [createAttachable, setCreateAttachable] = useState(true);
  const [createInternal, setCreateInternal] = useState(false);
  const [createIPv6, setCreateIPv6] = useState(false);
  const [createSubnet, setCreateSubnet] = useState('');
  const [createGateway, setCreateGateway] = useState('');
  const [createError, setCreateError] = useState<string | null>(null);
  const [connectError, setConnectError] = useState<string | null>(null);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreateError(null);
    if (!createName.trim()) {
      setCreateError('Network name is required');
      return;
    }

    try {
      await createNetwork({
        name: createName.trim(),
        driver: createDriver,
        attachable: createAttachable,
        internal: createInternal,
        enableIPv6: createIPv6,
        subnet: createSubnet.trim() || undefined,
        gateway: createGateway.trim() || undefined,
      });
      setIsCreateModalOpen(false);
      setCreateName('');
      setCreateDriver('bridge');
      setCreateAttachable(true);
      setCreateInternal(false);
      setCreateIPv6(false);
      setCreateSubnet('');
      setCreateGateway('');
    } catch (err: any) {
      setCreateError(err.message || 'Failed to create network');
    }
  };

  const handleConnect = async (e: React.FormEvent) => {
    e.preventDefault();
    setConnectError(null);
    if (!connectContainerNetworkId || !selectedContainerIdToConnect) {
      setConnectError('Select a container to connect');
      return;
    }

    try {
      await connectContainer({
        networkId: connectContainerNetworkId,
        containerId: selectedContainerIdToConnect
      });
      setConnectContainerNetworkId(null);
      setSelectedContainerIdToConnect('');
    } catch (err: any) {
      setConnectError(err.message || 'Failed to connect container');
    }
  };

  const handleDelete = async (id: string) => {
    setActionLoadingId(id);
    try {
      await deleteNetwork(id);
      setConfirmDeleteId(null);
    } catch (err: any) {
      alert(err.message || 'Failed to delete network');
    } finally {
      setActionLoadingId(null);
    }
  };

  const handlePrune = async () => {
    setActionLoadingId('prune');
    try {
      const result = await pruneNetworks();
      setIsPruneConfirmOpen(false);
      alert(`Pruned successfully. Removed ${result.spaceReclaimed} networks.`);
    } catch (err: any) {
      alert(err.message || 'Prune failed');
    } finally {
      setActionLoadingId(null);
    }
  };

  const filteredNetworks = networks
    .filter((net) => {
      const matchSearch = net.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        net.driver.toLowerCase().includes(searchTerm.toLowerCase()) ||
        net.id.toLowerCase().includes(searchTerm.toLowerCase());
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
        <Network className="w-8 h-8 text-blue-500 animate-bounce mb-2" />
        <p className="text-xs">Loading networks...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 pb-4 border-b border-border/40 select-none">
        <div>
          <h1 className="text-xl font-bold text-slate-100 flex items-center gap-2">
            <Network className="w-5 h-5 text-blue-500" />
            Network Manager
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Create, inspect, and connect Docker virtual bridge, host, overlay, and macvlan networks
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
            Create Network
          </button>
        </div>
      </div>

      {isError && (
        <div className="bg-red-500/10 border border-red-500/30 text-red-400 p-4 rounded-lg flex items-center gap-3 text-xs">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          <span>Error loading networks: {error instanceof Error ? error.message : 'Unreachable Docker Engine'}</span>
        </div>
      )}

      {/* Toolbar */}
      <div className="flex flex-col md:flex-row justify-between items-center gap-3 bg-card border border-border/60 p-3 rounded-lg select-none">
        <div className="relative w-full md:w-80">
          <Search className="absolute left-3 top-2.5 w-3.5 h-3.5 text-slate-500" />
          <input 
            type="text" 
            placeholder="Search networks by name, ID, or driver..." 
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
            <option value="name">Network Name</option>
            <option value="driver">Driver Type</option>
          </select>
        </div>
      </div>

      {/* Grid list */}
      {filteredNetworks.length === 0 ? (
        <div className="bg-card border border-border/65 rounded-lg p-10 flex flex-col items-center justify-center text-center space-y-3">
          <Network className="w-12 h-12 text-slate-600" />
          <h3 className="text-sm font-semibold text-slate-300">No Networks Found</h3>
          <p className="text-xs text-slate-500 max-w-sm">
            No virtual networks match the criteria. Create one using the create option.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {filteredNetworks.map((net) => {
            const cleanId = net.id.slice(0, 12);
            
            return (
              <div 
                key={net.id}
                className="bg-card border border-border hover:border-slate-700 rounded-lg p-4 flex flex-col justify-between transition group relative"
              >
                <div className="space-y-3">
                  <div className="flex justify-between items-start">
                    <div className="space-y-1 truncate pr-6">
                      <h3 
                        onClick={() => setSelectedNetworkId(net.id)}
                        className="text-sm font-bold text-slate-200 group-hover:text-blue-400 cursor-pointer transition truncate"
                        title={net.name}
                      >
                        {net.name}
                      </h3>
                      <p className="text-[10px] font-mono text-slate-500 select-all shrink-0">
                        {cleanId}
                      </p>
                    </div>

                    <span className="px-2 py-0.5 rounded text-[10px] uppercase font-bold bg-slate-900 border border-border text-slate-400 shrink-0">
                      {net.driver}
                    </span>
                  </div>

                  <div className="space-y-1.5 text-xs text-slate-400">
                    <div className="flex justify-between">
                      <span className="text-slate-500 text-[11px]">Scope:</span>
                      <span className="text-[11px] capitalize">{net.scope}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500 text-[11px]">Attachable:</span>
                      <span className="text-[11px]">{net.attachable ? 'Yes' : 'No'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500 text-[11px]">Internal:</span>
                      <span className="text-[11px]">{net.internal ? 'Yes' : 'No'}</span>
                    </div>
                  </div>
                </div>

                {/* Operations buttons */}
                <div className="mt-5 pt-3 border-t border-border/40 flex justify-between items-center gap-2 select-none">
                  <button 
                    onClick={() => {
                      setConnectContainerNetworkId(net.id);
                      setSelectedContainerIdToConnect(containers[0]?.id || '');
                    }}
                    className="p-1.5 hover:bg-slate-800 text-slate-400 hover:text-white border border-border rounded transition flex items-center gap-1 text-[11px]"
                    title="Connect container"
                  >
                    <Link className="w-3.5 h-3.5" />
                    Connect
                  </button>

                  <div className="flex gap-1.5">
                    <button 
                      onClick={() => setSelectedNetworkId(net.id)}
                      className="p-1.5 bg-slate-900 hover:bg-slate-800 text-slate-300 border border-border rounded transition flex items-center gap-1 text-[11px] font-semibold"
                      title="Inspect details and attached containers"
                    >
                      <Info className="w-3.5 h-3.5" />
                      Inspect
                    </button>

                    {net.name !== 'bridge' && net.name !== 'host' && net.name !== 'none' && (
                      <button 
                        onClick={() => setConfirmDeleteId(net.id)}
                        disabled={actionLoadingId === net.id}
                        className="p-1.5 hover:bg-red-950 text-slate-500 hover:text-red-400 border border-border hover:border-red-900 rounded transition"
                        title="Remove network"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Confirm Delete Overlay */}
                {confirmDeleteId === net.id && (
                  <div className="absolute inset-0 bg-slate-950/95 rounded-lg p-4 flex flex-col justify-between z-10 border border-red-500/40">
                    <div className="space-y-1.5">
                      <h4 className="text-xs font-bold text-red-400 flex items-center gap-1.5">
                        <AlertTriangle className="w-3.5 h-3.5" />
                        Delete Network
                      </h4>
                      <p className="text-[11px] text-slate-400">
                        Are you sure you want to permanently delete network? Connected containers will be disconnected.
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
                        onClick={() => handleDelete(net.id)}
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
      {selectedNetworkId && (
        <DetailsPanel 
          id={selectedNetworkId} 
          onClose={() => setSelectedNetworkId(null)} 
          onDisconnect={async (containerId) => {
            if (confirm(`Disconnect container from network?`)) {
              try {
                await disconnectContainer({ networkId: selectedNetworkId, containerId });
                refetch();
              } catch (err: any) {
                alert(err.message || 'Disconnect failed');
              }
            }
          }}
        />
      )}

      {/* Create Network Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-card border border-border rounded-lg max-w-md w-full overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
            <div className="flex justify-between items-center p-4 border-b border-border bg-sidebar select-none">
              <h3 className="text-sm font-bold text-slate-200">Create New Network</h3>
              <button 
                onClick={() => setIsCreateModalOpen(false)}
                className="p-1 hover:bg-slate-800 text-slate-400 hover:text-white rounded transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreate} className="p-4 space-y-4 overflow-y-auto">
              {createError && (
                <div className="bg-red-500/10 border border-red-500/30 text-red-400 p-3 rounded text-xs">
                  {createError}
                </div>
              )}

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-400">Network Name *</label>
                <input 
                  type="text" 
                  value={createName} 
                  onChange={(e) => setCreateName(e.target.value)}
                  placeholder="e.g. app-network, my-overlay"
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
                  <option value="bridge">bridge (Local container networks)</option>
                  <option value="host">host (Direct host network bypass)</option>
                  <option value="overlay">overlay (Swarm multi-host clusters)</option>
                  <option value="macvlan">macvlan (Direct MAC address interface)</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-400">Subnet Configuration (Optional)</label>
                <input 
                  type="text" 
                  value={createSubnet} 
                  onChange={(e) => setCreateSubnet(e.target.value)}
                  placeholder="e.g. 172.20.0.0/16"
                  className="w-full bg-slate-950 border border-border rounded p-2 text-xs text-slate-200 focus:outline-none focus:border-blue-500 transition"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-400">Gateway Configuration (Optional)</label>
                <input 
                  type="text" 
                  value={createGateway} 
                  onChange={(e) => setCreateGateway(e.target.value)}
                  placeholder="e.g. 172.20.0.1"
                  className="w-full bg-slate-950 border border-border rounded p-2 text-xs text-slate-200 focus:outline-none focus:border-blue-500 transition"
                />
              </div>

              <div className="flex flex-col gap-2 pt-2 text-xs text-slate-400 select-none">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input 
                    type="checkbox" 
                    checked={createAttachable} 
                    onChange={(e) => setCreateAttachable(e.target.checked)}
                    className="accent-blue-500"
                  />
                  <span>Attachable (Allow manual container links)</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input 
                    type="checkbox" 
                    checked={createInternal} 
                    onChange={(e) => setCreateInternal(e.target.checked)}
                    className="accent-blue-500"
                  />
                  <span>Internal (Restrict external internet access)</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input 
                    type="checkbox" 
                    checked={createIPv6} 
                    onChange={(e) => setCreateIPv6(e.target.checked)}
                    className="accent-blue-500"
                  />
                  <span>Enable IPv6</span>
                </label>
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

      {/* Connect Container Modal */}
      {connectContainerNetworkId && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 z-50 select-none">
          <div className="bg-card border border-border rounded-lg max-w-sm w-full overflow-hidden shadow-2xl flex flex-col">
            <div className="flex justify-between items-center p-4 border-b border-border bg-sidebar">
              <h3 className="text-sm font-bold text-slate-200">Connect Container</h3>
              <button 
                onClick={() => setConnectContainerNetworkId(null)}
                className="p-1 hover:bg-slate-800 text-slate-400 hover:text-white rounded transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleConnect} className="p-4 space-y-4">
              {connectError && (
                <div className="bg-red-500/10 border border-red-500/30 text-red-400 p-3 rounded text-xs">
                  {connectError}
                </div>
              )}

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-400">Select Container</label>
                <select 
                  value={selectedContainerIdToConnect}
                  onChange={(e) => setSelectedContainerIdToConnect(e.target.value)}
                  className="w-full bg-slate-950 border border-border rounded p-2 text-xs text-slate-300 focus:outline-none focus:border-blue-500"
                >
                  <option value="" disabled>-- Select container --</option>
                  {containers.map((c) => (
                    <option key={c.id} value={c.id}>{c.name} ({c.id.slice(0, 12)})</option>
                  ))}
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-border/40">
                <button 
                  type="button"
                  onClick={() => setConnectContainerNetworkId(null)}
                  className="py-2 px-4 bg-slate-900 hover:bg-slate-800 border border-border text-slate-400 rounded text-xs transition"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="py-2 px-4 bg-blue-600 hover:bg-blue-500 text-white rounded text-xs transition"
                >
                  Link
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* Prune Confirmation Modal */}
      {isPruneConfirmOpen && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-card border border-border rounded-lg max-w-sm w-full overflow-hidden shadow-2xl p-4 space-y-4">
            <h3 className="text-sm font-bold text-red-400 flex items-center gap-1.5 select-none">
              <AlertTriangle className="w-4 h-4" />
              Prune Unused Networks
            </h3>
            <p className="text-xs text-slate-400">
              Are you sure you want to delete all dangling/unused Docker networks? This cannot be undone and will delete networks that are not associated with at least one container.
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
  id: string;
  onClose: () => void;
  onDisconnect: (containerId: string) => Promise<void>;
}

function DetailsPanel({ id, onClose, onDisconnect }: DetailsPanelProps) {
  const { data: network, isLoading } = useNetwork(id);

  if (isLoading) {
    return (
      <div className="fixed inset-y-0 right-0 w-full md:w-[600px] bg-sidebar border-l border-border shadow-2xl p-6 flex flex-col justify-center items-center text-slate-500 z-40">
        <Network className="w-8 h-8 text-blue-500 animate-bounce mb-2" />
        <p className="text-xs">Loading network details...</p>
      </div>
    );
  }

  if (!network) {
    return (
      <div className="fixed inset-y-0 right-0 w-full md:w-[600px] bg-sidebar border-l border-border shadow-2xl p-6 flex flex-col justify-center items-center text-slate-500 z-40">
        <p className="text-xs">Failed to fetch network details</p>
        <button onClick={onClose} className="mt-4 px-3 py-1.5 bg-slate-900 border border-border rounded text-xs">
          Close
        </button>
      </div>
    );
  }

  const containerEntries = Object.entries(network.containers || {});

  return (
    <div className="fixed inset-y-0 right-0 w-full md:w-[600px] bg-sidebar border-l border-border shadow-2xl flex flex-col z-40 select-none">
      {/* Panel Header */}
      <div className="p-4 border-b border-border bg-card flex justify-between items-center">
        <div className="space-y-1 pr-6 truncate">
          <h3 className="text-sm font-bold text-slate-200 flex items-center gap-1.5 truncate">
            <Network className="w-4 h-4 text-blue-500 shrink-0" />
            {network.name}
          </h3>
          <p className="text-[10px] font-mono text-slate-500 select-all truncate">{network.id}</p>
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
        {/* Network Flags Info */}
        <div className="bg-card border border-border/60 rounded-lg p-4 space-y-3">
          <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider">Network Flag Configuration</h4>
          <div className="grid grid-cols-2 gap-3 text-xs font-mono text-slate-400">
            <div>
              Driver: <span className="text-slate-200 capitalize">{network.driver}</span>
            </div>
            <div>
              Scope: <span className="text-slate-200 capitalize">{network.scope}</span>
            </div>
            <div>
              Attachable: <span className="text-slate-200">{network.attachable ? 'Yes' : 'No'}</span>
            </div>
            <div>
              Internal: <span className="text-slate-200">{network.internal ? 'Yes' : 'No'}</span>
            </div>
            <div>
              IPv6: <span className="text-slate-200">{network.enableIPv6 ? 'Enabled' : 'Disabled'}</span>
            </div>
          </div>
        </div>

        {/* IPAM Configuration */}
        <div className="bg-card border border-border/60 rounded-lg p-4 space-y-3">
          <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
            <Globe className="w-3.5 h-3.5 text-slate-400" />
            IPAM Subnet Settings
          </h4>
          <div className="font-mono text-xs text-slate-400 space-y-1.5">
            <div>IPAM Driver: <span className="text-slate-200 capitalize">{network.ipam.driver}</span></div>
            {network.ipam.config.length === 0 ? (
              <div className="text-slate-500 italic text-[11px]">No static subnet defined</div>
            ) : (
              network.ipam.config.map((cfg, idx) => (
                <div key={idx} className="border-t border-border/40 pt-2 mt-2 space-y-1">
                  <div>Subnet: <span className="text-slate-300 select-all">{cfg.subnet || 'default'}</span></div>
                  <div>Gateway: <span className="text-slate-300 select-all">{cfg.gateway || 'default'}</span></div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Attached Containers */}
        <div className="bg-card border border-border/60 rounded-lg p-4 space-y-3">
          <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
            <Box className="w-3.5 h-3.5 text-slate-400" />
            Connected Containers ({containerEntries.length})
          </h4>
          {containerEntries.length === 0 ? (
            <p className="text-xs text-slate-500 italic text-[11px]">No containers linked to this network</p>
          ) : (
            <div className="space-y-3">
              {containerEntries.map(([cId, val]) => (
                <div key={cId} className="border border-border/60 bg-slate-950/40 rounded p-3 text-xs font-mono space-y-1.5 relative group">
                  <div className="flex justify-between items-start">
                    <span className="text-blue-400 font-bold">{val.name}</span>
                    <button 
                      onClick={() => onDisconnect(cId)}
                      className="p-1 hover:bg-slate-800 text-slate-500 hover:text-red-400 rounded transition absolute right-3 top-3"
                      title="Disconnect container"
                    >
                      <Unlink className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <div className="text-[10px] text-slate-500 select-all">{cId.slice(0, 12)}</div>
                  <div className="grid grid-cols-2 gap-2 text-slate-400 text-[11px] pt-1">
                    <div>IPv4: <span className="text-slate-300 select-all">{val.ipv4Address || 'none'}</span></div>
                    <div>MAC: <span className="text-slate-300 select-all">{val.macAddress || 'none'}</span></div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default Networks;
