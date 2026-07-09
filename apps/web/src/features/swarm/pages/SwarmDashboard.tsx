import React, { useState } from 'react';
import { 
  Server, 
  Activity, 
  Shield, 
  Users, 
  Layers, 
  AlertTriangle, 
  X, 
  Settings, 
  Plus, 
  LogIn, 
  LogOut, 
  RefreshCcw, 
  Info,
  ChevronDown,
  ChevronRight,
  UserCheck,
  UserX,
  Play,
  Pause,
  Trash2,
  Search,
  Database
} from 'lucide-react';
import { 
  useSwarmStatus, 
  useSwarmInspect, 
  useSwarmTokens, 
  useSwarmUnlockKey, 
  useSwarmNodes, 
  useSwarmServices, 
  useSwarmTasks, 
  useClusterHealth, 
  useOperationsHistory, 
  useOperationStatus, 
  useSwarmMutations 
} from '../hooks/useSwarm';
import { useSwarmStore } from '../store/swarmStore';

// Simple format helper
const formatBytes = (bytes: number) => {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

export function SwarmDashboard() {
  // Store state
  const {
    activeTab,
    selectedNodeId,
    activeOperationId,
    isInitModalOpen,
    isJoinModalOpen,
    isRotateModalOpen,
    isUpdateModalOpen,
    isLeaveModalOpen,
    setActiveTab,
    setSelectedNodeId,
    setActiveOperationId,
    setInitModalOpen,
    setJoinModalOpen,
    setRotateModalOpen,
    setUpdateModalOpen,
    setLeaveModalOpen
  } = useSwarmStore();

  // API State
  const swarmStatusQuery = useSwarmStatus();
  const isSwarmActive = !!swarmStatusQuery.data?.active;

  const swarmInspectQuery = useSwarmInspect(isSwarmActive);
  const swarmTokensQuery = useSwarmTokens(isSwarmActive);
  const swarmUnlockKeyQuery = useSwarmUnlockKey(isSwarmActive);
  const swarmNodesQuery = useSwarmNodes(isSwarmActive);
  const swarmServicesQuery = useSwarmServices(isSwarmActive);
  const swarmTasksQuery = useSwarmTasks(undefined, isSwarmActive);
  const clusterHealthQuery = useClusterHealth(isSwarmActive);
  const operationsHistoryQuery = useOperationsHistory();

  // Active operation polling
  const activeOpQuery = useOperationStatus(activeOperationId || '');

  // Mutations
  const mutations = useSwarmMutations();

  // Component UI State
  const [nodeSearch, setNodeSearch] = useState('');
  const [serviceSearch, setServiceSearch] = useState('');
  const [nodeRoleFilter, setNodeRoleFilter] = useState<'all' | 'manager' | 'worker'>('all');
  const [nodeAvailabilityFilter, setNodeAvailabilityFilter] = useState<'all' | 'active' | 'pause' | 'drain'>('all');
  
  // Expanded lists
  const [expandedServices, setExpandedServices] = useState<Record<string, boolean>>({});

  // Confirm state
  const [pendingNodeAction, setPendingNodeAction] = useState<{
    id: string;
    hostname: string;
    action: 'promote' | 'demote' | 'drain' | 'activate' | 'pause' | 'remove';
  } | null>(null);

  // Form states
  const [initForm, setInitForm] = useState({
    listenAddr: '0.0.0.0:2377',
    advertiseAddr: '',
    dataPathAddr: '',
    forceNewCluster: false,
    autoLock: false
  });

  const [joinForm, setJoinForm] = useState({
    listenAddr: '0.0.0.0:2377',
    advertiseAddr: '',
    dataPathAddr: '',
    remoteAddr: '',
    joinToken: ''
  });

  const [updateSpecForm, setUpdateSpecForm] = useState({
    name: '',
    taskRetentionLimit: 5,
    snapshotInterval: 10000,
    heartbeatPeriod: 5000000000,
    autoLock: false
  });

  const [leaveForm, setLeaveForm] = useState({
    force: false
  });

  const handleInitSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await mutations.initSwarm({
        listenAddr: initForm.listenAddr,
        advertiseAddr: initForm.advertiseAddr || undefined,
        dataPathAddr: initForm.dataPathAddr || undefined,
        forceNewCluster: initForm.forceNewCluster,
        spec: {
          encryptionConfig: {
            autoLockManagers: initForm.autoLock
          }
        }
      });
      setActiveOperationId(res.operationId);
      setInitModalOpen(false);
    } catch (err: any) {
      alert(err.message || 'Failed to initialize Swarm');
    }
  };

  const handleJoinSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!joinForm.remoteAddr || !joinForm.joinToken) {
      alert('Remote address and join token are required');
      return;
    }
    try {
      const res = await mutations.joinSwarm({
        listenAddr: joinForm.listenAddr,
        advertiseAddr: joinForm.advertiseAddr || undefined,
        dataPathAddr: joinForm.dataPathAddr || undefined,
        remoteAddrs: [joinForm.remoteAddr],
        joinToken: joinForm.joinToken
      });
      setActiveOperationId(res.operationId);
      setJoinModalOpen(false);
    } catch (err: any) {
      alert(err.message || 'Failed to join Swarm cluster');
    }
  };

  const handleUpdateSpecSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!swarmInspectQuery.data) return;
    try {
      const res = await mutations.updateSpec({
        version: swarmInspectQuery.data.version.index,
        spec: {
          name: updateSpecForm.name || undefined,
          orchestration: {
            taskHistoryRetentionLimit: updateSpecForm.taskRetentionLimit
          },
          raft: {
            snapshotInterval: updateSpecForm.snapshotInterval
          },
          dispatcher: {
            heartbeatPeriod: updateSpecForm.heartbeatPeriod
          },
          encryptionConfig: {
            autoLockManagers: updateSpecForm.autoLock
          }
        }
      });
      setActiveOperationId(res.operationId);
      setUpdateModalOpen(false);
    } catch (err: any) {
      alert(err.message || 'Failed to update Swarm spec');
    }
  };

  const handleLeaveSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await mutations.leaveSwarm({
        force: leaveForm.force
      });
      setActiveOperationId(res.operationId);
      setLeaveModalOpen(false);
    } catch (err: any) {
      alert(err.message || 'Failed to leave Swarm cluster');
    }
  };

  const handleNodeActionConfirm = async () => {
    if (!pendingNodeAction) return;
    const { id, action } = pendingNodeAction;
    try {
      let res;
      if (action === 'remove') {
        res = await mutations.removeNode({ id, force: true });
      } else {
        res = await mutations.promoteNode ? (
          action === 'promote' ? await mutations.promoteNode(id)
          : action === 'demote' ? await mutations.demoteNode(id)
          : action === 'drain' ? await mutations.drainNode(id)
          : action === 'activate' ? await mutations.activateNode(id)
          : await mutations.pauseNode(id)
        ) : null;
      }
      if (res) {
        setActiveOperationId(res.operationId);
      }
      setPendingNodeAction(null);
    } catch (err: any) {
      alert(err.message || 'Node mutation failed');
      setPendingNodeAction(null);
    }
  };

  // Open Update Spec Form
  const openUpdateSpec = () => {
    if (!swarmInspectQuery.data) return;
    const spec = swarmInspectQuery.data.spec;
    setUpdateSpecForm({
      name: spec.name || '',
      taskRetentionLimit: spec.orchestration?.taskHistoryRetentionLimit ?? 5,
      snapshotInterval: spec.raft?.snapshotInterval ?? 10000,
      heartbeatPeriod: spec.dispatcher?.heartbeatPeriod ?? 5000000000,
      autoLock: spec.encryptionConfig?.autoLockManagers ?? false
    });
    setUpdateModalOpen(true);
  };

  const toggleServiceExpand = (id: string) => {
    setExpandedServices(prev => ({ ...prev, [id]: !prev[id] }));
  };

  // Trigger manual sync
  const triggerRefresh = () => {
    swarmStatusQuery.refetch();
    if (isSwarmActive) {
      swarmInspectQuery.refetch();
      swarmTokensQuery.refetch();
      swarmUnlockKeyQuery.refetch();
      swarmNodesQuery.refetch();
      swarmServicesQuery.refetch();
      swarmTasksQuery.refetch();
      clusterHealthQuery.refetch();
    }
    operationsHistoryQuery.refetch();
  };

  return (
    <div className="space-y-6">
      {/* Page Title & Toolbar */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-800 pb-4">
        <div>
          <h1 className="text-xl font-bold flex items-center gap-2 text-white">
            <Server className="w-6 h-6 text-blue-500" />
            Docker Swarm Cluster Manager
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Orchestrate container services, manage cluster nodes, monitor task lifecycle and inspect overall infrastructure health.
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
          {!isSwarmActive ? (
            <div className="flex gap-2">
              <button
                onClick={() => setInitModalOpen(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded text-xs font-semibold shadow-md shadow-blue-500/20 transition"
              >
                <Plus className="w-3.5 h-3.5" />
                Initialize Cluster
              </button>
              <button
                onClick={() => setJoinModalOpen(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded text-xs font-semibold transition"
              >
                <LogIn className="w-3.5 h-3.5" />
                Join Cluster
              </button>
            </div>
          ) : (
            <div className="flex gap-2">
              <button
                onClick={openUpdateSpec}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 border border-slate-800 hover:bg-slate-800 rounded text-xs text-slate-300 transition"
              >
                <Settings className="w-3.5 h-3.5" />
                Cluster Settings
              </button>
              <button
                onClick={() => setLeaveModalOpen(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-red-650 hover:bg-red-600 text-white rounded text-xs font-semibold transition"
              >
                <LogOut className="w-3.5 h-3.5" />
                Leave Swarm
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Warning/Inactive Swarm Banner */}
      {!isSwarmActive && (
        <div className="bg-slate-900 border border-yellow-500/30 rounded-lg p-5 flex items-start gap-4 shadow-lg">
          <div className="p-2 bg-yellow-500/10 rounded-lg text-yellow-500 shrink-0">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-yellow-500 uppercase tracking-wider">Docker Swarm is Inactive</h3>
            <p className="text-xs text-slate-400 mt-1 max-w-2xl leading-relaxed">
              This Docker engine node is running in single-host mode. Initialize a new Docker Swarm to establish this node as a cluster manager, or join an existing swarm cluster using worker/manager tokens.
            </p>
            <div className="mt-4 flex gap-3">
              <button
                onClick={() => setInitModalOpen(true)}
                className="px-3 py-1.5 bg-blue-650 hover:bg-blue-600 text-white font-semibold rounded text-xs transition"
              >
                Create Swarm
              </button>
              <button
                onClick={() => setJoinModalOpen(true)}
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold rounded text-xs transition"
              >
                Join Swarm
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Active Operation Progress Bar Banner */}
      {activeOperationId && activeOpQuery.data && (
        <div className="bg-slate-900 border border-blue-500/20 rounded-lg p-4 shadow-xl">
          <div className="flex justify-between items-start">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-blue-500 animate-pulse"></span>
              <h4 className="text-xs font-semibold text-white">
                Active Operation: <span className="text-blue-400">{activeOpQuery.data.action}</span>
              </h4>
            </div>
            <button
              onClick={() => setActiveOperationId(null)}
              className="text-slate-500 hover:text-white"
            >
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
            <span className="text-[11px] font-mono text-slate-400 shrink-0">
              {activeOpQuery.data.progress}%
            </span>
          </div>
          <div className="mt-2.5 max-h-24 overflow-y-auto bg-slate-950 p-2 rounded text-[10px] font-mono text-slate-400 space-y-1">
            {activeOpQuery.data.logs.map((log, idx) => (
              <div key={idx}>&gt; {log}</div>
            ))}
          </div>
          {activeOpQuery.data.status !== 'running' && (
            <div className="mt-2.5 flex justify-end">
              <button
                onClick={() => setActiveOperationId(null)}
                className={`px-2.5 py-1 text-xs font-semibold rounded ${
                  activeOpQuery.data.status === 'success'
                    ? 'bg-emerald-650 hover:bg-emerald-600 text-white'
                    : 'bg-red-650 hover:bg-red-600 text-white'
                }`}
              >
                Dismiss ({activeOpQuery.data.status.toUpperCase()})
              </button>
            </div>
          )}
        </div>
      )}

      {/* Swarm Active Navigation Tabs */}
      {isSwarmActive && (
        <div className="flex border-b border-slate-800 gap-1">
          <button
            onClick={() => setActiveTab('dashboard')}
            className={`px-4 py-2 text-xs font-semibold border-b-2 transition ${
              activeTab === 'dashboard'
                ? 'border-blue-500 text-blue-400 bg-blue-500/5'
                : 'border-transparent text-slate-400 hover:text-slate-350 hover:bg-slate-900/50'
            }`}
          >
            Overview
          </button>
          <button
            onClick={() => setActiveTab('nodes')}
            className={`px-4 py-2 text-xs font-semibold border-b-2 transition ${
              activeTab === 'nodes'
                ? 'border-blue-500 text-blue-400 bg-blue-500/5'
                : 'border-transparent text-slate-400 hover:text-slate-350 hover:bg-slate-900/50'
            }`}
          >
            Node Explorer ({swarmNodesQuery.data?.length || 0})
          </button>
          <button
            onClick={() => setActiveTab('services')}
            className={`px-4 py-2 text-xs font-semibold border-b-2 transition ${
              activeTab === 'services'
                ? 'border-blue-500 text-blue-400 bg-blue-500/5'
                : 'border-transparent text-slate-400 hover:text-slate-350 hover:bg-slate-900/50'
            }`}
          >
            Services Explorer ({swarmServicesQuery.data?.length || 0})
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`px-4 py-2 text-xs font-semibold border-b-2 transition ${
              activeTab === 'history'
                ? 'border-blue-500 text-blue-400 bg-blue-500/5'
                : 'border-transparent text-slate-400 hover:text-slate-350 hover:bg-slate-900/50'
            }`}
          >
            Operation History
          </button>
        </div>
      )}

      {/* TAB CONTENT */}
      {isSwarmActive && (
        <div>
          {/* OVERVIEW DASHBOARD */}
          {activeTab === 'dashboard' && (
            <div className="space-y-6">
              {/* Telemetry Cards Grid */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {/* Cluster Status Card */}
                <div className="bg-slate-900 border border-slate-800 p-5 rounded-lg flex items-center justify-between shadow-sm">
                  <div>
                    <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Cluster Status</span>
                    <h3 className={`text-lg font-extrabold mt-1 uppercase ${
                      clusterHealthQuery.data?.status === 'healthy' ? 'text-emerald-500' :
                      clusterHealthQuery.data?.status === 'degraded' ? 'text-yellow-500' :
                      clusterHealthQuery.data?.status === 'critical' ? 'text-red-500' : 'text-slate-450'
                    }`}>
                      {clusterHealthQuery.data?.status || 'UNKNOWN'}
                    </h3>
                  </div>
                  <div className={`p-3 rounded-lg shrink-0 ${
                    clusterHealthQuery.data?.status === 'healthy' ? 'bg-emerald-500/10 text-emerald-500' :
                    clusterHealthQuery.data?.status === 'degraded' ? 'bg-yellow-500/10 text-yellow-500' :
                    'bg-red-500/10 text-red-500'
                  }`}>
                    <Activity className="w-5 h-5" />
                  </div>
                </div>

                {/* Managers Quorum Status Card */}
                <div className="bg-slate-900 border border-slate-800 p-5 rounded-lg flex items-center justify-between shadow-sm">
                  <div>
                    <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Manager Quorum</span>
                    <h3 className="text-lg font-extrabold mt-1 text-white">
                      {clusterHealthQuery.data?.managers.active || 0} / {clusterHealthQuery.data?.managers.total || 0} Online
                    </h3>
                  </div>
                  <div className="p-3 bg-indigo-500/10 text-indigo-400 rounded-lg shrink-0">
                    <Shield className="w-5 h-5" />
                  </div>
                </div>

                {/* Worker Node Summary Card */}
                <div className="bg-slate-900 border border-slate-800 p-5 rounded-lg flex items-center justify-between shadow-sm">
                  <div>
                    <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Workers Summary</span>
                    <h3 className="text-lg font-extrabold mt-1 text-white">
                      {clusterHealthQuery.data?.workers.active || 0} / {clusterHealthQuery.data?.workers.total || 0} Active
                    </h3>
                  </div>
                  <div className="p-3 bg-purple-500/10 text-purple-400 rounded-lg shrink-0">
                    <Users className="w-5 h-5" />
                  </div>
                </div>

                {/* Service/Task Counts Card */}
                <div className="bg-slate-900 border border-slate-800 p-5 rounded-lg flex items-center justify-between shadow-sm">
                  <div>
                    <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Services & Tasks</span>
                    <h3 className="text-lg font-extrabold mt-1 text-white">
                      {swarmServicesQuery.data?.length || 0} Svc / {swarmTasksQuery.data?.filter(t => t.status.state === 'running').length || 0} Run Tasks
                    </h3>
                  </div>
                  <div className="p-3 bg-blue-500/10 text-blue-400 rounded-lg shrink-0">
                    <Layers className="w-5 h-5" />
                  </div>
                </div>
              </div>

              {/* Warnings and Quorum Loss Banner */}
              {clusterHealthQuery.data && clusterHealthQuery.data.status === 'critical' && (
                <div className="bg-red-950/20 border border-red-500/40 text-red-400 p-4 rounded-lg flex items-start gap-3">
                  <AlertTriangle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
                  <div>
                    <h4 className="text-xs font-bold uppercase tracking-wider">Quorum Loss Detected!</h4>
                    <p className="text-xs text-slate-400 mt-1">
                      More than half of the cluster managers are unreachable. Raft consensus is lost. The cluster spec cannot be modified and scheduling decisions are halted until quorum is restored.
                    </p>
                  </div>
                </div>
              )}

              {/* Middle Section: Cluster details and tokens */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Cluster Specs */}
                <div className="bg-slate-900 border border-slate-800 rounded-lg p-5 shadow-sm space-y-4">
                  <div className="flex justify-between items-center border-b border-slate-800 pb-3">
                    <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                      <Settings className="w-4 h-4 text-slate-400" />
                      Swarm Specifications
                    </h4>
                    <button
                      onClick={openUpdateSpec}
                      className="text-[10px] text-blue-500 font-semibold hover:underline"
                    >
                      Edit Config
                    </button>
                  </div>
                  <div className="grid grid-cols-2 gap-y-3 gap-x-4 text-xs font-mono">
                    <div>
                      <span className="text-slate-500 block">Cluster ID:</span>
                      <span className="text-slate-300 text-[11px] truncate block" title={swarmInspectQuery.data?.id}>
                        {swarmInspectQuery.data?.id || 'N/A'}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-500 block">Version Index:</span>
                      <span className="text-slate-300">
                        {swarmInspectQuery.data?.version.index || 0}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-500 block">Task Retention Limit:</span>
                      <span className="text-slate-300">
                        {swarmInspectQuery.data?.spec.orchestration.taskHistoryRetentionLimit ?? 'N/A'} tasks
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-500 block">Dispatcher Heartbeat Period:</span>
                      <span className="text-slate-300">
                        {((swarmInspectQuery.data?.spec.dispatcher.heartbeatPeriod || 0) / 1e9).toFixed(1)}s
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-500 block">Raft Snapshot Interval:</span>
                      <span className="text-slate-300">
                        {swarmInspectQuery.data?.spec.raft.snapshotInterval ?? 'N/A'} entries
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-500 block">CA Expiry Duration:</span>
                      <span className="text-slate-300">
                        {((swarmInspectQuery.data?.spec.caConfig.nodeCertExpiry || 0) / (3600 * 24 * 1e9)).toFixed(0)} days
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-500 block">Autolock Manager:</span>
                      <span className="text-slate-300">
                        {swarmInspectQuery.data?.spec.encryptionConfig.autoLockManagers ? 'Enabled' : 'Disabled'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Join Tokens */}
                <div className="bg-slate-900 border border-slate-800 rounded-lg p-5 shadow-sm space-y-4">
                  <div className="flex justify-between items-center border-b border-slate-800 pb-3">
                    <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                      <LogIn className="w-4 h-4 text-slate-400" />
                      Swarm Cluster Join Tokens
                    </h4>
                    <button
                      onClick={() => setRotateModalOpen(true)}
                      className="text-[10px] text-blue-500 font-semibold hover:underline"
                    >
                      Rotate Tokens
                    </button>
                  </div>
                  <div className="space-y-3.5">
                    <div>
                      <div className="flex justify-between text-[11px] font-semibold text-slate-400 mb-1">
                        <span>Worker Join Token:</span>
                        <button 
                          onClick={() => {
                            navigator.clipboard.writeText(swarmTokensQuery.data?.worker || '');
                            alert('Copied worker join token to clipboard');
                          }}
                          className="text-[10px] text-blue-500 font-semibold hover:underline"
                        >
                          Copy Token
                        </button>
                      </div>
                      <input
                        type="text"
                        readOnly
                        value={swarmTokensQuery.data?.worker || 'Token not loaded'}
                        className="w-full bg-slate-950 border border-slate-850 px-3 py-1.5 rounded text-[10px] font-mono text-slate-400 select-all focus:outline-none"
                      />
                    </div>
                    <div>
                      <div className="flex justify-between text-[11px] font-semibold text-slate-400 mb-1">
                        <span>Manager Join Token:</span>
                        <button 
                          onClick={() => {
                            navigator.clipboard.writeText(swarmTokensQuery.data?.manager || '');
                            alert('Copied manager join token to clipboard');
                          }}
                          className="text-[10px] text-blue-500 font-semibold hover:underline"
                        >
                          Copy Token
                        </button>
                      </div>
                      <input
                        type="text"
                        readOnly
                        value={swarmTokensQuery.data?.manager || 'Token not loaded'}
                        className="w-full bg-slate-950 border border-slate-850 px-3 py-1.5 rounded text-[10px] font-mono text-slate-400 select-all focus:outline-none"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* NODE EXPLORER */}
          {activeTab === 'nodes' && (
            <div className="space-y-6">
              {/* Filter controls */}
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-slate-900 border border-slate-800 p-4 rounded-lg">
                <div className="flex items-center gap-2 w-full sm:max-w-xs bg-slate-950 border border-slate-800 px-3 py-1.5 rounded">
                  <Search className="w-4 h-4 text-slate-500 shrink-0" />
                  <input
                    type="text"
                    placeholder="Search nodes by hostname..."
                    value={nodeSearch}
                    onChange={(e) => setNodeSearch(e.target.value)}
                    className="w-full bg-transparent text-xs text-slate-300 placeholder-slate-650 focus:outline-none"
                  />
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] text-slate-500 font-semibold uppercase">Role</span>
                    <select
                      value={nodeRoleFilter}
                      onChange={(e: any) => setNodeRoleFilter(e.target.value)}
                      className="bg-slate-950 border border-slate-800 text-xs px-2.5 py-1 rounded text-slate-300 focus:outline-none"
                    >
                      <option value="all">All Roles</option>
                      <option value="manager">Manager</option>
                      <option value="worker">Worker</option>
                    </select>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] text-slate-500 font-semibold uppercase">Scheduling</span>
                    <select
                      value={nodeAvailabilityFilter}
                      onChange={(e: any) => setNodeAvailabilityFilter(e.target.value)}
                      className="bg-slate-950 border border-slate-800 text-xs px-2.5 py-1 rounded text-slate-300 focus:outline-none"
                    >
                      <option value="all">All Modes</option>
                      <option value="active">Active</option>
                      <option value="pause">Pause</option>
                      <option value="drain">Drain</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Node Explorer table */}
              <div className="bg-slate-900 border border-slate-800 rounded-lg overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse text-left">
                    <thead>
                      <tr className="bg-slate-950 border-b border-slate-800 text-[10px] uppercase font-bold text-slate-500 tracking-wider font-mono">
                        <th className="px-4 py-3">Hostname</th>
                        <th className="px-4 py-3">State</th>
                        <th className="px-4 py-3">Role</th>
                        <th className="px-4 py-3">Scheduling</th>
                        <th className="px-4 py-3">Engine Version</th>
                        <th className="px-4 py-3">Resources</th>
                        <th className="px-4 py-3 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-850 text-xs font-medium text-slate-300">
                      {swarmNodesQuery.data
                        ?.filter(n => {
                          const matchesSearch = n.description.hostname.toLowerCase().includes(nodeSearch.toLowerCase()) || n.id.toLowerCase().includes(nodeSearch.toLowerCase());
                          const matchesRole = nodeRoleFilter === 'all' || n.spec.role === nodeRoleFilter;
                          const matchesAvail = nodeAvailabilityFilter === 'all' || n.spec.availability === nodeAvailabilityFilter;
                          return matchesSearch && matchesRole && matchesAvail;
                        })
                        .map((node) => {
                          return (
                            <tr 
                              key={node.id}
                              onClick={() => setSelectedNodeId(node.id)}
                              className={`hover:bg-slate-800/40 cursor-pointer transition ${
                                selectedNodeId === node.id ? 'bg-blue-500/5' : ''
                              }`}
                            >
                              <td className="px-4 py-3.5">
                                <div className="flex items-center gap-2">
                                  {node.managerStatus?.leader && (
                                    <span className="p-0.5 bg-blue-500/10 rounded text-blue-500" title="Raft Leader">
                                      <Shield className="w-3.5 h-3.5" />
                                    </span>
                                  )}
                                  <div>
                                    <span className="font-semibold text-white block">{node.description.hostname}</span>
                                    <span className="text-[10px] text-slate-550 font-mono block">{node.id}</span>
                                  </div>
                                </div>
                              </td>
                              <td className="px-4 py-3.5">
                                <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                                  node.status.state === 'ready' ? 'bg-emerald-500/15 text-emerald-500' : 'bg-red-500/15 text-red-500'
                                }`}>
                                  {node.status.state}
                                </span>
                              </td>
                              <td className="px-4 py-3.5">
                                <span className={`inline-flex items-center px-2 py-0.5 rounded font-mono text-[10px] ${
                                  node.spec.role === 'manager' ? 'bg-blue-500/10 text-blue-400' : 'bg-slate-850 text-slate-400'
                                }`}>
                                  {node.spec.role.toUpperCase()}
                                </span>
                              </td>
                              <td className="px-4 py-3.5">
                                <span className={`inline-flex items-center px-2 py-0.5 rounded font-mono text-[10px] ${
                                  node.spec.availability === 'active' ? 'bg-emerald-500/10 text-emerald-400' :
                                  node.spec.availability === 'drain' ? 'bg-yellow-500/10 text-yellow-450' :
                                  'bg-slate-800 text-slate-400'
                                }`}>
                                  {node.spec.availability.toUpperCase()}
                                </span>
                              </td>
                              <td className="px-4 py-3.5 font-mono text-[11px] text-slate-400">
                                {node.description.engine.engineVersion}
                              </td>
                              <td className="px-4 py-3.5 font-mono text-[11px] text-slate-400">
                                {node.description.resources.nanoCPUs / 1e9} CPU / {formatBytes(node.description.resources.memoryBytes)}
                              </td>
                              <td className="px-4 py-3.5 text-right" onClick={(e) => e.stopPropagation()}>
                                <div className="inline-flex items-center gap-1">
                                  {/* Promotion / Demotion Action */}
                                  {node.spec.role === 'worker' ? (
                                    <button
                                      onClick={() => setPendingNodeAction({ id: node.id, hostname: node.description.hostname, action: 'promote' })}
                                      className="p-1 hover:bg-slate-800 rounded text-slate-400 hover:text-white transition"
                                      title="Promote Node to Manager"
                                    >
                                      <UserCheck className="w-4 h-4" />
                                    </button>
                                  ) : (
                                    <button
                                      onClick={() => setPendingNodeAction({ id: node.id, hostname: node.description.hostname, action: 'demote' })}
                                      disabled={node.managerStatus?.leader}
                                      className={`p-1 hover:bg-slate-800 rounded text-slate-400 hover:text-white transition ${
                                        node.managerStatus?.leader ? 'opacity-30 cursor-not-allowed' : ''
                                      }`}
                                      title="Demote Node to Worker"
                                    >
                                      <UserX className="w-4 h-4" />
                                    </button>
                                  )}

                                  {/* Availability actions */}
                                  {node.spec.availability === 'active' ? (
                                    <button
                                      onClick={() => setPendingNodeAction({ id: node.id, hostname: node.description.hostname, action: 'drain' })}
                                      className="p-1 hover:bg-slate-800 rounded text-slate-400 hover:text-white transition"
                                      title="Drain node tasks scheduling"
                                    >
                                      <Pause className="w-4 h-4" />
                                    </button>
                                  ) : (
                                    <button
                                      onClick={() => setPendingNodeAction({ id: node.id, hostname: node.description.hostname, action: 'activate' })}
                                      className="p-1 hover:bg-slate-800 rounded text-slate-400 hover:text-white transition"
                                      title="Activate node tasks scheduling"
                                    >
                                      <Play className="w-4 h-4" />
                                    </button>
                                  )}

                                  {/* Remove node from swarm */}
                                  <button
                                    onClick={() => setPendingNodeAction({ id: node.id, hostname: node.description.hostname, action: 'remove' })}
                                    className="p-1 hover:bg-slate-800 rounded text-slate-400 hover:text-red-500 transition"
                                    title="Remove Node"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Node Details Drawer (Slide-out panel) */}
              {selectedNodeId && (() => {
                const node = swarmNodesQuery.data?.find(n => n.id === selectedNodeId);
                if (!node) return null;
                return (
                  <div className="bg-slate-900 border border-slate-800 rounded-lg p-6 shadow-lg space-y-5">
                    <div className="flex justify-between items-center border-b border-slate-850 pb-3">
                      <div>
                        <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                          <Info className="w-4 h-4 text-blue-500" />
                          Node Specification Details
                        </h3>
                        <span className="text-[10px] text-slate-500 font-mono">{node.id}</span>
                      </div>
                      <button 
                        onClick={() => setSelectedNodeId(null)}
                        className="text-slate-500 hover:text-white"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
                      <div className="space-y-3">
                        <h4 className="font-bold text-[10px] uppercase text-slate-500 tracking-wider">Properties</h4>
                        <div className="grid grid-cols-2 gap-y-2 font-mono">
                          <span className="text-slate-450">Hostname:</span>
                          <span className="text-slate-350">{node.description.hostname}</span>
                          
                          <span className="text-slate-450">OS/Arch:</span>
                          <span className="text-slate-350">{node.description.platform.os} / {node.description.platform.architecture}</span>

                          <span className="text-slate-450">Resources:</span>
                          <span className="text-slate-350">{node.description.resources.nanoCPUs / 1e9} CPUs, {formatBytes(node.description.resources.memoryBytes)}</span>

                          <span className="text-slate-450">TLS Issuer:</span>
                          <span className="text-slate-350 truncate">{node.description.tlsInfo?.certIssuerSubject || 'N/A'}</span>

                          <span className="text-slate-450">Status:</span>
                          <span className="text-slate-350">{node.status.state} ({node.status.message || 'active'})</span>
                        </div>
                      </div>

                      <div className="space-y-3">
                        <h4 className="font-bold text-[10px] uppercase text-slate-500 tracking-wider">Node Labels</h4>
                        {Object.keys(node.spec.labels).length === 0 ? (
                          <span className="text-xs text-slate-550 italic font-mono block">No labels configured</span>
                        ) : (
                          <div className="flex flex-wrap gap-1.5">
                            {Object.entries(node.spec.labels).map(([key, val]) => (
                              <span key={key} className="inline-block bg-slate-950 border border-slate-850 px-2 py-0.5 rounded text-[10px] font-mono text-slate-400">
                                {key}={val}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })()}
            </div>
          )}

          {/* SERVICES EXPLORER */}
          {activeTab === 'services' && (
            <div className="space-y-6">
              {/* Search bar */}
              <div className="flex justify-between items-center bg-slate-900 border border-slate-800 p-4 rounded-lg">
                <div className="flex items-center gap-2 w-full sm:max-w-xs bg-slate-950 border border-slate-800 px-3 py-1.5 rounded">
                  <Search className="w-4 h-4 text-slate-500 shrink-0" />
                  <input
                    type="text"
                    placeholder="Search services by name..."
                    value={serviceSearch}
                    onChange={(e) => setServiceSearch(e.target.value)}
                    className="w-full bg-transparent text-xs text-slate-300 placeholder-slate-650 focus:outline-none"
                  />
                </div>
              </div>

              {/* Service Cards & Expandable task list */}
              <div className="space-y-4">
                {swarmServicesQuery.data
                  ?.filter(s => s.spec.name.toLowerCase().includes(serviceSearch.toLowerCase()))
                  .map((svc) => {
                    const isExpanded = !!expandedServices[svc.id];
                    const svcTasks = swarmTasksQuery.data?.filter(t => t.serviceID === svc.id) || [];
                    const runningTasksCount = svcTasks.filter(t => t.status.state === 'running').length;
                    const desiredReplicas = svc.spec.mode.replicated?.replicas ?? 1;

                    return (
                      <div key={svc.id} className="bg-slate-900 border border-slate-850 rounded-lg p-5 space-y-4 shadow-sm">
                        <div 
                          className="flex justify-between items-start cursor-pointer select-none"
                          onClick={() => toggleServiceExpand(svc.id)}
                        >
                          <div className="flex items-start gap-3">
                            <div className="p-2 bg-blue-500/10 rounded-lg text-blue-500 mt-1">
                              <Database className="w-5 h-5" />
                            </div>
                            <div>
                              <h3 className="text-sm font-extrabold text-white">{svc.spec.name}</h3>
                              <p className="text-[10px] text-slate-500 font-mono mt-0.5">{svc.id}</p>
                              <div className="mt-2.5 flex flex-wrap gap-2 text-[10px] font-mono">
                                <span className="bg-slate-950 border border-slate-850 px-2 py-0.5 rounded text-slate-400">
                                  Image: <strong className="text-slate-300">{svc.spec.taskTemplate.containerSpec.image}</strong>
                                </span>
                                <span className="bg-slate-950 border border-slate-850 px-2 py-0.5 rounded text-slate-400">
                                  Replicas: <strong className="text-slate-300">{runningTasksCount} / {desiredReplicas}</strong>
                                </span>
                              </div>
                            </div>
                          </div>
                          <div>
                            {isExpanded ? <ChevronDown className="w-5 h-5 text-slate-500" /> : <ChevronRight className="w-5 h-5 text-slate-500" />}
                          </div>
                        </div>

                        {isExpanded && (
                          <div className="border-t border-slate-850 pt-4 space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                              {/* Configuration specification info */}
                              <div className="space-y-2">
                                <h4 className="font-bold text-[10px] text-slate-500 uppercase tracking-wider">Placement & Restart Policies</h4>
                                <ul className="space-y-1.5 font-mono text-[11px] text-slate-400">
                                  <li>Constraints: {svc.spec.taskTemplate.placement?.constraints?.join(', ') || 'None'}</li>
                                  <li>Restart Condition: {svc.spec.taskTemplate.restartPolicy?.condition || 'any'}</li>
                                  <li>Update Order: {svc.spec.updateConfig?.order || 'stop-first'}</li>
                                  <li>Update Parallelism: {svc.spec.updateConfig?.parallelism ?? 1}</li>
                                </ul>
                              </div>
                              <div className="space-y-2">
                                <h4 className="font-bold text-[10px] text-slate-500 uppercase tracking-wider">Network & Ports</h4>
                                <ul className="space-y-1.5 font-mono text-[11px] text-slate-400">
                                  <li>Published Ports: {svc.endpoint?.ports?.map(p => `${p.publishedPort}:${p.targetPort}/${p.protocol}`).join(', ') || 'None'}</li>
                                </ul>
                              </div>
                            </div>

                            {/* Task List */}
                            <div className="space-y-2">
                              <h4 className="font-bold text-[10px] text-slate-500 uppercase tracking-wider">Task Allocations</h4>
                              <div className="bg-slate-950 border border-slate-850 rounded overflow-hidden">
                                <table className="w-full border-collapse text-left text-[11px] font-mono">
                                  <thead>
                                    <tr className="bg-slate-900 border-b border-slate-850 text-slate-500 font-bold uppercase py-2 px-3">
                                      <th className="p-2">Task ID</th>
                                      <th className="p-2">Node</th>
                                      <th className="p-2">Desired State</th>
                                      <th className="p-2">Current State</th>
                                      <th className="p-2">Container Reference</th>
                                    </tr>
                                  </thead>
                                  <tbody className="divide-y divide-slate-900 text-slate-400">
                                    {svcTasks.map((task) => {
                                      const taskNode = swarmNodesQuery.data?.find(n => n.id === task.nodeID);
                                      return (
                                        <tr key={task.id} className="hover:bg-slate-900/60">
                                          <td className="p-2 text-slate-300">{task.id.slice(0, 12)}</td>
                                          <td className="p-2">{taskNode?.description.hostname || task.nodeID}</td>
                                          <td className="p-2 uppercase">{task.desiredState}</td>
                                          <td className="p-2">
                                            <span className={`inline-flex px-1.5 py-0.5 rounded text-[10px] font-semibold uppercase ${
                                              task.status.state === 'running' ? 'bg-emerald-950 text-emerald-400' :
                                              task.status.state === 'failed' ? 'bg-red-950 text-red-450' :
                                              'bg-slate-800 text-slate-400'
                                            }`}>
                                              {task.status.state}
                                            </span>
                                          </td>
                                          <td className="p-2 text-slate-500 truncate max-w-xs" title={task.status.containerStatus?.containerID}>
                                            {task.status.containerStatus?.containerID?.slice(0, 12) || 'N/A'}
                                          </td>
                                        </tr>
                                      );
                                    })}
                                    {svcTasks.length === 0 && (
                                      <tr>
                                        <td colSpan={5} className="p-3 text-center text-slate-600 italic">No tasks active for this service</td>
                                      </tr>
                                    )}
                                  </tbody>
                                </table>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
              </div>
            </div>
          )}

          {/* OPERATION HISTORY */}
          {activeTab === 'history' && (
            <div className="space-y-6">
              <div className="bg-slate-900 border border-slate-800 rounded-lg overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse text-left">
                    <thead>
                      <tr className="bg-slate-950 border-b border-slate-800 text-[10px] uppercase font-bold text-slate-500 tracking-wider font-mono">
                        <th className="px-4 py-3">Timestamp</th>
                        <th className="px-4 py-3">Action</th>
                        <th className="px-4 py-3">Status</th>
                        <th className="px-4 py-3">Details / Errors</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-850 text-xs font-mono text-slate-400">
                      {operationsHistoryQuery.data?.map((op) => (
                        <tr key={op.operationId} className="hover:bg-slate-800/40 transition">
                          <td className="px-4 py-3 text-slate-500">
                            {new Date(op.timestamp).toLocaleTimeString()}
                          </td>
                          <td className="px-4 py-3 text-slate-200 font-semibold">{op.action}</td>
                          <td className="px-4 py-3">
                            <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold uppercase ${
                              op.status === 'success' ? 'bg-emerald-950 text-emerald-450' :
                              op.status === 'failed' ? 'bg-red-950 text-red-450' : 'bg-slate-800 text-slate-400'
                            }`}>
                              {op.status}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-slate-350 truncate max-w-md">
                            {op.error ? (
                              <span className="text-red-450 font-semibold">{op.error}</span>
                            ) : (
                              op.logs[op.logs.length - 1]
                            )}
                          </td>
                        </tr>
                      ))}
                      {(operationsHistoryQuery.data?.length || 0) === 0 && (
                        <tr>
                          <td colSpan={4} className="p-4 text-center text-slate-650 italic">No operations recorded in this session</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* CONFIRMATION DIALOG FOR NODE MUTATIONS */}
      {pendingNodeAction && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-lg max-w-md w-full p-6 space-y-4 shadow-xl">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
              <AlertTriangle className="w-5 h-5 text-yellow-500" />
              Confirm Node Mutation
            </h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              Are you sure you want to perform action <strong className="text-yellow-500 uppercase">{pendingNodeAction.action}</strong> on node <strong>{pendingNodeAction.hostname}</strong>?
            </p>
            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setPendingNodeAction(null)}
                className="px-3.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded text-xs font-semibold transition"
              >
                Cancel
              </button>
              <button
                onClick={handleNodeActionConfirm}
                className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded text-xs font-semibold shadow-md shadow-blue-500/20 transition"
              >
                Confirm Action
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODALS */}

      {/* 1. INITIALIZE CLUSTER MODAL */}
      {isInitModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <form onSubmit={handleInitSubmit} className="bg-slate-900 border border-slate-800 rounded-lg max-w-md w-full p-6 space-y-4 shadow-xl">
            <div className="flex justify-between items-center border-b border-slate-850 pb-3">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">Initialize Swarm Cluster</h3>
              <button type="button" onClick={() => setInitModalOpen(false)} className="text-slate-500 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3.5 text-xs">
              <div className="space-y-1">
                <label className="text-slate-450 block font-semibold">Listen Address:</label>
                <input
                  type="text"
                  value={initForm.listenAddr}
                  onChange={(e) => setInitForm(prev => ({ ...prev, listenAddr: e.target.value }))}
                  className="w-full bg-slate-950 border border-slate-850 px-3 py-1.5 rounded text-slate-300 focus:outline-none"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-slate-450 block font-semibold">Advertise Address (Optional):</label>
                <input
                  type="text"
                  value={initForm.advertiseAddr}
                  onChange={(e) => setInitForm(prev => ({ ...prev, advertiseAddr: e.target.value }))}
                  placeholder="e.g. 192.168.1.100"
                  className="w-full bg-slate-950 border border-slate-850 px-3 py-1.5 rounded text-slate-300 focus:outline-none"
                />
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="autoLock"
                  checked={initForm.autoLock}
                  onChange={(e) => setInitForm(prev => ({ ...prev, autoLock: e.target.checked }))}
                  className="bg-slate-950 border border-slate-850 text-blue-500 rounded"
                />
                <label htmlFor="autoLock" className="text-slate-300 select-none cursor-pointer">Require manager unlock keys on restart</label>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-850 mt-4">
              <button
                type="button"
                onClick={() => setInitModalOpen(false)}
                className="px-3.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded text-xs font-semibold transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded text-xs font-semibold shadow-md shadow-blue-500/20 transition"
              >
                Initialize
              </button>
            </div>
          </form>
        </div>
      )}

      {/* 2. JOIN CLUSTER MODAL */}
      {isJoinModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <form onSubmit={handleJoinSubmit} className="bg-slate-900 border border-slate-800 rounded-lg max-w-md w-full p-6 space-y-4 shadow-xl">
            <div className="flex justify-between items-center border-b border-slate-850 pb-3">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">Join Existing Swarm Cluster</h3>
              <button type="button" onClick={() => setJoinModalOpen(false)} className="text-slate-500 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3.5 text-xs">
              <div className="space-y-1">
                <label className="text-slate-450 block font-semibold">Remote Manager Address:</label>
                <input
                  type="text"
                  placeholder="e.g. 192.168.1.100:2377"
                  value={joinForm.remoteAddr}
                  onChange={(e) => setJoinForm(prev => ({ ...prev, remoteAddr: e.target.value }))}
                  className="w-full bg-slate-950 border border-slate-850 px-3 py-1.5 rounded text-slate-300 focus:outline-none"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-slate-450 block font-semibold">Join Token:</label>
                <textarea
                  placeholder="SWMTKN-..."
                  value={joinForm.joinToken}
                  onChange={(e) => setJoinForm(prev => ({ ...prev, joinToken: e.target.value }))}
                  className="w-full h-20 bg-slate-950 border border-slate-850 px-3 py-1.5 rounded text-slate-300 font-mono text-[11px] focus:outline-none"
                  required
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-850 mt-4">
              <button
                type="button"
                onClick={() => setJoinModalOpen(false)}
                className="px-3.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded text-xs font-semibold transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded text-xs font-semibold shadow-md shadow-blue-500/20 transition"
              >
                Join Cluster
              </button>
            </div>
          </form>
        </div>
      )}

      {/* 3. ROTATE TOKENS MODAL */}
      {isRotateModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-lg max-w-md w-full p-6 space-y-4 shadow-xl">
            <div className="flex justify-between items-center border-b border-slate-850 pb-3">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">Rotate Join Tokens</h3>
              <button type="button" onClick={() => setRotateModalOpen(false)} className="text-slate-500 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>
            <p className="text-xs text-slate-400">
              Rotating tokens will invalidate previous tokens. Old joining scripts will no longer work. Choose which role to rotate:
            </p>
            <div className="flex gap-3 justify-center py-2">
              <button
                onClick={async () => {
                  try {
                    const res = await mutations.rotateTokens('worker');
                    setActiveOperationId(res.operationId);
                    setRotateModalOpen(false);
                  } catch (err: any) {
                    alert(err.message);
                  }
                }}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-750 text-slate-200 font-semibold text-xs rounded transition"
              >
                Rotate Worker Token
              </button>
              <button
                onClick={async () => {
                  try {
                    const res = await mutations.rotateTokens('manager');
                    setActiveOperationId(res.operationId);
                    setRotateModalOpen(false);
                  } catch (err: any) {
                    alert(err.message);
                  }
                }}
                className="px-4 py-2 bg-blue-650 hover:bg-blue-600 text-white font-semibold text-xs rounded transition"
              >
                Rotate Manager Token
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 4. UPDATE SPEC MODAL */}
      {isUpdateModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <form onSubmit={handleUpdateSpecSubmit} className="bg-slate-900 border border-slate-800 rounded-lg max-w-md w-full p-6 space-y-4 shadow-xl">
            <div className="flex justify-between items-center border-b border-slate-850 pb-3">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">Update Swarm Specifications</h3>
              <button type="button" onClick={() => setUpdateModalOpen(false)} className="text-slate-500 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3.5 text-xs">
              <div className="space-y-1">
                <label className="text-slate-450 block font-semibold">Cluster Name:</label>
                <input
                  type="text"
                  value={updateSpecForm.name}
                  onChange={(e) => setUpdateSpecForm(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full bg-slate-950 border border-slate-850 px-3 py-1.5 rounded text-slate-300 focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-slate-450 block font-semibold">Task History Retention Limit:</label>
                <input
                  type="number"
                  value={updateSpecForm.taskRetentionLimit}
                  onChange={(e) => setUpdateSpecForm(prev => ({ ...prev, taskRetentionLimit: parseInt(e.target.value) || 5 }))}
                  className="w-full bg-slate-950 border border-slate-850 px-3 py-1.5 rounded text-slate-300 focus:outline-none"
                />
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="specAutoLock"
                  checked={updateSpecForm.autoLock}
                  onChange={(e) => setUpdateSpecForm(prev => ({ ...prev, autoLock: e.target.checked }))}
                  className="bg-slate-950 border border-slate-850 text-blue-500 rounded"
                />
                <label htmlFor="specAutoLock" className="text-slate-300 select-none cursor-pointer">Auto-lock Managers on startup</label>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-850 mt-4">
              <button
                type="button"
                onClick={() => setUpdateModalOpen(false)}
                className="px-3.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded text-xs font-semibold transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded text-xs font-semibold shadow-md shadow-blue-500/20 transition"
              >
                Save Changes
              </button>
            </div>
          </form>
        </div>
      )}

      {/* 5. LEAVE CLUSTER MODAL */}
      {isLeaveModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <form onSubmit={handleLeaveSubmit} className="bg-slate-900 border border-slate-800 rounded-lg max-w-md w-full p-6 space-y-4 shadow-xl">
            <div className="flex justify-between items-center border-b border-slate-850 pb-3">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider text-red-500 flex items-center gap-1.5">
                <AlertTriangle className="w-5 h-5 text-red-500" />
                Leave Swarm Cluster
              </h3>
              <button type="button" onClick={() => setLeaveModalOpen(false)} className="text-slate-500 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              Are you sure you want to leave the cluster? If this node is a manager, it will lose quorum. Workers will stop executing scheduled tasks.
            </p>

            <div className="flex items-center gap-2 text-xs">
              <input
                type="checkbox"
                id="leaveForce"
                checked={leaveForm.force}
                onChange={(e) => setLeaveForm(prev => ({ ...prev, force: e.target.checked }))}
                className="bg-slate-950 border border-slate-850 text-blue-500 rounded"
              />
              <label htmlFor="leaveForce" className="text-slate-300 select-none cursor-pointer">Force leave (required for managers)</label>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-850 mt-4">
              <button
                type="button"
                onClick={() => setLeaveModalOpen(false)}
                className="px-3.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded text-xs font-semibold transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-3.5 py-1.5 bg-red-600 hover:bg-red-500 text-white rounded text-xs font-semibold shadow-md shadow-red-500/20 transition"
              >
                Confirm Leave
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}

export default SwarmDashboard;
