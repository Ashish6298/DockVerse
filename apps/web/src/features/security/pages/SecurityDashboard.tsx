import React, { useState } from 'react';
import {
  Shield,
  Trash2,
  Clock,
  RefreshCcw,
  Search,
  X,
  Info,
  Layers,
  Lock,
  Skull,
  EyeOff,
  Flame,
  Wrench,
  CheckCircle2
} from 'lucide-react';
import {
  useSecurityDashboard,
  useSecurityFindings,
  useSecuritySchedules,
  useSecurityOperations,
  useSecurityOperation,
  useSecurityMutations
} from '../hooks/useSecurity';
import { useSecurityStore } from '../store/securityStore';

export function SecurityDashboard() {
  const {
    activeTab,
    selectedFindingId,
    activeOperationId,
    isScanModalOpen,
    isScheduleModalOpen,
    setActiveTab,
    setSelectedFindingId,
    setActiveOperationId,
    setScanModalOpen,
    setScheduleModalOpen
  } = useSecurityStore();

  const dashboardQuery = useSecurityDashboard();
  const findingsQuery = useSecurityFindings();
  const schedulesQuery = useSecuritySchedules();
  const operationsQuery = useSecurityOperations();
  const activeOpQuery = useSecurityOperation(activeOperationId || '');

  const mutations = useSecurityMutations();

  // Search/Filters
  const [searchTerm, setSearchTerm] = useState('');

  // Selected finding details
  const selectedFinding = findingsQuery.data?.find(f => f.id === selectedFindingId);

  // Form states
  const [scanForm, setScanForm] = useState({
    targetType: 'container' as 'container' | 'image' | 'system',
    targetId: '',
    category: 'vulnerability' as 'vulnerability' | 'compliance' | 'hardening'
  });
  const [scheduleForm, setScheduleForm] = useState({
    name: '',
    cronExpression: '0 0 * * *',
    target: 'all' as 'all' | 'containers' | 'images' | 'compliance'
  });

  const handleScanSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!scanForm.targetId) return;
    try {
      const res = await mutations.triggerScan({
        targetType: scanForm.targetType,
        targetId: scanForm.targetId.trim(),
        category: scanForm.category
      });
      setActiveOperationId(res.operationId);
      setScanModalOpen(false);
      setScanForm({ targetType: 'container', targetId: '', category: 'vulnerability' });
    } catch (err: any) {
      alert(err.message || 'Audit scan failed to launch');
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
        enabled: true
      });
      setScheduleModalOpen(false);
      setScheduleForm({ name: '', cronExpression: '0 0 * * *', target: 'all' });
    } catch (err: any) {
      alert(err.message || 'Failed to create scan schedule');
    }
  };

  const handleIgnoreFinding = async (id: string) => {
    try {
      await mutations.ignoreFinding(id);
      setSelectedFindingId(null);
    } catch (err: any) {
      alert(err.message || 'Failed to ignore finding');
    }
  };

  return (
    <div className="space-y-6">
      {/* Title Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-800 pb-4">
        <div>
          <h1 className="text-xl font-bold flex items-center gap-2 text-white">
            <Shield className="w-6 h-6 text-red-500" />
            Security & Compliance Center
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Audit runtime containers, verify package vulnerabilities, and validate host configuration benchmarks.
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
            onClick={() => setScanModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-red-650 hover:bg-red-600 text-white rounded text-xs font-semibold shadow-md shadow-red-550/20 transition"
          >
            <Flame className="w-3.5 h-3.5" />
            Run Security Audit
          </button>
          <button
            onClick={() => setScheduleModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded text-xs font-semibold transition"
          >
            <Clock className="w-3.5 h-3.5" />
            Schedule Scan
          </button>
        </div>
      </div>

      {/* Active Polling Operation Status */}
      {activeOperationId && activeOpQuery.data && (
        <div className="bg-slate-900 border border-red-500/20 rounded-lg p-4 shadow-xl">
          <div className="flex justify-between items-start">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse"></span>
              <h4 className="text-xs font-semibold text-white">
                Active Operation: <span className="text-red-400">{activeOpQuery.data.action}</span>
              </h4>
            </div>
            <button onClick={() => setActiveOperationId(null)} className="text-slate-500 hover:text-white">
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="mt-3 flex items-center gap-4">
            <div className="flex-1 bg-slate-800 rounded-full h-2 overflow-hidden">
              <div
                className="bg-red-500 h-full rounded-full transition-all duration-500"
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

      {/* Overview Dashboard Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-slate-900 border border-slate-800 p-5 rounded-lg flex items-center justify-between shadow-sm">
          <div>
            <span className="text-[10px] text-slate-550 font-bold uppercase tracking-wider">Compliance Score</span>
            <h3 className="text-xl font-extrabold mt-1 text-emerald-500">{dashboardQuery.data?.complianceScore || 0}%</h3>
          </div>
          <div className="p-3 bg-emerald-500/10 text-emerald-500 rounded-lg"><CheckCircle2 className="w-5 h-5" /></div>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-5 rounded-lg flex items-center justify-between shadow-sm">
          <div>
            <span className="text-[10px] text-slate-550 font-bold uppercase tracking-wider">Critical Vulnerabilities</span>
            <h3 className="text-xl font-extrabold mt-1 text-red-500">{dashboardQuery.data?.criticalFindings || 0}</h3>
          </div>
          <div className="p-3 bg-red-500/10 text-red-500 rounded-lg"><Skull className="w-5 h-5" /></div>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-5 rounded-lg flex items-center justify-between shadow-sm">
          <div>
            <span className="text-[10px] text-slate-550 font-bold uppercase tracking-wider">Privileged Containers</span>
            <h3 className="text-xl font-extrabold mt-1 text-orange-500">{dashboardQuery.data?.privilegedContainers || 0}</h3>
          </div>
          <div className="p-3 bg-orange-500/10 text-orange-500 rounded-lg"><Lock className="w-5 h-5" /></div>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-5 rounded-lg flex items-center justify-between shadow-sm">
          <div>
            <span className="text-[10px] text-slate-550 font-bold uppercase tracking-wider">Scanned Images</span>
            <h3 className="text-xl font-extrabold mt-1 text-white">{dashboardQuery.data?.scannedImages || 0}</h3>
          </div>
          <div className="p-3 bg-blue-500/10 text-blue-400 rounded-lg"><Layers className="w-5 h-5" /></div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex border-b border-slate-800 gap-1">
        <button
          onClick={() => { setActiveTab('dashboard'); setSelectedFindingId(null); }}
          className={`px-4 py-2 text-xs font-semibold border-b-2 transition ${
            activeTab === 'dashboard' ? 'border-red-500 text-red-400 bg-red-500/5' : 'border-transparent text-slate-400 hover:text-slate-350'
          }`}
        >
          Overview Charts
        </button>
        <button
          onClick={() => { setActiveTab('findings'); setSelectedFindingId(null); }}
          className={`px-4 py-2 text-xs font-semibold border-b-2 transition ${
            activeTab === 'findings' ? 'border-red-500 text-red-400 bg-red-500/5' : 'border-transparent text-slate-400 hover:text-slate-350'
          }`}
        >
          Security Findings ({findingsQuery.data?.length || 0})
        </button>
        <button
          onClick={() => { setActiveTab('schedules'); setSelectedFindingId(null); }}
          className={`px-4 py-2 text-xs font-semibold border-b-2 transition ${
            activeTab === 'schedules' ? 'border-red-500 text-red-400 bg-red-500/5' : 'border-transparent text-slate-400 hover:text-slate-350'
          }`}
        >
          Scan Schedules ({schedulesQuery.data?.length || 0})
        </button>
        <button
          onClick={() => { setActiveTab('history'); setSelectedFindingId(null); }}
          className={`px-4 py-2 text-xs font-semibold border-b-2 transition ${
            activeTab === 'history' ? 'border-red-500 text-red-400 bg-red-500/5' : 'border-transparent text-slate-400 hover:text-slate-350'
          }`}
        >
          Scan Operation logs
        </button>
      </div>

      {/* OVERVIEW CHARTS TAB */}
      {activeTab === 'dashboard' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* SVG scan metrics line chart */}
          <div className="bg-slate-900 border border-slate-800 p-5 rounded-lg space-y-4 shadow-sm">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Compliance Trend (CIS Benchmark)</h3>
            <div className="h-44 flex items-center justify-center">
              <svg viewBox="0 0 100 30" className="w-full h-full text-emerald-500 stroke-current stroke-2 fill-none">
                <path d="M0,25 Q15,22 30,20 T60,12 T90,5" />
                <circle cx="90" cy="5" r="1.5" className="fill-emerald-500" />
              </svg>
            </div>
            <div className="flex justify-between text-[10px] font-mono text-slate-550">
              <span>May</span>
              <span>June</span>
              <span>July (Latest Score: 82%)</span>
            </div>
          </div>

          <div className="bg-slate-900 border border-slate-800 p-5 rounded-lg space-y-4 shadow-sm">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Resolved CVE Vulnerabilities</h3>
            <div className="h-44 flex items-center justify-center">
              <svg viewBox="0 0 100 30" className="w-full h-full text-red-500 stroke-current stroke-2 fill-none">
                <path d="M0,5 Q15,12 30,15 T60,24 T90,28" />
                <circle cx="90" cy="28" r="1.5" className="fill-red-500" />
              </svg>
            </div>
            <div className="flex justify-between text-[10px] font-mono text-slate-550">
              <span>May</span>
              <span>June</span>
              <span>July (Active CVEs: 4)</span>
            </div>
          </div>
        </div>
      )}

      {/* FINDINGS TAB VIEW */}
      {activeTab === 'findings' && (
        <div className="space-y-6">
          <div className="flex justify-between items-center bg-slate-900 border border-slate-800 p-4 rounded-lg">
            <div className="flex items-center gap-2 w-full sm:max-w-xs bg-slate-950 border border-slate-800 px-3 py-1.5 rounded">
              <Search className="w-4 h-4 text-slate-550 shrink-0" />
              <input
                type="text"
                placeholder="Search findings title or rule ID..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-transparent text-xs text-slate-300 placeholder-slate-650 focus:outline-none"
              />
            </div>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-lg overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-left text-xs">
                <thead>
                  <tr className="bg-slate-950 border-b border-slate-800 text-[10px] uppercase font-bold text-slate-500 tracking-wider font-mono">
                    <th className="px-4 py-3">Rule ID</th>
                    <th className="px-4 py-3">Severity</th>
                    <th className="px-4 py-3">Category</th>
                    <th className="px-4 py-3">Title / Description</th>
                    <th className="px-4 py-3">Target ID</th>
                    <th className="px-4 py-3 text-right">Ignore</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-850 text-slate-300">
                  {findingsQuery.data
                    ?.filter(f => f.title.toLowerCase().includes(searchTerm.toLowerCase()) || f.ruleId.toLowerCase().includes(searchTerm.toLowerCase()))
                    .map((fd) => (
                      <tr
                        key={fd.id}
                        onClick={() => setSelectedFindingId(fd.id)}
                        className={`hover:bg-slate-800/40 cursor-pointer transition ${
                          selectedFindingId === fd.id ? 'bg-red-500/5' : ''
                        }`}
                      >
                        <td className="px-4 py-3.5 font-mono text-[11px] font-bold text-white">{fd.ruleId}</td>
                        <td className="px-4 py-3.5">
                          <span className={`inline-flex px-1.5 py-0.5 rounded text-[10px] font-bold uppercase ${
                            fd.severity === 'critical' ? 'bg-red-950 text-red-500' :
                            fd.severity === 'high' ? 'bg-orange-950 text-orange-450' :
                            fd.severity === 'medium' ? 'bg-yellow-950 text-yellow-450' : 'bg-slate-800 text-slate-400'
                          }`}>
                            {fd.severity}
                          </span>
                        </td>
                        <td className="px-4 py-3.5 capitalize font-mono text-[11px] text-slate-400">{fd.category}</td>
                        <td className="px-4 py-3.5 max-w-sm truncate">
                          <div className="font-bold text-slate-200">{fd.title}</div>
                          <div className="text-[10px] text-slate-500 truncate">{fd.description}</div>
                        </td>
                        <td className="px-4 py-3.5 font-mono text-[11px] text-slate-400">{fd.targetId}</td>
                        <td className="px-4 py-3.5 text-right font-mono" onClick={(e) => e.stopPropagation()}>
                          <button
                            onClick={() => handleIgnoreFinding(fd.id)}
                            className="p-1 hover:bg-slate-800 rounded text-slate-400 hover:text-slate-300 transition"
                            title="Ignore Finding"
                          >
                            <EyeOff className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Finding Details Drawer */}
          {selectedFindingId && selectedFinding && (
            <div className="bg-slate-900 border border-slate-850 rounded-lg p-6 space-y-5 shadow-lg text-xs leading-relaxed text-slate-300">
              <div className="flex justify-between items-center border-b border-slate-850 pb-3">
                <div>
                  <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                    <Info className="w-4 h-4 text-red-500" />
                    Finding Audit Inspector: {selectedFinding.ruleId}
                  </h3>
                  <span className="text-[10px] text-slate-550 font-mono block mt-0.5">{selectedFinding.title}</span>
                </div>
                <button onClick={() => setSelectedFindingId(null)} className="text-slate-500 hover:text-white">
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Finding expected vs actual configs */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 font-mono text-[10px] text-slate-350">
                <div className="bg-slate-950 border border-slate-850 p-3 rounded">
                  <span className="block text-slate-500 font-bold mb-1 uppercase tracking-wider">Expected State Configuration</span>
                  <span className="text-emerald-500 font-semibold">{selectedFinding.expected || 'Correct configuration constraint'}</span>
                </div>
                <div className="bg-slate-950 border border-slate-850 p-3 rounded">
                  <span className="block text-slate-500 font-bold mb-1 uppercase tracking-wider">Actual State Found</span>
                  <span className="text-red-400 font-semibold">{selectedFinding.actual || 'Configuration violation'}</span>
                </div>
              </div>

              {/* Remediation guidance panel */}
              <div className="bg-slate-950 border border-slate-850 p-4 rounded space-y-2">
                <h4 className="font-bold text-[10px] text-slate-550 uppercase tracking-wider flex items-center gap-1.5">
                  <Wrench className="w-3.5 h-3.5 text-blue-500" /> Remediation Guidance Plan
                </h4>
                <p className="text-slate-300 text-xs">{selectedFinding.remediation}</p>
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
                  <th className="px-4 py-3">Target Scope</th>
                  <th className="px-4 py-3 text-right">Delete</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-850 text-slate-300 font-mono text-[11px]">
                {schedulesQuery.data?.map((sch) => (
                  <tr key={sch.id} className="hover:bg-slate-800/40 transition">
                    <td className="px-4 py-3.5 font-bold text-white">{sch.name}</td>
                    <td className="px-4 py-3.5 text-slate-200">{sch.cronExpression}</td>
                    <td className="px-4 py-3.5 capitalize">{sch.target}</td>
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
                    <td colSpan={4} className="p-4 text-center text-slate-600 italic">No scheduled security audit jobs defined</td>
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

      {/* RUN SCAN MODAL */}
      {isScanModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <form onSubmit={handleScanSubmit} className="bg-slate-900 border border-slate-800 rounded-lg max-w-md w-full p-6 space-y-4 shadow-xl">
            <div className="flex justify-between items-center border-b border-slate-850 pb-3">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">Run Security Audit Scan</h3>
              <button type="button" onClick={() => setScanModalOpen(false)} className="text-slate-500 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="space-y-3.5 text-xs text-slate-300">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-slate-455 block font-semibold">Target Type:</label>
                  <select
                    value={scanForm.targetType}
                    onChange={(e) => setScanForm(prev => ({ ...prev, targetType: e.target.value as any }))}
                    className="w-full bg-slate-950 border border-slate-850 px-3 py-1.5 rounded text-slate-300 focus:outline-none font-mono"
                  >
                    <option value="container">Container Runtime</option>
                    <option value="image">Image static build</option>
                    <option value="system">Host daemon configurations</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-slate-455 block font-semibold">Audit Category:</label>
                  <select
                    value={scanForm.category}
                    onChange={(e) => setScanForm(prev => ({ ...prev, category: e.target.value as any }))}
                    className="w-full bg-slate-950 border border-slate-850 px-3 py-1.5 rounded text-slate-300 focus:outline-none font-mono"
                  >
                    <option value="vulnerability">CVE Vulnerabilities</option>
                    <option value="compliance">CIS Benchmarks Compliance</option>
                    <option value="hardening">Runtime Hardening options</option>
                  </select>
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-slate-455 block font-semibold">Target ID / Name:</label>
                <input
                  type="text"
                  placeholder="e.g. web-server"
                  value={scanForm.targetId}
                  onChange={(e) => setScanForm(prev => ({ ...prev, targetId: e.target.value }))}
                  className="w-full bg-slate-950 border border-slate-850 px-3 py-1.5 rounded text-slate-300 focus:outline-none font-mono"
                  required
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-2 border-t border-slate-850 mt-4">
              <button
                type="button"
                onClick={() => setScanModalOpen(false)}
                className="px-3.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded text-xs font-semibold transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-3.5 py-1.5 bg-red-600 hover:bg-red-500 text-white rounded text-xs font-semibold shadow-md shadow-red-500/20 transition"
              >
                Launch Audit
              </button>
            </div>
          </form>
        </div>
      )}

      {/* CREATE SCAN SCHEDULE MODAL */}
      {isScheduleModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <form onSubmit={handleScheduleSubmit} className="bg-slate-900 border border-slate-800 rounded-lg max-w-md w-full p-6 space-y-4 shadow-xl">
            <div className="flex justify-between items-center border-b border-slate-850 pb-3">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">Schedule Security Scan</h3>
              <button type="button" onClick={() => setScheduleModalOpen(false)} className="text-slate-500 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="space-y-3.5 text-xs text-slate-300">
              <div className="space-y-1">
                <label className="text-slate-455 block font-semibold">Schedule Name:</label>
                <input
                  type="text"
                  placeholder="e.g. Daily Vulnerability Scan"
                  value={scheduleForm.name}
                  onChange={(e) => setScheduleForm(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full bg-slate-950 border border-slate-850 px-3 py-1.5 rounded text-slate-300 focus:outline-none font-mono"
                  required
                />
              </div>
              <div className="space-y-1">
                <label className="text-slate-455 block font-semibold">Cron Expression:</label>
                <input
                  type="text"
                  placeholder="e.g. 0 0 * * *"
                  value={scheduleForm.cronExpression}
                  onChange={(e) => setScheduleForm(prev => ({ ...prev, cronExpression: e.target.value }))}
                  className="w-full bg-slate-950 border border-slate-850 px-3 py-1.5 rounded text-slate-300 focus:outline-none font-mono"
                  required
                />
              </div>
              <div className="space-y-1">
                <label className="text-slate-455 block font-semibold">Target Scope:</label>
                <select
                  value={scheduleForm.target}
                  onChange={(e) => setScheduleForm(prev => ({ ...prev, target: e.target.value as any }))}
                  className="w-full bg-slate-950 border border-slate-850 px-3 py-1.5 rounded text-slate-300 focus:outline-none font-mono"
                >
                  <option value="all">Scan Complete Host System</option>
                  <option value="containers">Audit Container Runtimes only</option>
                  <option value="images">Audit Image static build templates</option>
                  <option value="compliance">CIS Benchmarks Audit only</option>
                </select>
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-2 border-t border-slate-850 mt-4">
              <button
                type="button"
                onClick={() => setScheduleModalOpen(false)}
                className="px-3.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded text-xs font-semibold transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-3.5 py-1.5 bg-red-650 hover:bg-red-600 text-white rounded text-xs font-semibold shadow-md shadow-red-500/20 transition"
              >
                Create Schedule
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}

export default SecurityDashboard;
