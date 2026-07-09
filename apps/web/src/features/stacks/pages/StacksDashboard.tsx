import React, { useState } from 'react';
import {
  Layers,
  Database,
  Network,
  HardDrive,
  KeyRound,
  FileCode2,
  Search,
  Plus,
  Trash2,
  Sliders,
  Info,
  X,
  AlertTriangle,
  RefreshCcw,
  CheckCircle2,
  Upload
} from 'lucide-react';
import {
  useStacksDashboard,
  useStacks,
  useStackDetails,
  useStackOperations,
  useStackOperation,
  useStackMutations
} from '../hooks/useStacks';
import { useStackStore } from '../store/stackStore';

export function StacksDashboard() {
  const {
    activeTab,
    selectedStackName,
    activeOperationId,
    isDeployModalOpen,
    isScaleModalOpen,
    scaleServiceId,
    scaleServiceName,
    scaleCurrentReplicas,
    setActiveTab,
    setSelectedStackName,
    setActiveOperationId,
    setDeployModalOpen,
    setScaleModalOpen,
    setScaleDetails
  } = useStackStore();

  const dashboardQuery = useStacksDashboard();
  const swarmActive = !!dashboardQuery.data?.swarmActive;

  const stacksQuery = useStacks(swarmActive);
  const operationsQuery = useStackOperations();
  const activeOpQuery = useStackOperation(activeOperationId || '');

  const mutations = useStackMutations();

  // Search/Filters
  const [searchTerm, setSearchTerm] = useState('');

  // Selected stack detail query
  const stackDetailQuery = useStackDetails(selectedStackName || '');

  // Form states
  const [deployForm, setDeployForm] = useState({
    name: '',
    content: ''
  });
  const [scaleTargetReplicas, setScaleTargetReplicas] = useState(1);

  // Confirms
  const [pendingDelete, setPendingDelete] = useState<string | null>(null);

  const handleDeploySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!deployForm.name || !deployForm.content) {
      alert('Stack name and Compose content are required');
      return;
    }
    try {
      const res = await mutations.deployStack({
        name: deployForm.name.trim(),
        content: deployForm.content
      });
      setActiveOperationId(res.operationId);
      setDeployModalOpen(false);
      setDeployForm({ name: '', content: '' });
    } catch (err: any) {
      alert(err.message || 'Stack deployment failed');
    }
  };

  const handleScaleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!scaleServiceId) return;
    try {
      const res = await mutations.scaleStackService({
        serviceId: scaleServiceId,
        replicas: scaleTargetReplicas
      });
      setActiveOperationId(res.operationId);
      setScaleModalOpen(false);
    } catch (err: any) {
      alert(err.message || 'Scale request failed');
    }
  };

  const handleDeleteConfirm = async () => {
    if (!pendingDelete) return;
    try {
      const res = await mutations.removeStack(pendingDelete);
      setActiveOperationId(res.operationId);
      setPendingDelete(null);
      setSelectedStackName(null);
    } catch (err: any) {
      alert(err.message || 'Deletion failed');
    }
  };

  const triggerRefresh = () => {
    dashboardQuery.refetch();
    if (swarmActive) {
      stacksQuery.refetch();
    }
    operationsQuery.refetch();
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result as string;
      setDeployForm(prev => ({ ...prev, content: result, name: file.name.replace(/\.[^/.]+$/, '').replace(/[^a-zA-Z0-9_.-]/g, '_') }));
    };
    reader.readAsText(file);
  };

  return (
    <div className="space-y-6">
      {/* Title Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-800 pb-4">
        <div>
          <h1 className="text-xl font-bold flex items-center gap-2 text-white">
            <Layers className="w-6 h-6 text-blue-500" />
            Docker Swarm Stack Manager
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Deploy, inspect, and scale complete production Docker applications from compose configurations.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={triggerRefresh}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 border border-slate-800 hover:bg-slate-800 rounded text-xs text-slate-300 font-medium transition"
          >
            <RefreshCcw className="w-3.5 h-3.5" />
            Refresh
          </button>
          {swarmActive && (
            <button
              onClick={() => setDeployModalOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded text-xs font-semibold shadow-md shadow-blue-500/20 transition"
            >
              <Plus className="w-3.5 h-3.5" />
              Deploy Stack
            </button>
          )}
        </div>
      </div>

      {/* Swarm Status Warning Banner */}
      {!swarmActive && (
        <div className="bg-slate-900 border border-yellow-500/30 rounded-lg p-5 flex items-start gap-4 shadow-lg">
          <div className="p-2 bg-yellow-500/10 rounded-lg text-yellow-500 shrink-0">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-yellow-500 uppercase tracking-wider">Docker Swarm Required</h3>
            <p className="text-xs text-slate-400 mt-1 max-w-2xl leading-relaxed">
              Docker Stacks require Swarm Mode execution. Enable Swarm under the Swarm Manager tab before deploying stacks.
            </p>
          </div>
        </div>
      )}

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
          <div className="mt-2.5 max-h-24 overflow-y-auto bg-slate-950 p-2 rounded text-[10px] font-mono text-slate-450 space-y-1">
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

      {swarmActive && (
        <div className="space-y-6">
          {/* Summary Dashboard Grid */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-slate-900 border border-slate-800 p-5 rounded-lg flex items-center justify-between shadow-sm">
              <div>
                <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Total Stacks</span>
                <h3 className="text-xl font-extrabold mt-1 text-white">{dashboardQuery.data?.totalStacks || 0}</h3>
              </div>
              <div className="p-3 bg-blue-500/10 text-blue-400 rounded-lg"><Layers className="w-5 h-5" /></div>
            </div>

            <div className="bg-slate-900 border border-slate-800 p-5 rounded-lg flex items-center justify-between shadow-sm">
              <div>
                <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Running Stacks</span>
                <h3 className="text-xl font-extrabold mt-1 text-emerald-500">{dashboardQuery.data?.runningStacks || 0}</h3>
              </div>
              <div className="p-3 bg-emerald-500/10 text-emerald-500 rounded-lg"><CheckCircle2 className="w-5 h-5" /></div>
            </div>

            <div className="bg-slate-900 border border-slate-800 p-5 rounded-lg flex items-center justify-between shadow-sm">
              <div>
                <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Failed Stacks</span>
                <h3 className="text-xl font-extrabold mt-1 text-red-500">{dashboardQuery.data?.failedStacks || 0}</h3>
              </div>
              <div className="p-3 bg-red-500/10 text-red-500 rounded-lg"><AlertTriangle className="w-5 h-5" /></div>
            </div>

            <div className="bg-slate-900 border border-slate-800 p-5 rounded-lg flex items-center justify-between shadow-sm">
              <div>
                <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Total Services</span>
                <h3 className="text-xl font-extrabold mt-1 text-white">{dashboardQuery.data?.totalServices || 0}</h3>
              </div>
              <div className="p-3 bg-purple-500/10 text-purple-400 rounded-lg"><Database className="w-5 h-5" /></div>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="flex border-b border-slate-800 gap-1">
            <button
              onClick={() => { setActiveTab('stacks'); setSelectedStackName(null); }}
              className={`px-4 py-2 text-xs font-semibold border-b-2 transition ${
                activeTab === 'stacks' ? 'border-blue-500 text-blue-400 bg-blue-500/5' : 'border-transparent text-slate-400 hover:text-slate-350'
              }`}
            >
              Swarm Stacks ({stacksQuery.data?.length || 0})
            </button>
            <button
              onClick={() => { setActiveTab('history'); setSelectedStackName(null); }}
              className={`px-4 py-2 text-xs font-semibold border-b-2 transition ${
                activeTab === 'history' ? 'border-blue-500 text-blue-400 bg-blue-500/5' : 'border-transparent text-slate-400 hover:text-slate-350'
              }`}
            >
              Operations Logs
            </button>
          </div>

          {/* Filter Search Bar */}
          {activeTab !== 'history' && (
            <div className="flex justify-between items-center bg-slate-900 border border-slate-800 p-4 rounded-lg">
              <div className="flex items-center gap-2 w-full sm:max-w-xs bg-slate-950 border border-slate-800 px-3 py-1.5 rounded">
                <Search className="w-4 h-4 text-slate-500 shrink-0" />
                <input
                  type="text"
                  placeholder="Search stacks by name..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full bg-transparent text-xs text-slate-300 placeholder-slate-650 focus:outline-none"
                />
              </div>
            </div>
          )}

          {/* TABLE VIEWS */}
          {activeTab === 'stacks' && (
            <div className="space-y-6">
              <div className="bg-slate-900 border border-slate-800 rounded-lg overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse text-left text-xs">
                    <thead>
                      <tr className="bg-slate-950 border-b border-slate-800 text-[10px] uppercase font-bold text-slate-500 tracking-wider font-mono">
                        <th className="px-4 py-3">Stack Name</th>
                        <th className="px-4 py-3">Services Count</th>
                        <th className="px-4 py-3">Tasks Count</th>
                        <th className="px-4 py-3">Deployment Status</th>
                        <th className="px-4 py-3">Created</th>
                        <th className="px-4 py-3 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-850 text-slate-300">
                      {stacksQuery.data
                        ?.filter(s => s.name.toLowerCase().includes(searchTerm.toLowerCase()))
                        .map((stack) => (
                          <tr
                            key={stack.name}
                            onClick={() => setSelectedStackName(stack.name)}
                            className={`hover:bg-slate-800/40 cursor-pointer transition ${
                              selectedStackName === stack.name ? 'bg-blue-500/5' : ''
                            }`}
                          >
                            <td className="px-4 py-3.5 font-bold text-white">{stack.name}</td>
                            <td className="px-4 py-3.5 font-mono text-[11px] text-slate-400">{stack.servicesCount}</td>
                            <td className="px-4 py-3.5 font-mono text-[11px] text-slate-400">{stack.tasksCount}</td>
                            <td className="px-4 py-3.5">
                              <span className={`inline-flex px-2 py-0.5 rounded text-[10px] font-semibold uppercase ${
                                stack.status === 'running' ? 'bg-emerald-950 text-emerald-450' :
                                stack.status === 'degraded' ? 'bg-yellow-950 text-yellow-450' :
                                'bg-red-950 text-red-450'
                              }`}>
                                {stack.status}
                              </span>
                            </td>
                            <td className="px-4 py-3.5 font-mono text-[11px] text-slate-400">
                              {new Date(stack.createdAt).toLocaleDateString()}
                            </td>
                            <td className="px-4 py-3.5 text-right" onClick={(e) => e.stopPropagation()}>
                              <button
                                onClick={() => setPendingDelete(stack.name)}
                                className="p-1 hover:bg-slate-800 rounded text-slate-400 hover:text-red-500 transition"
                                title="Remove Stack"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Stack Details Drawer */}
              {selectedStackName && stackDetailQuery.data && (
                <div className="bg-slate-900 border border-slate-800 rounded-lg p-6 space-y-5 shadow-lg text-xs leading-relaxed text-slate-300">
                  <div className="flex justify-between items-center border-b border-slate-850 pb-3">
                    <div>
                      <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                        <Info className="w-4 h-4 text-blue-500" />
                        Stack Details: {selectedStackName}
                      </h3>
                      <span className="text-[10px] text-slate-550 font-mono block mt-0.5">Deployment Namespace</span>
                    </div>
                    <button onClick={() => setSelectedStackName(null)} className="text-slate-500 hover:text-white">
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Services scaling details */}
                  <div className="space-y-3">
                    <h4 className="font-bold text-[10px] text-slate-550 uppercase tracking-wider">Topology Services</h4>
                    <div className="bg-slate-950 border border-slate-850 rounded overflow-hidden">
                      <table className="w-full text-left border-collapse text-[11px] font-mono">
                        <thead>
                          <tr className="bg-slate-900 border-b border-slate-850 text-slate-500 font-bold uppercase p-2">
                            <th className="p-2">Name</th>
                            <th className="p-2">Image</th>
                            <th className="p-2">Replicas</th>
                            <th className="p-2 text-right">Scale</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-900 text-slate-400">
                          {stackDetailQuery.data.services.map((svc) => (
                            <tr key={svc.id} className="hover:bg-slate-900/60">
                              <td className="p-2 text-white font-bold">{svc.name.replace(`${selectedStackName}_`, '')}</td>
                              <td className="p-2 truncate max-w-xs">{svc.image}</td>
                              <td className="p-2">{svc.replicas.running} / {svc.replicas.desired}</td>
                              <td className="p-2 text-right">
                                <button
                                  onClick={() => {
                                    setScaleDetails({ id: svc.id, name: svc.name, current: svc.replicas.desired });
                                    setScaleTargetReplicas(svc.replicas.desired);
                                    setScaleModalOpen(true);
                                  }}
                                  className="p-1 hover:bg-slate-800 rounded text-blue-400 hover:text-blue-300 transition"
                                >
                                  <Sliders className="w-3.5 h-3.5" />
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Infrastructure Attachments */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <h4 className="font-bold text-[10px] text-slate-550 uppercase tracking-wider flex items-center gap-1">
                        <Network className="w-3.5 h-3.5 text-slate-500" /> Networks
                      </h4>
                      <ul className="space-y-1 font-mono text-[11px] text-slate-400">
                        {stackDetailQuery.data.networks.map((net) => (
                          <li key={net.id}>{net.name} ({net.driver})</li>
                        ))}
                        {stackDetailQuery.data.networks.length === 0 && <li className="italic text-slate-600">None</li>}
                      </ul>
                    </div>

                    <div className="space-y-2">
                      <h4 className="font-bold text-[10px] text-slate-550 uppercase tracking-wider flex items-center gap-1">
                        <HardDrive className="w-3.5 h-3.5 text-slate-500" /> Volumes
                      </h4>
                      <ul className="space-y-1 font-mono text-[11px] text-slate-400">
                        {stackDetailQuery.data.volumes.map((vol) => (
                          <li key={vol.name}>{vol.name}</li>
                        ))}
                        {stackDetailQuery.data.volumes.length === 0 && <li className="italic text-slate-600">None</li>}
                      </ul>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <h4 className="font-bold text-[10px] text-slate-550 uppercase tracking-wider flex items-center gap-1">
                        <KeyRound className="w-3.5 h-3.5 text-slate-500" /> Secrets
                      </h4>
                      <ul className="space-y-1 font-mono text-[11px] text-slate-400">
                        {stackDetailQuery.data.secrets.map((sec) => (
                          <li key={sec}>{sec}</li>
                        ))}
                        {stackDetailQuery.data.secrets.length === 0 && <li className="italic text-slate-600">None</li>}
                      </ul>
                    </div>

                    <div className="space-y-2">
                      <h4 className="font-bold text-[10px] text-slate-550 uppercase tracking-wider flex items-center gap-1">
                        <FileCode2 className="w-3.5 h-3.5 text-slate-500" /> Configs
                      </h4>
                      <ul className="space-y-1 font-mono text-[11px] text-slate-400">
                        {stackDetailQuery.data.configs.map((cfg) => (
                          <li key={cfg}>{cfg}</li>
                        ))}
                        {stackDetailQuery.data.configs.length === 0 && <li className="italic text-slate-600">None</li>}
                      </ul>
                    </div>
                  </div>

                  {/* Compose Source Content */}
                  <div className="space-y-2">
                    <h4 className="font-bold text-[10px] text-slate-550 uppercase tracking-wider">Compose Configuration Source</h4>
                    <pre className="bg-slate-950 border border-slate-850 p-4 rounded text-[10px] font-mono text-slate-400 overflow-x-auto max-h-48">
                      {stackDetailQuery.data.composeSource}
                    </pre>
                  </div>
                </div>
              )}
            </div>
          )}

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
                            op.status === 'success' ? 'bg-emerald-950 text-emerald-400' :
                            op.status === 'failed' ? 'bg-red-950 text-red-400' : 'bg-slate-800 text-slate-400'
                          }`}>
                            {op.status}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-slate-350 truncate max-w-md">
                          {op.error ? <span className="text-red-400 font-semibold">{op.error}</span> : op.logs[op.logs.length - 1]}
                        </td>
                      </tr>
                    ))}
                    {(operationsQuery.data?.length || 0) === 0 && (
                      <tr>
                        <td colSpan={4} className="p-4 text-center text-slate-650 italic">No operations recorded in this session</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* CONFIRMATION DELETION MODAL */}
      {pendingDelete && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-lg max-w-md w-full p-6 space-y-4 shadow-xl">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
              <AlertTriangle className="w-5 h-5 text-yellow-500" />
              Confirm Stack Removal
            </h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              Are you sure you want to remove stack namespace <strong>{pendingDelete}</strong>? This will remove all associated services, configs, secrets, and overlay networks.
            </p>
            <div className="flex justify-end gap-2 pt-2 border-t border-slate-850">
              <button
                onClick={() => setPendingDelete(null)}
                className="px-3.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded text-xs font-semibold transition"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteConfirm}
                className="px-3.5 py-1.5 bg-red-650 hover:bg-red-600 text-white rounded text-xs font-semibold shadow-md shadow-red-500/20 transition"
              >
                Confirm Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* DEPLOY STACK MODAL */}
      {isDeployModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <form onSubmit={handleDeploySubmit} className="bg-slate-900 border border-slate-800 rounded-lg max-w-lg w-full p-6 space-y-4 shadow-xl">
            <div className="flex justify-between items-center border-b border-slate-850 pb-3">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">Deploy Swarm Stack</h3>
              <button type="button" onClick={() => setDeployModalOpen(false)} className="text-slate-500 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="space-y-3.5 text-xs">
              <div className="space-y-1">
                <label className="text-slate-455 block font-semibold">Stack Namespace Name:</label>
                <input
                  type="text"
                  placeholder="e.g. production_web"
                  value={deployForm.name}
                  onChange={(e) => setDeployForm(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full bg-slate-950 border border-slate-850 px-3 py-1.5 rounded text-slate-300 focus:outline-none font-mono"
                  required
                />
              </div>
              <div className="space-y-1">
                <label className="text-slate-455 block font-semibold">Docker Compose Configuration YAML:</label>
                <textarea
                  placeholder="version: '3.8'&#10;services:&#10;  web:&#10;    image: nginx:alpine&#10;    ports:&#10;      - '80:80'"
                  value={deployForm.content}
                  onChange={(e) => setDeployForm(prev => ({ ...prev, content: e.target.value }))}
                  className="w-full h-44 bg-slate-950 border border-slate-850 px-3 py-1.5 rounded text-slate-350 font-mono text-[10px] focus:outline-none"
                  required
                />
              </div>
              <div className="border border-dashed border-slate-850 p-4 rounded flex flex-col items-center justify-center gap-2 hover:bg-slate-950 transition relative">
                <Upload className="w-5 h-5 text-slate-500" />
                <span className="text-[10px] text-slate-500">Drag or click to upload YAML compose file</span>
                <input
                  type="file"
                  onChange={handleFileUpload}
                  className="absolute inset-0 opacity-0 cursor-pointer"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-2 border-t border-slate-850 mt-4">
              <button
                type="button"
                onClick={() => setDeployModalOpen(false)}
                className="px-3.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded text-xs font-semibold transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded text-xs font-semibold shadow-md shadow-blue-500/20 transition"
              >
                Deploy Stack
              </button>
            </div>
          </form>
        </div>
      )}

      {/* SCALE SERVICE MODAL */}
      {isScaleModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <form onSubmit={handleScaleSubmit} className="bg-slate-900 border border-slate-800 rounded-lg max-w-sm w-full p-6 space-y-4 shadow-xl">
            <div className="flex justify-between items-center border-b border-slate-850 pb-3">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">Scale Swarm Service</h3>
              <button type="button" onClick={() => setScaleModalOpen(false)} className="text-slate-500 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>
            <p className="text-xs text-slate-400">
              Scale service <strong>{scaleServiceName?.replace(`${selectedStackName}_`, '')}</strong> replicas. Current replica count: <span className="font-semibold text-slate-200">{scaleCurrentReplicas}</span>.
            </p>
            <div className="space-y-1 text-xs">
              <label className="text-slate-455 block font-semibold">Target Replica Count:</label>
              <input
                type="number"
                value={scaleTargetReplicas}
                onChange={(e) => setScaleTargetReplicas(parseInt(e.target.value) || 1)}
                min="0"
                className="w-full bg-slate-950 border border-slate-850 px-3 py-1.5 rounded text-slate-300 focus:outline-none font-mono"
                required
              />
            </div>
            <div className="flex justify-end gap-2 pt-2 border-t border-slate-850 mt-4">
              <button
                type="button"
                onClick={() => setScaleModalOpen(false)}
                className="px-3.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded text-xs font-semibold transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded text-xs font-semibold shadow-md shadow-blue-500/20 transition"
              >
                Scale Service
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}

export default StacksDashboard;
