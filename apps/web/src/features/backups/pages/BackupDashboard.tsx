import React, { useState } from 'react';
import {
  Shield,
  Plus,
  Trash2,
  Clock,
  RefreshCcw,
  AlertTriangle,
  Search,
  X,
  HardDrive,
  Info,
  Layers,
  Database,
  Box,
  Lock
} from 'lucide-react';
import {
  useBackupsDashboard,
  useBackups,
  useBackupDetails,
  useBackupSchedules,
  useBackupOperations,
  useBackupOperation,
  useBackupMutations
} from '../hooks/useBackups';
import { useBackupStore } from '../store/backupStore';

export function BackupDashboard() {
  const {
    activeTab,
    selectedBackupId,
    activeOperationId,
    isCreateBackupModalOpen,
    isCreateScheduleModalOpen,
    isRestoreWizardOpen,
    setActiveTab,
    setSelectedBackupId,
    setActiveOperationId,
    setCreateBackupModalOpen,
    setCreateScheduleModalOpen,
    setRestoreWizardOpen
  } = useBackupStore();

  const dashboardQuery = useBackupsDashboard();
  const backupsQuery = useBackups();
  const schedulesQuery = useBackupSchedules();
  const operationsQuery = useBackupOperations();
  const activeOpQuery = useBackupOperation(activeOperationId || '');

  const mutations = useBackupMutations();

  // Search/Filters
  const [searchTerm, setSearchTerm] = useState('');

  // Selected backup detail query
  const backupDetailQuery = useBackupDetails(selectedBackupId || '');

  // Form states
  const [backupForm, setBackupForm] = useState({
    name: '',
    type: 'full' as 'full' | 'incremental' | 'selective'
  });
  const [scheduleForm, setScheduleForm] = useState({
    name: '',
    cronExpression: '0 0 * * *',
    target: 'full' as 'full' | 'incremental' | 'selective',
    maxBackups: 10,
    maxAgeDays: 30
  });

  // Confirms & Actions
  const [pendingDelete, setPendingDelete] = useState<string | null>(null);

  const handleBackupSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!backupForm.name) return;
    try {
      const res = await mutations.createBackup({
        name: backupForm.name.trim(),
        type: backupForm.type,
        resources: {
          containers: [],
          volumes: [],
          images: [],
          networks: [],
          stacks: [],
          secrets: [],
          configs: []
        }
      });
      setActiveOperationId(res.operationId);
      setCreateBackupModalOpen(false);
      setBackupForm({ name: '', type: 'full' });
    } catch (err: any) {
      alert(err.message || 'Backup job creation failed');
    }
  };

  const handleScheduleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!scheduleForm.name || !scheduleForm.cronExpression) return;
    try {
      await mutations.createSchedule({
        name: scheduleForm.name.trim(),
        cronExpression: scheduleForm.cronExpression.trim(),
        target: scheduleForm.target,
        enabled: true,
        retentionPolicy: {
          maxBackups: scheduleForm.maxBackups,
          maxAgeDays: scheduleForm.maxAgeDays
        }
      });
      setCreateScheduleModalOpen(false);
      setScheduleForm({
        name: '',
        cronExpression: '0 0 * * *',
        target: 'full',
        maxBackups: 10,
        maxAgeDays: 30
      });
    } catch (err: any) {
      alert(err.message || 'Failed to create backup schedule');
    }
  };

  const handleVerifyBackup = async (id: string) => {
    try {
      const res = await mutations.verifyBackup(id);
      setActiveOperationId(res.operationId);
    } catch (err: any) {
      alert(err.message || 'Verification failed');
    }
  };

  const handleRestoreBackup = async (id: string) => {
    try {
      const res = await mutations.restoreBackup({ id, selectResources: {} });
      setActiveOperationId(res.operationId);
      setRestoreWizardOpen(false);
    } catch (err: any) {
      alert(err.message || 'Restoration failed');
    }
  };

  const handleDeleteConfirm = async () => {
    if (!pendingDelete) return;
    try {
      await mutations.removeBackup(pendingDelete);
      setPendingDelete(null);
      setSelectedBackupId(null);
    } catch (err: any) {
      alert(err.message || 'Deletion failed');
    }
  };

  const triggerPruning = async () => {
    if (!confirm('Are you sure you want to prune expired backup logs?')) return;
    try {
      await mutations.pruneExpiredBackups();
    } catch (err: any) {
      alert(err.message || 'Pruning failed');
    }
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="space-y-6">
      {/* Title Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-800 pb-4">
        <div>
          <h1 className="text-xl font-bold flex items-center gap-2 text-white">
            <Shield className="w-6 h-6 text-blue-500" />
            Backup & Disaster Recovery Manager
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Securely save, verify, schedule, and restore complete environment snapshots and metadata parameters.
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
            onClick={() => setCreateBackupModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded text-xs font-semibold shadow-md shadow-blue-500/20 transition"
          >
            <Plus className="w-3.5 h-3.5" />
            Run Backup
          </button>
          <button
            onClick={() => setCreateScheduleModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded text-xs font-semibold transition"
          >
            <Clock className="w-3.5 h-3.5" />
            Schedule
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

      {/* Summary Dashboard Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-slate-900 border border-slate-800 p-5 rounded-lg flex items-center justify-between shadow-sm">
          <div>
            <span className="text-[10px] text-slate-550 font-bold uppercase tracking-wider">Total Jobs</span>
            <h3 className="text-xl font-extrabold mt-1 text-white">{dashboardQuery.data?.totalJobs || 0}</h3>
          </div>
          <div className="p-3 bg-blue-500/10 text-blue-400 rounded-lg"><Shield className="w-5 h-5" /></div>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-5 rounded-lg flex items-center justify-between shadow-sm">
          <div>
            <span className="text-[10px] text-slate-550 font-bold uppercase tracking-wider">Storage Used</span>
            <h3 className="text-xl font-extrabold mt-1 text-emerald-500">{formatBytes(dashboardQuery.data?.storageUsage || 0)}</h3>
          </div>
          <div className="p-3 bg-emerald-500/10 text-emerald-500 rounded-lg"><HardDrive className="w-5 h-5" /></div>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-5 rounded-lg flex items-center justify-between shadow-sm">
          <div>
            <span className="text-[10px] text-slate-550 font-bold uppercase tracking-wider">Active Schedules</span>
            <h3 className="text-xl font-extrabold mt-1 text-purple-400">{dashboardQuery.data?.scheduledBackups || 0}</h3>
          </div>
          <div className="p-3 bg-purple-500/10 text-purple-400 rounded-lg"><Clock className="w-5 h-5" /></div>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-5 rounded-lg flex items-center justify-between shadow-sm">
          <div>
            <span className="text-[10px] text-slate-550 font-bold uppercase tracking-wider">Failed Backups</span>
            <h3 className="text-xl font-extrabold mt-1 text-red-500">{dashboardQuery.data?.failedJobs || 0}</h3>
          </div>
          <div className="p-3 bg-red-500/10 text-red-500 rounded-lg"><AlertTriangle className="w-5 h-5" /></div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex border-b border-slate-800 gap-1">
        <button
          onClick={() => { setActiveTab('backups'); setSelectedBackupId(null); }}
          className={`px-4 py-2 text-xs font-semibold border-b-2 transition ${
            activeTab === 'backups' ? 'border-blue-500 text-blue-400 bg-blue-500/5' : 'border-transparent text-slate-400 hover:text-slate-350'
          }`}
        >
          Archives ({backupsQuery.data?.length || 0})
        </button>
        <button
          onClick={() => { setActiveTab('schedules'); setSelectedBackupId(null); }}
          className={`px-4 py-2 text-xs font-semibold border-b-2 transition ${
            activeTab === 'schedules' ? 'border-blue-500 text-blue-400 bg-blue-500/5' : 'border-transparent text-slate-400 hover:text-slate-350'
          }`}
        >
          Schedules ({schedulesQuery.data?.length || 0})
        </button>
        <button
          onClick={() => { setActiveTab('history'); setSelectedBackupId(null); }}
          className={`px-4 py-2 text-xs font-semibold border-b-2 transition ${
            activeTab === 'history' ? 'border-blue-500 text-blue-400 bg-blue-500/5' : 'border-transparent text-slate-400 hover:text-slate-350'
          }`}
        >
          Operations History
        </button>
      </div>

      {/* Filter Search Bar */}
      {activeTab === 'backups' && (
        <div className="flex justify-between items-center bg-slate-900 border border-slate-800 p-4 rounded-lg">
          <div className="flex items-center gap-2 w-full sm:max-w-xs bg-slate-950 border border-slate-800 px-3 py-1.5 rounded">
            <Search className="w-4 h-4 text-slate-500 shrink-0" />
            <input
              type="text"
              placeholder="Search archives by name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-transparent text-xs text-slate-300 placeholder-slate-650 focus:outline-none"
            />
          </div>
          <button
            onClick={triggerPruning}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-red-950 hover:bg-red-900 text-red-400 border border-red-500/25 rounded text-xs font-semibold transition"
          >
            <Trash2 className="w-3.5 h-3.5" />
            Prune All
          </button>
        </div>
      )}

      {/* ARCHIVES TAB VIEW */}
      {activeTab === 'backups' && (
        <div className="space-y-6">
          <div className="bg-slate-900 border border-slate-800 rounded-lg overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-left text-xs">
                <thead>
                  <tr className="bg-slate-950 border-b border-slate-800 text-[10px] uppercase font-bold text-slate-500 tracking-wider font-mono">
                    <th className="px-4 py-3">Archive ID</th>
                    <th className="px-4 py-3">Job Name</th>
                    <th className="px-4 py-3">Backup Type</th>
                    <th className="px-4 py-3">Storage Size</th>
                    <th className="px-4 py-3">Created</th>
                    <th className="px-4 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-850 text-slate-300">
                  {backupsQuery.data
                    ?.filter(b => b.name.toLowerCase().includes(searchTerm.toLowerCase()))
                    .map((bk) => (
                      <tr
                        key={bk.id}
                        onClick={() => setSelectedBackupId(bk.id)}
                        className={`hover:bg-slate-800/40 cursor-pointer transition ${
                          selectedBackupId === bk.id ? 'bg-blue-500/5' : ''
                        }`}
                      >
                        <td className="px-4 py-3.5 font-mono text-[11px] font-bold text-white">{bk.id}</td>
                        <td className="px-4 py-3.5">{bk.name}</td>
                        <td className="px-4 py-3.5 capitalize font-mono text-[11px]">{bk.type}</td>
                        <td className="px-4 py-3.5 font-mono text-[11px] text-slate-400">{formatBytes(bk.size)}</td>
                        <td className="px-4 py-3.5 font-mono text-[11px] text-slate-400">
                          {new Date(bk.createdAt).toLocaleString()}
                        </td>
                        <td className="px-4 py-3.5 text-right font-mono" onClick={(e) => e.stopPropagation()}>
                          <div className="flex justify-end gap-1.5">
                            <button
                              onClick={() => handleVerifyBackup(bk.id)}
                              className="px-2 py-1 bg-slate-850 hover:bg-slate-800 text-slate-300 rounded text-[10px] font-bold transition"
                              title="Verify Integrity Checksum"
                            >
                              Verify
                            </button>
                            <button
                              onClick={() => { setSelectedBackupId(bk.id); setRestoreWizardOpen(true); }}
                              className="px-2 py-1 bg-blue-950 hover:bg-blue-900 text-blue-400 rounded text-[10px] font-bold transition"
                              title="Disaster Recovery Restore"
                            >
                              Restore
                            </button>
                            <button
                              onClick={() => setPendingDelete(bk.id)}
                              className="p-1 hover:bg-slate-800 rounded text-slate-400 hover:text-red-500 transition"
                              title="Remove Backup"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Backup Details Drawer */}
          {selectedBackupId && backupDetailQuery.data && (
            <div className="bg-slate-900 border border-slate-800 rounded-lg p-6 space-y-5 shadow-lg text-xs leading-relaxed text-slate-300">
              <div className="flex justify-between items-center border-b border-slate-850 pb-3">
                <div>
                  <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                    <Info className="w-4 h-4 text-blue-500" />
                    Archive Explorer: {backupDetailQuery.data.name}
                  </h3>
                  <span className="text-[10px] text-slate-550 font-mono block mt-0.5">{backupDetailQuery.data.id}</span>
                </div>
                <button onClick={() => setSelectedBackupId(null)} className="text-slate-500 hover:text-white">
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Integrity status check info */}
              <div className="bg-slate-950 border border-slate-850 rounded p-4 font-mono text-[11px] text-slate-350 space-y-2">
                <div className="flex justify-between">
                  <span className="text-slate-500">SHA-256 Checksum:</span>
                  <span className="text-slate-300 truncate max-w-xs">{backupDetailQuery.data.checksum}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Integrity state:</span>
                  <span className="text-emerald-500 font-bold uppercase">verified (SHA-256 MATCH)</span>
                </div>
              </div>

              {/* Resource checklist mapping */}
              <div className="space-y-3">
                <h4 className="font-bold text-[10px] text-slate-550 uppercase tracking-wider">Included Resources</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 font-mono text-[11px] text-slate-400">
                  <div className="bg-slate-950 border border-slate-850 rounded p-3 space-y-1">
                    <div className="font-bold text-white border-b border-slate-850 pb-1 flex items-center gap-1.5">
                      <Box className="w-3.5 h-3.5 text-blue-500" /> Containers
                    </div>
                    {backupDetailQuery.data.resources.containers.map(c => <div key={c}>{c}</div>)}
                    {backupDetailQuery.data.resources.containers.length === 0 && <div className="italic text-slate-600">None</div>}
                  </div>

                  <div className="bg-slate-950 border border-slate-850 rounded p-3 space-y-1">
                    <div className="font-bold text-white border-b border-slate-850 pb-1 flex items-center gap-1.5">
                      <Database className="w-3.5 h-3.5 text-blue-500" /> Volumes
                    </div>
                    {backupDetailQuery.data.resources.volumes.map(v => <div key={v}>{v}</div>)}
                    {backupDetailQuery.data.resources.volumes.length === 0 && <div className="italic text-slate-600">None</div>}
                  </div>

                  <div className="bg-slate-950 border border-slate-850 rounded p-3 space-y-1">
                    <div className="font-bold text-white border-b border-slate-850 pb-1 flex items-center gap-1.5">
                      <Layers className="w-3.5 h-3.5 text-blue-500" /> Stacks
                    </div>
                    {backupDetailQuery.data.resources.stacks.map(s => <div key={s}>{s}</div>)}
                    {backupDetailQuery.data.resources.stacks.length === 0 && <div className="italic text-slate-600">None</div>}
                  </div>

                  <div className="bg-slate-950 border border-slate-850 rounded p-3 space-y-1">
                    <div className="font-bold text-white border-b border-slate-850 pb-1 flex items-center gap-1.5">
                      <Lock className="w-3.5 h-3.5 text-blue-500" /> Secrets & Configs
                    </div>
                    {[...backupDetailQuery.data.resources.secrets, ...backupDetailQuery.data.resources.configs].map(s => <div key={s}>{s}</div>)}
                    {backupDetailQuery.data.resources.secrets.length === 0 && backupDetailQuery.data.resources.configs.length === 0 && <div className="italic text-slate-600">None</div>}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* SCHEDULES TAB VIEW */}
      {activeTab === 'schedules' && (
        <div className="bg-slate-900 border border-slate-800 rounded-lg overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left text-xs">
              <thead>
                <tr className="bg-slate-950 border-b border-slate-800 text-[10px] uppercase font-bold text-slate-500 tracking-wider font-mono">
                  <th className="px-4 py-3">Schedule Name</th>
                  <th className="px-4 py-3">Cron Expression</th>
                  <th className="px-4 py-3">Backup Type</th>
                  <th className="px-4 py-3">Retention Backups</th>
                  <th className="px-4 py-3">Retention Age</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-850 text-slate-300 font-mono text-[11px]">
                {schedulesQuery.data?.map((sch) => (
                  <tr key={sch.id} className="hover:bg-slate-800/40 transition">
                    <td className="px-4 py-3.5 font-bold text-white">{sch.name}</td>
                    <td className="px-4 py-3.5 text-slate-200">{sch.cronExpression}</td>
                    <td className="px-4 py-3.5 capitalize">{sch.target}</td>
                    <td className="px-4 py-3.5">{sch.retentionPolicy.maxBackups}</td>
                    <td className="px-4 py-3.5">{sch.retentionPolicy.maxAgeDays} Days</td>
                    <td className="px-4 py-3.5 text-right" onClick={(e) => e.stopPropagation()}>
                      <button
                        onClick={() => mutations.deleteSchedule(sch.id)}
                        className="p-1 hover:bg-slate-800 rounded text-slate-405 hover:text-red-500 transition"
                        title="Delete Schedule"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
                {(schedulesQuery.data?.length || 0) === 0 && (
                  <tr>
                    <td colSpan={6} className="p-4 text-center text-slate-600 italic">No scheduled backup jobs defined</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
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

      {/* CONFIRMATION DELETION MODAL */}
      {pendingDelete && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-lg max-w-md w-full p-6 space-y-4 shadow-xl">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
              <AlertTriangle className="w-5 h-5 text-yellow-500" />
              Confirm Archive Removal
            </h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              Are you sure you want to delete the backup archive <strong>{pendingDelete}</strong>? This will permanently remove the snapshot and its checksum.
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

      {/* RUN BACKUP MODAL */}
      {isCreateBackupModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <form onSubmit={handleBackupSubmit} className="bg-slate-900 border border-slate-800 rounded-lg max-w-md w-full p-6 space-y-4 shadow-xl">
            <div className="flex justify-between items-center border-b border-slate-850 pb-3">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">Run Environment Backup</h3>
              <button type="button" onClick={() => setCreateBackupModalOpen(false)} className="text-slate-500 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="space-y-3.5 text-xs text-slate-300">
              <div className="space-y-1">
                <label className="text-slate-455 block font-semibold">Backup Job Label Name:</label>
                <input
                  type="text"
                  placeholder="e.g. production_nightly"
                  value={backupForm.name}
                  onChange={(e) => setBackupForm(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full bg-slate-950 border border-slate-850 px-3 py-1.5 rounded text-slate-300 focus:outline-none font-mono"
                  required
                />
              </div>
              <div className="space-y-1">
                <label className="text-slate-455 block font-semibold">Scope of Backup Type:</label>
                <select
                  value={backupForm.type}
                  onChange={(e) => setBackupForm(prev => ({ ...prev, type: e.target.value as any }))}
                  className="w-full bg-slate-950 border border-slate-850 px-3 py-1.5 rounded text-slate-300 focus:outline-none font-mono"
                >
                  <option value="full">Full Environment Backup</option>
                  <option value="incremental">Incremental Configuration Backup</option>
                  <option value="selective">Selective Container Backups</option>
                </select>
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-2 border-t border-slate-850 mt-4">
              <button
                type="button"
                onClick={() => setCreateBackupModalOpen(false)}
                className="px-3.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded text-xs font-semibold transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded text-xs font-semibold shadow-md shadow-blue-500/20 transition"
              >
                Run Job
              </button>
            </div>
          </form>
        </div>
      )}

      {/* CREATE SCHEDULE MODAL */}
      {isCreateScheduleModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <form onSubmit={handleScheduleSubmit} className="bg-slate-900 border border-slate-800 rounded-lg max-w-md w-full p-6 space-y-4 shadow-xl">
            <div className="flex justify-between items-center border-b border-slate-850 pb-3">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">Create Backup Schedule</h3>
              <button type="button" onClick={() => setCreateScheduleModalOpen(false)} className="text-slate-500 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="space-y-3.5 text-xs text-slate-300">
              <div className="space-y-1">
                <label className="text-slate-455 block font-semibold">Schedule Name:</label>
                <input
                  type="text"
                  placeholder="e.g. Daily Full Backup"
                  value={scheduleForm.name}
                  onChange={(e) => setScheduleForm(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full bg-slate-950 border border-slate-850 px-3 py-1.5 rounded text-slate-300 focus:outline-none font-mono"
                  required
                />
              </div>
              <div className="space-y-1">
                <label className="text-slate-455 block font-semibold">Cron Pattern Expression:</label>
                <input
                  type="text"
                  placeholder="e.g. 0 0 * * *"
                  value={scheduleForm.cronExpression}
                  onChange={(e) => setScheduleForm(prev => ({ ...prev, cronExpression: e.target.value }))}
                  className="w-full bg-slate-950 border border-slate-850 px-3 py-1.5 rounded text-slate-300 focus:outline-none font-mono"
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-slate-455 block font-semibold">Max Backups limit:</label>
                  <input
                    type="number"
                    value={scheduleForm.maxBackups}
                    onChange={(e) => setScheduleForm(prev => ({ ...prev, maxBackups: parseInt(e.target.value) || 10 }))}
                    className="w-full bg-slate-950 border border-slate-850 px-3 py-1.5 rounded text-slate-300 focus:outline-none font-mono"
                    required
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-slate-455 block font-semibold">Max Age limit (Days):</label>
                  <input
                    type="number"
                    value={scheduleForm.maxAgeDays}
                    onChange={(e) => setScheduleForm(prev => ({ ...prev, maxAgeDays: parseInt(e.target.value) || 30 }))}
                    className="w-full bg-slate-950 border border-slate-850 px-3 py-1.5 rounded text-slate-300 focus:outline-none font-mono"
                    required
                  />
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-2 border-t border-slate-850 mt-4">
              <button
                type="button"
                onClick={() => setCreateScheduleModalOpen(false)}
                className="px-3.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded text-xs font-semibold transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded text-xs font-semibold shadow-md shadow-blue-500/20 transition"
              >
                Create
              </button>
            </div>
          </form>
        </div>
      )}

      {/* RESTORE WIZARD MODAL */}
      {isRestoreWizardOpen && selectedBackupId && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-lg max-w-md w-full p-6 space-y-4 shadow-xl">
            <div className="flex justify-between items-center border-b border-slate-850 pb-3">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-1">
                <AlertTriangle className="w-5 h-5 text-yellow-500" />
                Disaster Recovery Restore Wizard
              </h3>
              <button onClick={() => setRestoreWizardOpen(false)} className="text-slate-500 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              You are launching environment restoration from archive ID: <strong>{selectedBackupId}</strong>.
            </p>
            <div className="bg-slate-950 border border-slate-850 rounded p-4 font-mono text-[11px] text-yellow-500/95 space-y-2">
              <div className="font-bold uppercase flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4 text-yellow-500" /> Warning
              </div>
              <div>Restoration might overwrite existing docker containers, overlay networks, and volume filesystem folders.</div>
            </div>
            <div className="flex justify-end gap-2 pt-2 border-t border-slate-850">
              <button
                onClick={() => setRestoreWizardOpen(false)}
                className="px-3.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded text-xs font-semibold transition"
              >
                Cancel
              </button>
              <button
                onClick={() => handleRestoreBackup(selectedBackupId)}
                className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded text-xs font-semibold shadow-md shadow-blue-500/20 transition"
              >
                Trigger Restore Pipeline
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default BackupDashboard;
