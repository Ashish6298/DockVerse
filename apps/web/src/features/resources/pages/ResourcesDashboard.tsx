import React, { useState } from 'react';
import {
  KeyRound,
  FileCode2,
  Layers,
  Search,
  Plus,
  Trash2,
  Info,
  X,
  AlertTriangle,
  RefreshCcw,
  CheckCircle2,
  Upload,
  Clock,
  Code
} from 'lucide-react';
import {
  useResourcesDashboard,
  useSecrets,
  useSecretUsage,
  useConfigs,
  useConfigUsage,
  useResourceOperations,
  useResourceOperation,
  useResourceMutations
} from '../hooks/useResources';
import { useResourceStore } from '../store/resourceStore';

export function ResourcesDashboard() {
  const {
    activeTab,
    selectedSecretId,
    selectedConfigId,
    activeOperationId,
    isCreateSecretModalOpen,
    isCreateConfigModalOpen,
    setActiveTab,
    setSelectedSecretId,
    setSelectedConfigId,
    setActiveOperationId,
    setCreateSecretModalOpen,
    setCreateConfigModalOpen
  } = useResourceStore();

  const dashboardQuery = useResourcesDashboard();
  const swarmActive = !!dashboardQuery.data?.swarmActive;

  const secretsQuery = useSecrets(swarmActive);
  const configsQuery = useConfigs(swarmActive);
  const operationsQuery = useResourceOperations();
  const activeOpQuery = useResourceOperation(activeOperationId || '');

  const mutations = useResourceMutations();

  // Search/Filters
  const [searchTerm, setSearchTerm] = useState('');

  // Selected resource usages
  const secretUsageQuery = useSecretUsage(selectedSecretId || '');
  const configUsageQuery = useConfigUsage(selectedConfigId || '');

  // Form states
  const [secretForm, setSecretForm] = useState({
    name: '',
    data: '',
    isBase64: false
  });
  const [configForm, setConfigForm] = useState({
    name: '',
    data: ''
  });

  // Confirms
  const [pendingDelete, setPendingDelete] = useState<{
    id: string;
    name: string;
    type: 'secret' | 'config';
  } | null>(null);
  const [forceDelete, setForceDelete] = useState(false);

  const handleSecretSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await mutations.createSecret({
        name: secretForm.name.trim(),
        data: secretForm.data,
        isBase64: secretForm.isBase64
      });
      setActiveOperationId(res.operationId);
      setCreateSecretModalOpen(false);
      setSecretForm({ name: '', data: '', isBase64: false });
    } catch (err: any) {
      alert(err.message || 'Secret creation request failed');
    }
  };

  const handleConfigSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await mutations.createConfig({
        name: configForm.name.trim(),
        data: configForm.data
      });
      setActiveOperationId(res.operationId);
      setCreateConfigModalOpen(false);
      setConfigForm({ name: '', data: '' });
    } catch (err: any) {
      alert(err.message || 'Config creation request failed');
    }
  };

  const handleDeleteConfirm = async () => {
    if (!pendingDelete) return;
    const { id, type } = pendingDelete;
    try {
      let res;
      if (type === 'secret') {
        res = await mutations.removeSecret({ id, force: forceDelete });
      } else {
        res = await mutations.removeConfig({ id, force: forceDelete });
      }
      setActiveOperationId(res.operationId);
      setPendingDelete(null);
      setForceDelete(false);
    } catch (err: any) {
      alert(err.message || 'Deletion failed');
    }
  };

  const triggerRefresh = () => {
    dashboardQuery.refetch();
    if (swarmActive) {
      secretsQuery.refetch();
      configsQuery.refetch();
    }
    operationsQuery.refetch();
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>, type: 'secret' | 'config') => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result as string;
      if (type === 'secret') {
        setSecretForm(prev => ({ ...prev, data: result, name: file.name.replace(/[^a-zA-Z0-9_.-]/g, '_') }));
      } else {
        setConfigForm(prev => ({ ...prev, data: result, name: file.name.replace(/[^a-zA-Z0-9_.-]/g, '_') }));
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="space-y-6">
      {/* Title Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-800 pb-4">
        <div>
          <h1 className="text-xl font-bold flex items-center gap-2 text-white">
            <KeyRound className="w-6 h-6 text-blue-500" />
            Docker Secrets & Configs Manager
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Store, monitor, and assign secure secrets and parameters to Docker Swarm orchestration services.
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
            <div className="flex gap-2">
              <button
                onClick={() => setCreateSecretModalOpen(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded text-xs font-semibold shadow-md shadow-blue-500/20 transition"
              >
                <Plus className="w-3.5 h-3.5" />
                Add Secret
              </button>
              <button
                onClick={() => setCreateConfigModalOpen(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded text-xs font-semibold transition"
              >
                <Plus className="w-3.5 h-3.5" />
                Add Config
              </button>
            </div>
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
              Docker Secrets and Docker Configs require an active Docker Swarm cluster. Enable Swarm under the Swarm Manager tab before performing resource creations.
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
                <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Total Secrets</span>
                <h3 className="text-xl font-extrabold mt-1 text-white">{dashboardQuery.data?.totalSecrets || 0}</h3>
              </div>
              <div className="p-3 bg-blue-500/10 text-blue-400 rounded-lg"><KeyRound className="w-5 h-5" /></div>
            </div>

            <div className="bg-slate-900 border border-slate-800 p-5 rounded-lg flex items-center justify-between shadow-sm">
              <div>
                <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Total Configs</span>
                <h3 className="text-xl font-extrabold mt-1 text-white">{dashboardQuery.data?.totalConfigs || 0}</h3>
              </div>
              <div className="p-3 bg-indigo-500/10 text-indigo-400 rounded-lg"><FileCode2 className="w-5 h-5" /></div>
            </div>

            <div className="bg-slate-900 border border-slate-800 p-5 rounded-lg flex items-center justify-between shadow-sm">
              <div>
                <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Attached Resources</span>
                <h3 className="text-xl font-extrabold mt-1 text-white">
                  {(dashboardQuery.data?.attachedSecrets || 0) + (dashboardQuery.data?.attachedConfigs || 0)}
                </h3>
              </div>
              <div className="p-3 bg-purple-500/10 text-purple-400 rounded-lg"><Layers className="w-5 h-5" /></div>
            </div>

            <div className="bg-slate-900 border border-slate-800 p-5 rounded-lg flex items-center justify-between shadow-sm">
              <div>
                <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Unused Resources</span>
                <h3 className="text-xl font-extrabold mt-1 text-white">
                  {(dashboardQuery.data?.unusedSecrets || 0) + (dashboardQuery.data?.unusedConfigs || 0)}
                </h3>
              </div>
              <div className="p-3 bg-emerald-500/10 text-emerald-450 rounded-lg"><CheckCircle2 className="w-5 h-5" /></div>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="flex border-b border-slate-800 gap-1">
            <button
              onClick={() => { setActiveTab('secrets'); setSelectedSecretId(null); setSelectedConfigId(null); }}
              className={`px-4 py-2 text-xs font-semibold border-b-2 transition ${
                activeTab === 'secrets' ? 'border-blue-500 text-blue-400 bg-blue-500/5' : 'border-transparent text-slate-400 hover:text-slate-350'
              }`}
            >
              Swarm Secrets ({secretsQuery.data?.length || 0})
            </button>
            <button
              onClick={() => { setActiveTab('configs'); setSelectedSecretId(null); setSelectedConfigId(null); }}
              className={`px-4 py-2 text-xs font-semibold border-b-2 transition ${
                activeTab === 'configs' ? 'border-blue-500 text-blue-400 bg-blue-500/5' : 'border-transparent text-slate-400 hover:text-slate-350'
              }`}
            >
              Swarm Configs ({configsQuery.data?.length || 0})
            </button>
            <button
              onClick={() => { setActiveTab('history'); setSelectedSecretId(null); setSelectedConfigId(null); }}
              className={`px-4 py-2 text-xs font-semibold border-b-2 transition ${
                activeTab === 'history' ? 'border-blue-500 text-blue-400 bg-blue-500/5' : 'border-transparent text-slate-400 hover:text-slate-350'
              }`}
            >
              Operations Logs
            </button>
          </div>

          {/* Tab Filter Search Bar */}
          {activeTab !== 'history' && (
            <div className="flex justify-between items-center bg-slate-900 border border-slate-800 p-4 rounded-lg">
              <div className="flex items-center gap-2 w-full sm:max-w-xs bg-slate-950 border border-slate-800 px-3 py-1.5 rounded">
                <Search className="w-4 h-4 text-slate-500 shrink-0" />
                <input
                  type="text"
                  placeholder="Search resources by name..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full bg-transparent text-xs text-slate-300 placeholder-slate-650 focus:outline-none"
                />
              </div>
            </div>
          )}

          {/* TABLE VIEWS */}
          {activeTab === 'secrets' && (
            <div className="space-y-6">
              <div className="bg-slate-900 border border-slate-800 rounded-lg overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse text-left text-xs">
                    <thead>
                      <tr className="bg-slate-950 border-b border-slate-800 text-[10px] uppercase font-bold text-slate-500 tracking-wider font-mono">
                        <th className="px-4 py-3">Secret Name</th>
                        <th className="px-4 py-3">ID</th>
                        <th className="px-4 py-3">Created</th>
                        <th className="px-4 py-3">Updated</th>
                        <th className="px-4 py-3 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-850 text-slate-300">
                      {secretsQuery.data
                        ?.filter(s => s.spec.name.toLowerCase().includes(searchTerm.toLowerCase()))
                        .map((sec) => (
                          <tr
                            key={sec.id}
                            onClick={() => setSelectedSecretId(sec.id)}
                            className={`hover:bg-slate-800/40 cursor-pointer transition ${
                              selectedSecretId === sec.id ? 'bg-blue-500/5' : ''
                            }`}
                          >
                            <td className="px-4 py-3.5 font-bold text-white">{sec.spec.name}</td>
                            <td className="px-4 py-3.5 font-mono text-[11px] text-slate-450">{sec.id.slice(0, 16)}</td>
                            <td className="px-4 py-3.5 font-mono text-[11px] text-slate-400">
                              {new Date(sec.createdAt).toLocaleDateString()}
                            </td>
                            <td className="px-4 py-3.5 font-mono text-[11px] text-slate-400">
                              {new Date(sec.updatedAt).toLocaleDateString()}
                            </td>
                            <td className="px-4 py-3.5 text-right" onClick={(e) => e.stopPropagation()}>
                              <button
                                onClick={() => setPendingDelete({ id: sec.id, name: sec.spec.name, type: 'secret' })}
                                className="p-1 hover:bg-slate-800 rounded text-slate-400 hover:text-red-500 transition"
                                title="Delete Secret"
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

              {/* Secrets Details Drawer */}
              {selectedSecretId && secretUsageQuery.data && (
                <div className="bg-slate-900 border border-slate-800 rounded-lg p-6 space-y-4 shadow-lg">
                  <div className="flex justify-between items-center border-b border-slate-850 pb-3">
                    <div>
                      <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                        <Info className="w-4 h-4 text-blue-500" />
                        Secret Details Drawer
                      </h3>
                      <span className="text-[10px] text-slate-550 font-mono block mt-0.5">{selectedSecretId}</span>
                    </div>
                    <button onClick={() => setSelectedSecretId(null)} className="text-slate-500 hover:text-white">
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs leading-relaxed">
                    <div className="space-y-3">
                      <h4 className="font-bold text-[10px] text-slate-550 uppercase tracking-wider">Properties</h4>
                      <div className="bg-slate-950 border border-slate-850 rounded p-4 font-mono text-[11px] text-slate-350 space-y-2">
                        <div className="flex justify-between"><span className="text-slate-500">Plaintext value:</span><span className="text-red-400 font-semibold select-none">[Value Encrypted & Hidden]</span></div>
                        <div className="flex justify-between"><span className="text-slate-500">Security Check:</span><span className="text-emerald-500 font-semibold">Strict Standard Passed</span></div>
                        <div className="flex justify-between">
                          <span className="text-slate-500">Timestamp:</span>
                          <span className="text-slate-400 flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5" />
                            {new Date(secretUsageQuery.data.services[0]?.createdAt || Date.now()).toLocaleTimeString()}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="space-y-3">
                      <h4 className="font-bold text-[10px] text-slate-550 uppercase tracking-wider">Consuming Services</h4>
                      <div className="bg-slate-950 border border-slate-850 rounded p-4">
                        {secretUsageQuery.data.services.length === 0 ? (
                          <span className="text-slate-500 font-semibold block italic text-[11px]">Unused by Swarm services</span>
                        ) : (
                          <ul className="space-y-2 font-mono text-[11px] text-slate-350">
                            {secretUsageQuery.data.services.map((svc) => (
                              <li key={svc.id} className="flex justify-between items-center bg-slate-900 px-2 py-1 rounded">
                                <span className="font-bold text-white">{svc.name}</span>
                                <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-400">{svc.replicas} Replicas</span>
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'configs' && (
            <div className="space-y-6">
              <div className="bg-slate-900 border border-slate-800 rounded-lg overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse text-left text-xs">
                    <thead>
                      <tr className="bg-slate-950 border-b border-slate-800 text-[10px] uppercase font-bold text-slate-500 tracking-wider font-mono">
                        <th className="px-4 py-3">Config Name</th>
                        <th className="px-4 py-3">ID</th>
                        <th className="px-4 py-3">Created</th>
                        <th className="px-4 py-3">Updated</th>
                        <th className="px-4 py-3 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-850 text-slate-300">
                      {configsQuery.data
                        ?.filter(c => c.spec.name.toLowerCase().includes(searchTerm.toLowerCase()))
                        .map((cfg) => (
                          <tr
                            key={cfg.id}
                            onClick={() => setSelectedConfigId(cfg.id)}
                            className={`hover:bg-slate-800/40 cursor-pointer transition ${
                              selectedConfigId === cfg.id ? 'bg-blue-500/5' : ''
                            }`}
                          >
                            <td className="px-4 py-3.5 font-bold text-white">{cfg.spec.name}</td>
                            <td className="px-4 py-3.5 font-mono text-[11px] text-slate-450">{cfg.id.slice(0, 16)}</td>
                            <td className="px-4 py-3.5 font-mono text-[11px] text-slate-400">
                              {new Date(cfg.createdAt).toLocaleDateString()}
                            </td>
                            <td className="px-4 py-3.5 font-mono text-[11px] text-slate-400">
                              {new Date(cfg.updatedAt).toLocaleDateString()}
                            </td>
                            <td className="px-4 py-3.5 text-right" onClick={(e) => e.stopPropagation()}>
                              <button
                                onClick={() => setPendingDelete({ id: cfg.id, name: cfg.spec.name, type: 'config' })}
                                className="p-1 hover:bg-slate-800 rounded text-slate-400 hover:text-red-500 transition"
                                title="Delete Config"
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

              {/* Configs Details Drawer */}
              {selectedConfigId && configUsageQuery.data && (
                <div className="bg-slate-900 border border-slate-800 rounded-lg p-6 space-y-4 shadow-lg">
                  <div className="flex justify-between items-center border-b border-slate-850 pb-3">
                    <div>
                      <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                        <Info className="w-4 h-4 text-blue-500" />
                        Config Details Drawer
                      </h3>
                      <span className="text-[10px] text-slate-550 font-mono block mt-0.5">{selectedConfigId}</span>
                    </div>
                    <button onClick={() => setSelectedConfigId(null)} className="text-slate-500 hover:text-white">
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs leading-relaxed">
                    <div className="space-y-3">
                      <h4 className="font-bold text-[10px] text-slate-550 uppercase tracking-wider flex items-center gap-1">
                        <Code className="w-3.5 h-3.5 text-blue-500" />
                        Usage References
                      </h4>
                      <div className="bg-slate-950 border border-slate-850 rounded p-4 font-mono text-[11px] text-slate-350 space-y-2">
                        <div className="flex justify-between">
                          <span className="text-slate-500">Swarm Services Active:</span>
                          <span className="text-slate-300 font-semibold">{configUsageQuery.data.services.length}</span>
                        </div>
                      </div>
                    </div>
                    <div className="space-y-3">
                      <h4 className="font-bold text-[10px] text-slate-550 uppercase tracking-wider">Consuming Services</h4>
                      <div className="bg-slate-950 border border-slate-850 rounded p-4">
                        {configUsageQuery.data.services.length === 0 ? (
                          <span className="text-slate-500 font-semibold block italic text-[11px]">Unused by Swarm services</span>
                        ) : (
                          <ul className="space-y-2 font-mono text-[11px] text-slate-350">
                            {configUsageQuery.data.services.map((svc) => (
                              <li key={svc.id} className="flex justify-between items-center bg-slate-900 px-2 py-1 rounded">
                                <span className="font-bold text-white">{svc.name}</span>
                                <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-400">{svc.replicas} Replicas</span>
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>
                    </div>
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
                        <td colSpan={4} className="p-4 text-center text-slate-600 italic">No operations recorded in this session</td>
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
              Confirm Resource Removal
            </h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              Are you sure you want to delete the {pendingDelete.type} <strong>{pendingDelete.name}</strong>?
            </p>
            <div className="flex items-center gap-2 text-xs">
              <input
                type="checkbox"
                id="forceDeleteCheckbox"
                checked={forceDelete}
                onChange={(e) => setForceDelete(e.target.checked)}
                className="bg-slate-950 border border-slate-850 text-blue-500 rounded"
              />
              <label htmlFor="forceDeleteCheckbox" className="text-slate-350 select-none cursor-pointer">
                Force removal even if attached to Swarm services.
              </label>
            </div>
            <div className="flex justify-end gap-2 pt-2 border-t border-slate-850">
              <button
                onClick={() => { setPendingDelete(null); setForceDelete(false); }}
                className="px-3.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded text-xs font-semibold transition"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteConfirm}
                className="px-3.5 py-1.5 bg-red-600 hover:bg-red-500 text-white rounded text-xs font-semibold shadow-md shadow-red-500/20 transition"
              >
                Confirm Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CREATE SECRET MODAL */}
      {isCreateSecretModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <form onSubmit={handleSecretSubmit} className="bg-slate-900 border border-slate-800 rounded-lg max-w-md w-full p-6 space-y-4 shadow-xl">
            <div className="flex justify-between items-center border-b border-slate-850 pb-3">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">Create Swarm Secret</h3>
              <button type="button" onClick={() => setCreateSecretModalOpen(false)} className="text-slate-500 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="space-y-3.5 text-xs">
              <div className="space-y-1">
                <label className="text-slate-450 block font-semibold">Secret Name:</label>
                <input
                  type="text"
                  placeholder="e.g. database_password"
                  value={secretForm.name}
                  onChange={(e) => setSecretForm(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full bg-slate-950 border border-slate-850 px-3 py-1.5 rounded text-slate-300 focus:outline-none font-mono"
                  required
                />
              </div>
              <div className="space-y-1">
                <label className="text-slate-450 block font-semibold">Secret Payload Value:</label>
                <textarea
                  placeholder="Insert plaintext secret password or api key..."
                  value={secretForm.data}
                  onChange={(e) => setSecretForm(prev => ({ ...prev, data: e.target.value }))}
                  className="w-full h-24 bg-slate-950 border border-slate-850 px-3 py-1.5 rounded text-slate-300 font-mono text-[11px] focus:outline-none"
                  required
                />
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="isB64Check"
                  checked={secretForm.isBase64}
                  onChange={(e) => setSecretForm(prev => ({ ...prev, isBase64: e.target.checked }))}
                  className="bg-slate-950 border border-slate-850 text-blue-500 rounded"
                />
                <label htmlFor="isB64Check" className="text-slate-350 select-none cursor-pointer">Payload is already Base64 encoded</label>
              </div>
              <div className="border border-dashed border-slate-850 p-4 rounded flex flex-col items-center justify-center gap-2 hover:bg-slate-950 transition relative">
                <Upload className="w-5 h-5 text-slate-500" />
                <span className="text-[10px] text-slate-500">Drag or click to import file payload</span>
                <input
                  type="file"
                  onChange={(e) => handleFileUpload(e, 'secret')}
                  className="absolute inset-0 opacity-0 cursor-pointer"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-2 border-t border-slate-850 mt-4">
              <button
                type="button"
                onClick={() => setCreateSecretModalOpen(false)}
                className="px-3.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded text-xs font-semibold transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded text-xs font-semibold shadow-md shadow-blue-500/20 transition"
              >
                Create Secret
              </button>
            </div>
          </form>
        </div>
      )}

      {/* CREATE CONFIG MODAL */}
      {isCreateConfigModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <form onSubmit={handleConfigSubmit} className="bg-slate-900 border border-slate-800 rounded-lg max-w-md w-full p-6 space-y-4 shadow-xl">
            <div className="flex justify-between items-center border-b border-slate-850 pb-3">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">Create Swarm Config</h3>
              <button type="button" onClick={() => setCreateConfigModalOpen(false)} className="text-slate-500 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="space-y-3.5 text-xs">
              <div className="space-y-1">
                <label className="text-slate-450 block font-semibold">Config Name:</label>
                <input
                  type="text"
                  placeholder="e.g. nginx_config"
                  value={configForm.name}
                  onChange={(e) => setConfigForm(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full bg-slate-950 border border-slate-850 px-3 py-1.5 rounded text-slate-300 focus:outline-none font-mono"
                  required
                />
              </div>
              <div className="space-y-1">
                <label className="text-slate-450 block font-semibold">Config File Content:</label>
                <textarea
                  placeholder="Insert config parameters, json or yaml parameters..."
                  value={configForm.data}
                  onChange={(e) => setConfigForm(prev => ({ ...prev, data: e.target.value }))}
                  className="w-full h-24 bg-slate-950 border border-slate-850 px-3 py-1.5 rounded text-slate-300 font-mono text-[11px] focus:outline-none"
                  required
                />
              </div>
              <div className="border border-dashed border-slate-850 p-4 rounded flex flex-col items-center justify-center gap-2 hover:bg-slate-950 transition relative">
                <Upload className="w-5 h-5 text-slate-500" />
                <span className="text-[10px] text-slate-500">Drag or click to import configuration file</span>
                <input
                  type="file"
                  onChange={(e) => handleFileUpload(e, 'config')}
                  className="absolute inset-0 opacity-0 cursor-pointer"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-2 border-t border-slate-850 mt-4">
              <button
                type="button"
                onClick={() => setCreateConfigModalOpen(false)}
                className="px-3.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded text-xs font-semibold transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded text-xs font-semibold shadow-md shadow-blue-500/20 transition"
              >
                Create Config
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}

export default ResourcesDashboard;
