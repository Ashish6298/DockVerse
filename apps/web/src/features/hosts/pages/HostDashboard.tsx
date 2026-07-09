import React, { useState } from 'react';
import {
  Server,
  Plus,
  Trash2,
  RefreshCcw,
  X,
  CheckCircle2,
  Activity,
  HardDrive,
  Cpu
} from 'lucide-react';
import {
  useHostsDashboard,
  useHostsList,
  useHostOperations,
  useHostOperation,
  useHostMutations
} from '../hooks/useHosts';
import { useHostStore } from '../store/hostStore';

export function HostDashboard() {
  const {
    activeTab,
    selectedHostId,
    activeOperationId,
    isCreateModalOpen,
    setActiveTab,
    setSelectedHostId,
    setActiveOperationId,
    setCreateModalOpen
  } = useHostStore();

  const dashboardQuery = useHostsDashboard();
  const hostsQuery = useHostsList();
  const operationsQuery = useHostOperations();
  const activeOpQuery = useHostOperation(activeOperationId || '');

  const mutations = useHostMutations();

  // Selected host details
  const selectedHost = hostsQuery.data?.find(h => h.id === selectedHostId);

  // Form states
  const [hostForm, setHostForm] = useState({
    name: '',
    displayName: '',
    description: '',
    hostname: '',
    ipAddress: '',
    port: 2375,
    connectionType: 'socket' as 'socket' | 'tcp' | 'tls' | 'ssh' | 'wsl',
    enabled: true
  });

  const handleHostSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!hostForm.name || !hostForm.displayName) return;
    try {
      await mutations.createHost(hostForm);
      setCreateModalOpen(false);
      setHostForm({
        name: '',
        displayName: '',
        description: '',
        hostname: '',
        ipAddress: '',
        port: 2375,
        connectionType: 'socket',
        enabled: true
      });
    } catch (err: any) {
      alert(err.message || 'Failed to add remote host');
    }
  };

  const handleTestConnection = async (id: string) => {
    try {
      const res = await mutations.testConnection(id);
      setActiveOperationId(res.operationId);
    } catch (err: any) {
      alert(err.message || 'Connection test failed');
    }
  };

  const handleConnect = async (id: string) => {
    try {
      const res = await mutations.connectHost(id);
      setActiveOperationId(res.operationId);
    } catch (err: any) {
      alert(err.message || 'Connection failed');
    }
  };

  const handleDisconnect = async (id: string) => {
    try {
      const res = await mutations.disconnectHost(id);
      setActiveOperationId(res.operationId);
    } catch (err: any) {
      alert(err.message || 'Disconnection failed');
    }
  };

  const handleSync = async (id: string) => {
    try {
      const res = await mutations.syncMetadata(id);
      setActiveOperationId(res.operationId);
    } catch (err: any) {
      alert(err.message || 'Synchronization failed');
    }
  };

  return (
    <div className="space-y-6">
      {/* Title Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-800 pb-4">
        <div>
          <h1 className="text-xl font-bold flex items-center gap-2 text-white">
            <Server className="w-6 h-6 text-blue-500" />
            Remote Hosts & Multi-Cluster Manager
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Manage Docker Engines, cloud VM instances, edge devices, and remote node connections across your fleet.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => dashboardQuery.refetch()}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 border border-slate-800 hover:bg-slate-800 rounded text-xs text-slate-300 font-medium transition"
          >
            <RefreshCcw className="w-3.5 h-3.5" />
            Refresh
          </button>
          <button
            onClick={() => setCreateModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded text-xs font-semibold shadow-md shadow-blue-500/20 transition"
          >
            <Plus className="w-3.5 h-3.5" />
            Add Remote Host
          </button>
        </div>
      </div>

      {/* Active Polling Operation Status */}
      {activeOperationId && activeOpQuery.data && (
        <div className="bg-slate-900 border border-blue-500/20 rounded-lg p-4 shadow-xl">
          <div className="flex justify-between items-start">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-blue-500 animate-pulse"></span>
              <h4 className="text-xs font-semibold text-white">
                Active Operation: <span className="text-blue-400">{activeOpQuery.data.action}</span>
              </h4>
            </div>
            <button onClick={() => setActiveOperationId(null)} className="text-slate-500 hover:text-white">
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="mt-3 flex items-center gap-4">
            <div className="flex-1 bg-slate-800 rounded-full h-2 overflow-hidden">
              <div
                className="bg-blue-500 h-full rounded-full transition-all duration-500"
                style={{ width: `${activeOpQuery.data.progress}%` }}
              ></div>
            </div>
            <span className="text-[11px] font-mono text-slate-400 shrink-0">{activeOpQuery.data.progress}%</span>
          </div>
          <div className="mt-2.5 max-h-24 overflow-y-auto bg-slate-950 p-2 rounded text-[10px] font-mono text-slate-455 space-y-1">
            {activeOpQuery.data.logs.map((log, idx) => (
              <div key={idx}>&gt; {log}</div>
            ))}
          </div>
          {activeOpQuery.data.status !== 'running' && (
            <div className="mt-2.5 flex justify-end">
              <button
                onClick={() => setActiveOperationId(null)}
                className={`px-2.5 py-1 text-xs font-semibold rounded ${
                  activeOpQuery.data.status === 'success' ? 'bg-emerald-650 text-white' : 'bg-red-650 text-white'
                }`}
              >
                Dismiss ({activeOpQuery.data.status.toUpperCase()})
              </button>
            </div>
          )}
        </div>
      )}

      {/* Summary Dashboard Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-slate-900 border border-slate-800 p-5 rounded-lg flex items-center justify-between shadow-sm">
          <div>
            <span className="text-[10px] text-slate-550 font-bold uppercase tracking-wider">Online Hosts</span>
            <h3 className="text-xl font-extrabold mt-1 text-emerald-500">{dashboardQuery.data?.onlineHosts || 0} / {dashboardQuery.data?.totalHosts || 0}</h3>
          </div>
          <div className="p-3 bg-emerald-500/10 text-emerald-500 rounded-lg"><CheckCircle2 className="w-5 h-5" /></div>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-5 rounded-lg flex items-center justify-between shadow-sm">
          <div>
            <span className="text-[10px] text-slate-550 font-bold uppercase tracking-wider">Avg Latency</span>
            <h3 className="text-xl font-extrabold mt-1 text-white">{dashboardQuery.data?.avgLatency || 0} ms</h3>
          </div>
          <div className="p-3 bg-blue-500/10 text-blue-400 rounded-lg"><Activity className="w-5 h-5" /></div>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-5 rounded-lg flex items-center justify-between shadow-sm">
          <div>
            <span className="text-[10px] text-slate-550 font-bold uppercase tracking-wider">Fleet Core Count</span>
            <h3 className="text-xl font-extrabold mt-1 text-blue-500">{dashboardQuery.data?.fleetCpu || 0} vCPUs</h3>
          </div>
          <div className="p-3 bg-blue-500/10 text-blue-550 rounded-lg"><Cpu className="w-5 h-5" /></div>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-5 rounded-lg flex items-center justify-between shadow-sm">
          <div>
            <span className="text-[10px] text-slate-550 font-bold uppercase tracking-wider">Fleet Total RAM</span>
            <h3 className="text-xl font-extrabold mt-1 text-orange-500">{Math.round((dashboardQuery.data?.fleetMemory || 0) / 1024)} GB</h3>
          </div>
          <div className="p-3 bg-orange-500/10 text-orange-500 rounded-lg"><HardDrive className="w-5 h-5" /></div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex border-b border-slate-800 gap-1">
        <button
          onClick={() => { setActiveTab('dashboard'); setSelectedHostId(null); }}
          className={`px-4 py-2 text-xs font-semibold border-b-2 transition ${
            activeTab === 'dashboard' ? 'border-blue-500 text-blue-400 bg-blue-500/5' : 'border-transparent text-slate-400 hover:text-slate-350'
          }`}
        >
          Fleet Performance Metrics
        </button>
        <button
          onClick={() => { setActiveTab('hosts'); setSelectedHostId(null); }}
          className={`px-4 py-2 text-xs font-semibold border-b-2 transition ${
            activeTab === 'hosts' ? 'border-blue-500 text-blue-400 bg-blue-500/5' : 'border-transparent text-slate-400 hover:text-slate-350'
          }`}
        >
          Remote Hosts list ({hostsQuery.data?.length || 0})
        </button>
        <button
          onClick={() => { setActiveTab('history'); setSelectedHostId(null); }}
          className={`px-4 py-2 text-xs font-semibold border-b-2 transition ${
            activeTab === 'history' ? 'border-blue-500 text-blue-400 bg-blue-500/5' : 'border-transparent text-slate-400 hover:text-slate-350'
          }`}
        >
          Operation logs
        </button>
      </div>

      {/* DASHBOARD TAB VIEW */}
      {activeTab === 'dashboard' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-slate-900 border border-slate-800 p-5 rounded-lg space-y-4 shadow-sm">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Fleet Core Allocations</h3>
            <div className="h-44 flex items-center justify-center">
              <svg viewBox="0 0 100 30" className="w-full h-full text-blue-500 stroke-current stroke-2 fill-none">
                <path d="M0,25 Q15,22 30,15 T60,8 T90,5" />
                <circle cx="90" cy="5" r="1.5" className="fill-blue-500" />
              </svg>
            </div>
            <div className="flex justify-between text-[10px] font-mono text-slate-550">
              <span>May</span>
              <span>June</span>
              <span>July (vCPUs: {dashboardQuery.data?.fleetCpu || 0})</span>
            </div>
          </div>

          <div className="bg-slate-900 border border-slate-800 p-5 rounded-lg space-y-4 shadow-sm">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Fleet Ingested Networks</h3>
            <div className="h-44 flex items-center justify-center">
              <svg viewBox="0 0 100 30" className="w-full h-full text-emerald-500 stroke-current stroke-2 fill-none">
                <path d="M0,5 Q15,10 30,12 T60,18 T90,26" />
                <circle cx="90" cy="26" r="1.5" className="fill-emerald-500" />
              </svg>
            </div>
            <div className="flex justify-between text-[10px] font-mono text-slate-550">
              <span>May</span>
              <span>June</span>
              <span>July (Networks: {dashboardQuery.data?.fleetNetworks || 0})</span>
            </div>
          </div>
        </div>
      )}

      {/* HOSTS TAB VIEW */}
      {activeTab === 'hosts' && (
        <div className="space-y-6">
          <div className="bg-slate-900 border border-slate-800 rounded-lg overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-left text-xs">
                <thead>
                  <tr className="bg-slate-950 border-b border-slate-800 text-[10px] uppercase font-bold text-slate-500 tracking-wider font-mono">
                    <th className="px-4 py-3">Host ID</th>
                    <th className="px-4 py-3">Connection Type</th>
                    <th className="px-4 py-3">Target Endpoint</th>
                    <th className="px-4 py-3">Friendly Name</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3">Latency</th>
                    <th className="px-4 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-850 text-slate-300 font-mono text-[11px]">
                  {hostsQuery.data?.map((hst) => (
                    <tr
                      key={hst.id}
                      onClick={() => setSelectedHostId(hst.id)}
                      className={`hover:bg-slate-800/40 cursor-pointer transition ${
                        selectedHostId === hst.id ? 'bg-blue-500/5' : ''
                      }`}
                    >
                      <td className="px-4 py-3.5 font-bold text-white">{hst.id}</td>
                      <td className="px-4 py-3.5 uppercase">{hst.connectionType}</td>
                      <td className="px-4 py-3.5 text-slate-400">{hst.hostname}:{hst.port}</td>
                      <td className="px-4 py-3.5 text-slate-200">{hst.displayName}</td>
                      <td className="px-4 py-3.5">
                        <span className={`inline-flex px-1.5 py-0.5 rounded text-[10px] font-bold uppercase ${
                          hst.status === 'online' ? 'bg-emerald-950 text-emerald-450' : 'bg-red-950 text-red-450'
                        }`}>
                          {hst.status}
                        </span>
                      </td>
                      <td className="px-4 py-3.5">{hst.latency} ms</td>
                      <td className="px-4 py-3.5 text-right space-x-1" onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={() => handleTestConnection(hst.id)}
                          className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded text-[10px] font-bold"
                          title="Test Connection"
                        >
                          Test
                        </button>
                        <button
                          onClick={() => handleSync(hst.id)}
                          className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded text-[10px] font-bold"
                          title="Sync metadata"
                        >
                          Sync
                        </button>
                        {hst.status === 'online' ? (
                          <button
                            onClick={() => handleDisconnect(hst.id)}
                            className="px-2 py-1 bg-red-950 hover:bg-red-900 text-red-400 rounded text-[10px] font-bold"
                            title="Disconnect Host"
                          >
                            Disconnect
                          </button>
                        ) : (
                          <button
                            onClick={() => handleConnect(hst.id)}
                            className="px-2 py-1 bg-emerald-950 hover:bg-emerald-900 text-emerald-400 rounded text-[10px] font-bold"
                            title="Connect Host"
                          >
                            Connect
                          </button>
                        )}
                        <button
                          onClick={() => mutations.deleteHost(hst.id)}
                          className="p-1 hover:bg-slate-800 rounded text-slate-405 hover:text-red-500 transition inline-block align-middle"
                          title="Delete Host"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {selectedHostId && selectedHost && (
            <div className="bg-slate-900 border border-slate-850 rounded-lg p-6 space-y-4 shadow-lg text-xs text-slate-350">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider border-b border-slate-850 pb-2">
                Host Telemetry Inspector
              </h3>
              <p><span className="text-slate-500 font-bold block mb-1">Description:</span>{selectedHost.description}</p>
              <div className="grid grid-cols-2 gap-4 text-xs font-mono bg-slate-950 p-4 rounded border border-slate-850">
                <div><span className="text-slate-500 font-bold block">IP Address:</span>{selectedHost.ipAddress}</div>
                <div><span className="text-slate-500 font-bold block">Connection Type:</span><span className="uppercase">{selectedHost.connectionType}</span></div>
                <div><span className="text-slate-500 font-bold block">CPU Cores:</span>{selectedHost.cpuCount} vCPUs</div>
                <div><span className="text-slate-500 font-bold block">Total RAM:</span>{selectedHost.memory} MB</div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* OPERATIONS HISTORY TAB VIEW */}
      {activeTab === 'history' && (
        <div className="bg-slate-900 border border-slate-800 rounded-lg overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left text-xs">
              <thead>
                <tr className="bg-slate-950 border-b border-slate-800 text-[10px] uppercase font-bold text-slate-500 tracking-wider font-mono">
                  <th className="px-4 py-3">Timestamp</th>
                  <th className="px-4 py-3">Action</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Details / Errors</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-850 text-slate-300 font-mono text-[11px]">
                {operationsQuery.data?.map((op) => (
                  <tr key={op.operationId} className="hover:bg-slate-800/40 transition">
                    <td className="px-4 py-3 text-slate-500">
                      {new Date(op.timestamp).toLocaleTimeString()}
                    </td>
                    <td className="px-4 py-3 text-slate-200 font-semibold">{op.action}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex px-1.5 py-0.5 rounded text-[10px] font-bold uppercase ${
                        op.status === 'success' ? 'bg-emerald-950 text-emerald-450' :
                        op.status === 'failed' ? 'bg-red-950 text-red-450' : 'bg-slate-800 text-slate-400'
                      }`}>
                        {op.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-355 truncate max-w-md">
                      {op.error ? <span className="text-red-400 font-semibold">{op.error}</span> : op.logs[op.logs.length - 1]}
                    </td>
                  </tr>
                ))}
                {(operationsQuery.data?.length || 0) === 0 && (
                  <tr>
                    <td colSpan={4} className="p-4 text-center text-slate-655 italic">No host operations recorded</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* CREATE HOST MODAL */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <form onSubmit={handleHostSubmit} className="bg-slate-900 border border-slate-800 rounded-lg max-w-md w-full p-6 space-y-4 shadow-xl">
            <div className="flex justify-between items-center border-b border-slate-850 pb-3">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">Add Remote Docker Host</h3>
              <button type="button" onClick={() => setCreateModalOpen(false)} className="text-slate-500 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="space-y-3.5 text-xs text-slate-300">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-slate-455 block font-semibold">Host ID Name:</label>
                  <input
                    type="text"
                    placeholder="e.g. prod-aws-01"
                    value={hostForm.name}
                    onChange={(e) => setHostForm(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full bg-slate-950 border border-slate-850 px-3 py-1.5 rounded text-slate-300 focus:outline-none"
                    required
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-slate-455 block font-semibold">Display Name:</label>
                  <input
                    type="text"
                    placeholder="e.g. AWS Production VM"
                    value={hostForm.displayName}
                    onChange={(e) => setHostForm(prev => ({ ...prev, displayName: e.target.value }))}
                    className="w-full bg-slate-950 border border-slate-850 px-3 py-1.5 rounded text-slate-300 focus:outline-none"
                    required
                  />
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-slate-455 block font-semibold">Description:</label>
                <textarea
                  placeholder="Summarize host deployment details..."
                  value={hostForm.description}
                  onChange={(e) => setHostForm(prev => ({ ...prev, description: e.target.value }))}
                  className="w-full bg-slate-950 border border-slate-850 px-3 py-1.5 rounded text-slate-300 focus:outline-none h-16 resize-none"
                />
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div className="col-span-2 space-y-1">
                  <label className="text-slate-455 block font-semibold">IP Address / Domain:</label>
                  <input
                    type="text"
                    placeholder="e.g. 54.12.32.145"
                    value={hostForm.ipAddress}
                    onChange={(e) => setHostForm(prev => ({ ...prev, ipAddress: e.target.value, hostname: e.target.value }))}
                    className="w-full bg-slate-950 border border-slate-850 px-3 py-1.5 rounded text-slate-300 focus:outline-none font-mono"
                    required
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-slate-455 block font-semibold">Port:</label>
                  <input
                    type="number"
                    value={hostForm.port}
                    onChange={(e) => setHostForm(prev => ({ ...prev, port: parseInt(e.target.value) || 2375 }))}
                    className="w-full bg-slate-950 border border-slate-850 px-3 py-1.5 rounded text-slate-300 focus:outline-none font-mono"
                    required
                  />
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-slate-455 block font-semibold">Connection Type:</label>
                <select
                  value={hostForm.connectionType}
                  onChange={(e) => setHostForm(prev => ({ ...prev, connectionType: e.target.value as any }))}
                  className="w-full bg-slate-950 border border-slate-850 px-3 py-1.5 rounded text-slate-300 focus:outline-none font-mono"
                >
                  <option value="socket">Local Docker Socket</option>
                  <option value="tcp">TCP Engine Protocol</option>
                  <option value="tls">TLS Secured Docker Socket</option>
                  <option value="ssh">SSH Tunnel Namespace</option>
                </select>
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-2 border-t border-slate-850 mt-4">
              <button
                type="button"
                onClick={() => setCreateModalOpen(false)}
                className="px-3.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded text-xs font-semibold transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded text-xs font-semibold shadow-md shadow-blue-500/20 transition"
              >
                Save Remote Host
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}

export default HostDashboard;
