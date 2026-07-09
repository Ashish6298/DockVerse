import React, { useState } from 'react';
import {
  ShieldAlert,
  Plus,
  Trash2,
  RefreshCcw,
  X,
  Lock,
  Skull,
  Flame,
  CheckCircle2,
  BookOpen
} from 'lucide-react';
import {
  usePoliciesDashboard,
  usePoliciesList,
  usePolicyFindings,
  usePolicySchedules,
  usePolicyOperations,
  usePolicyOperation,
  usePolicyMutations
} from '../hooks/usePolicies';
import { usePolicyStore } from '../store/policyStore';

export function PolicyDashboard() {
  const {
    activeTab,
    selectedPolicyId,
    selectedFindingId,
    activeOperationId,
    isCreateModalOpen,
    isScheduleModalOpen,
    setActiveTab,
    setSelectedPolicyId,
    setSelectedFindingId,
    setActiveOperationId,
    setCreateModalOpen,
    setScheduleModalOpen
  } = usePolicyStore();

  const dashboardQuery = usePoliciesDashboard();
  const policiesQuery = usePoliciesList();
  const findingsQuery = usePolicyFindings();
  const schedulesQuery = usePolicySchedules();
  const operationsQuery = usePolicyOperations();
  const activeOpQuery = usePolicyOperation(activeOperationId || '');

  const mutations = usePolicyMutations();


  // Selected policy or finding details
  const selectedPolicy = policiesQuery.data?.find(p => p.id === selectedPolicyId);
  const selectedFinding = findingsQuery.data?.find(f => f.id === selectedFindingId);

  // Form states
  const [policyForm, setPolicyForm] = useState({
    name: '',
    description: '',
    severity: 'critical' as 'critical' | 'high' | 'medium' | 'low',
    category: 'hardening',
    targetResourceType: 'container' as 'container' | 'image' | 'network' | 'volume' | 'stack' | 'secret' | 'config' | 'system',
    enabled: true
  });

  const [scheduleForm, setScheduleForm] = useState({
    name: '',
    cronExpression: '0 0 * * *',
    target: 'all' as 'all' | 'containers' | 'images' | 'system'
  });

  const [justification, setJustification] = useState('');

  const handlePolicySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!policyForm.name || !policyForm.description) return;
    try {
      await mutations.createPolicy(policyForm);
      setCreateModalOpen(false);
      setPolicyForm({
        name: '',
        description: '',
        severity: 'critical',
        category: 'hardening',
        targetResourceType: 'container',
        enabled: true
      });
    } catch (err: any) {
      alert(err.message || 'Failed to create policy');
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
      alert(err.message || 'Failed to create schedule');
    }
  };

  const handleScan = async () => {
    try {
      const res = await mutations.triggerScan();
      setActiveOperationId(res.operationId);
    } catch (err: any) {
      alert(err.message || 'Scan failed to launch');
    }
  };

  const handleAcknowledge = async (id: string) => {
    try {
      await mutations.acknowledgeFinding({ id, justification: justification || undefined });
      setSelectedFindingId(null);
      setJustification('');
    } catch (err: any) {
      alert(err.message || 'Failed to acknowledge');
    }
  };

  const handleIgnore = async (id: string) => {
    try {
      await mutations.ignoreFinding({ id, justification: justification || undefined });
      setSelectedFindingId(null);
      setJustification('');
    } catch (err: any) {
      alert(err.message || 'Failed to ignore finding');
    }
  };

  const handleResolve = async (id: string) => {
    try {
      await mutations.resolveFinding(id);
      setSelectedFindingId(null);
    } catch (err: any) {
      alert(err.message || 'Failed to resolve finding');
    }
  };

  return (
    <div className="space-y-6">
      {/* Title Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-800 pb-4">
        <div>
          <h1 className="text-xl font-bold flex items-center gap-2 text-white">
            <ShieldAlert className="w-6 h-6 text-red-500" />
            Enterprise Policy & Compliance Center
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Enforce governance criteria, run security posture evaluations, and manage compliance audits across the swarm.
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
            onClick={handleScan}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-red-650 hover:bg-red-600 text-white rounded text-xs font-semibold shadow-md shadow-red-550/20 transition"
          >
            <Flame className="w-3.5 h-3.5" />
            Run Compliance Scan
          </button>
          <button
            onClick={() => setCreateModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded text-xs font-semibold transition"
          >
            <Plus className="w-3.5 h-3.5" />
            Add Policy
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

      {/* Summary Dashboard Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-slate-900 border border-slate-800 p-5 rounded-lg flex items-center justify-between shadow-sm">
          <div>
            <span className="text-[10px] text-slate-550 font-bold uppercase tracking-wider">Compliance Score</span>
            <h3 className="text-xl font-extrabold mt-1 text-emerald-500">{dashboardQuery.data?.compliancePercentage || 0}%</h3>
          </div>
          <div className="p-3 bg-emerald-500/10 text-emerald-500 rounded-lg"><CheckCircle2 className="w-5 h-5" /></div>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-5 rounded-lg flex items-center justify-between shadow-sm">
          <div>
            <span className="text-[10px] text-slate-550 font-bold uppercase tracking-wider">Total Policies</span>
            <h3 className="text-xl font-extrabold mt-1 text-white">{dashboardQuery.data?.totalPolicies || 0}</h3>
          </div>
          <div className="p-3 bg-blue-500/10 text-blue-400 rounded-lg"><BookOpen className="w-5 h-5" /></div>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-5 rounded-lg flex items-center justify-between shadow-sm">
          <div>
            <span className="text-[10px] text-slate-550 font-bold uppercase tracking-wider">Active Violations</span>
            <h3 className="text-xl font-extrabold mt-1 text-red-500">{dashboardQuery.data?.totalViolations || 0}</h3>
          </div>
          <div className="p-3 bg-red-500/10 text-red-500 rounded-lg"><Skull className="w-5 h-5" /></div>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-5 rounded-lg flex items-center justify-between shadow-sm">
          <div>
            <span className="text-[10px] text-slate-550 font-bold uppercase tracking-wider">Critical Checks Failed</span>
            <h3 className="text-xl font-extrabold mt-1 text-orange-500">{dashboardQuery.data?.criticalFindings || 0}</h3>
          </div>
          <div className="p-3 bg-orange-500/10 text-orange-500 rounded-lg"><Lock className="w-5 h-5" /></div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex border-b border-slate-800 gap-1">
        <button
          onClick={() => { setActiveTab('dashboard'); setSelectedPolicyId(null); setSelectedFindingId(null); }}
          className={`px-4 py-2 text-xs font-semibold border-b-2 transition ${
            activeTab === 'dashboard' ? 'border-red-500 text-red-400 bg-red-500/5' : 'border-transparent text-slate-400 hover:text-slate-350'
          }`}
        >
          Compliance Trend
        </button>
        <button
          onClick={() => { setActiveTab('policies'); setSelectedPolicyId(null); setSelectedFindingId(null); }}
          className={`px-4 py-2 text-xs font-semibold border-b-2 transition ${
            activeTab === 'policies' ? 'border-red-500 text-red-400 bg-red-500/5' : 'border-transparent text-slate-400 hover:text-slate-350'
          }`}
        >
          Governance Policies ({policiesQuery.data?.length || 0})
        </button>
        <button
          onClick={() => { setActiveTab('findings'); setSelectedPolicyId(null); setSelectedFindingId(null); }}
          className={`px-4 py-2 text-xs font-semibold border-b-2 transition ${
            activeTab === 'findings' ? 'border-red-500 text-red-400 bg-red-500/5' : 'border-transparent text-slate-400 hover:text-slate-350'
          }`}
        >
          Active Findings ({findingsQuery.data?.length || 0})
        </button>
        <button
          onClick={() => { setActiveTab('schedules'); setSelectedPolicyId(null); setSelectedFindingId(null); }}
          className={`px-4 py-2 text-xs font-semibold border-b-2 transition ${
            activeTab === 'schedules' ? 'border-red-500 text-red-400 bg-red-500/5' : 'border-transparent text-slate-400 hover:text-slate-350'
          }`}
        >
          Scan Schedules ({schedulesQuery.data?.length || 0})
        </button>
        <button
          onClick={() => { setActiveTab('history'); setSelectedPolicyId(null); setSelectedFindingId(null); }}
          className={`px-4 py-2 text-xs font-semibold border-b-2 transition ${
            activeTab === 'history' ? 'border-red-500 text-red-400 bg-red-500/5' : 'border-transparent text-slate-400 hover:text-slate-350'
          }`}
        >
          Operation logs
        </button>
      </div>

      {/* DASHBOARD TAB VIEW */}
      {activeTab === 'dashboard' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-slate-900 border border-slate-800 p-5 rounded-lg space-y-4 shadow-sm">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Swarm Governance Compliance Curve</h3>
            <div className="h-44 flex items-center justify-center">
              <svg viewBox="0 0 100 30" className="w-full h-full text-emerald-500 stroke-current stroke-2 fill-none">
                <path d="M0,25 Q15,22 30,18 T60,10 T90,3" />
                <circle cx="90" cy="3" r="1.5" className="fill-emerald-500" />
              </svg>
            </div>
            <div className="flex justify-between text-[10px] font-mono text-slate-550">
              <span>May</span>
              <span>June</span>
              <span>July (Latest Score: {dashboardQuery.data?.compliancePercentage || 0}%)</span>
            </div>
          </div>

          <div className="bg-slate-900 border border-slate-800 p-5 rounded-lg space-y-4 shadow-sm">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Predefined Policy Violations Status</h3>
            <div className="h-44 flex items-center justify-center">
              <svg viewBox="0 0 100 30" className="w-full h-full text-red-500 stroke-current stroke-2 fill-none">
                <path d="M0,5 Q15,10 30,12 T60,18 T90,26" />
                <circle cx="90" cy="26" r="1.5" className="fill-red-500" />
              </svg>
            </div>
            <div className="flex justify-between text-[10px] font-mono text-slate-550">
              <span>May</span>
              <span>June</span>
              <span>July (Violations: {dashboardQuery.data?.totalViolations || 0})</span>
            </div>
          </div>
        </div>
      )}

      {/* POLICIES TAB VIEW */}
      {activeTab === 'policies' && (
        <div className="space-y-6">
          <div className="bg-slate-900 border border-slate-800 rounded-lg overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-left text-xs">
                <thead>
                  <tr className="bg-slate-950 border-b border-slate-800 text-[10px] uppercase font-bold text-slate-500 tracking-wider font-mono">
                    <th className="px-4 py-3">Policy ID</th>
                    <th className="px-4 py-3">Severity</th>
                    <th className="px-4 py-3">Resource Target</th>
                    <th className="px-4 py-3">Policy Name</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-850 text-slate-300 font-mono text-[11px]">
                  {policiesQuery.data?.map((pol) => (
                    <tr
                      key={pol.id}
                      onClick={() => setSelectedPolicyId(pol.id)}
                      className={`hover:bg-slate-800/40 cursor-pointer transition ${
                        selectedPolicyId === pol.id ? 'bg-red-500/5' : ''
                      }`}
                    >
                      <td className="px-4 py-3.5 font-bold text-white">{pol.id}</td>
                      <td className="px-4 py-3.5">
                        <span className={`inline-flex px-1.5 py-0.5 rounded text-[10px] font-bold uppercase ${
                          pol.severity === 'critical' ? 'bg-red-950 text-red-500' :
                          pol.severity === 'high' ? 'bg-orange-950 text-orange-450' : 'bg-slate-800 text-slate-400'
                        }`}>
                          {pol.severity}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 capitalize">{pol.targetResourceType}</td>
                      <td className="px-4 py-3.5 text-slate-200">{pol.name}</td>
                      <td className="px-4 py-3.5">
                        <span className={`inline-flex px-1.5 py-0.5 rounded text-[10px] font-bold uppercase ${
                          pol.enabled ? 'bg-emerald-950 text-emerald-450' : 'bg-slate-850 text-slate-500'
                        }`}>
                          {pol.enabled ? 'Enabled' : 'Disabled'}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 text-right" onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={() => mutations.deletePolicy(pol.id)}
                          className="p-1 hover:bg-slate-800 rounded text-slate-405 hover:text-red-500 transition"
                          title="Delete Policy"
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

          {selectedPolicyId && selectedPolicy && (
            <div className="bg-slate-900 border border-slate-850 rounded-lg p-6 space-y-4 shadow-lg text-xs text-slate-350">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider border-b border-slate-850 pb-2">
                Policy Audit Details
              </h3>
              <p><span className="text-slate-500 font-bold block mb-1">Description:</span>{selectedPolicy.description}</p>
              <div className="flex gap-6">
                <p><span className="text-slate-500 font-bold">Category:</span> <span className="capitalize">{selectedPolicy.category}</span></p>
                <p><span className="text-slate-500 font-bold">Version:</span> {selectedPolicy.version}</p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* COMPLIANCE FINDINGS TAB VIEW */}
      {activeTab === 'findings' && (
        <div className="space-y-6">
          <div className="bg-slate-900 border border-slate-800 rounded-lg overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-left text-xs">
                <thead>
                  <tr className="bg-slate-950 border-b border-slate-800 text-[10px] uppercase font-bold text-slate-500 tracking-wider font-mono">
                    <th className="px-4 py-3">Finding ID</th>
                    <th className="px-4 py-3">Severity</th>
                    <th className="px-4 py-3">Target Resource</th>
                    <th className="px-4 py-3">Policy ID</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-850 text-slate-300 font-mono text-[11px]">
                  {findingsQuery.data?.map((fd) => (
                    <tr
                      key={fd.id}
                      onClick={() => setSelectedFindingId(fd.id)}
                      className={`hover:bg-slate-800/40 cursor-pointer transition ${
                        selectedFindingId === fd.id ? 'bg-red-500/5' : ''
                      }`}
                    >
                      <td className="px-4 py-3.5 font-bold text-white">{fd.id}</td>
                      <td className="px-4 py-3.5">
                        <span className={`inline-flex px-1.5 py-0.5 rounded text-[10px] font-bold uppercase ${
                          fd.severity === 'critical' ? 'bg-red-950 text-red-500' :
                          fd.severity === 'high' ? 'bg-orange-950 text-orange-450' : 'bg-slate-850 text-slate-400'
                        }`}>
                          {fd.severity}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 capitalize">{fd.targetResourceType} / {fd.targetResourceId}</td>
                      <td className="px-4 py-3.5">{fd.policyId}</td>
                      <td className="px-4 py-3.5 capitalize">
                        <span className={`inline-flex px-1.5 py-0.5 rounded text-[10px] font-bold uppercase ${
                          fd.status === 'active' ? 'bg-red-950 text-red-450' :
                          fd.status === 'acknowledged' ? 'bg-yellow-950 text-yellow-450' :
                          'bg-slate-800 text-slate-400'
                        }`}>
                          {fd.status}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 text-right" onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={() => handleResolve(fd.id)}
                          className="p-1 hover:bg-slate-800 rounded text-slate-405 hover:text-emerald-500 transition"
                          title="Mark Resolved"
                        >
                          <CheckCircle2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {selectedFindingId && selectedFinding && (
            <div className="bg-slate-900 border border-slate-850 rounded-lg p-6 space-y-4 shadow-lg text-xs text-slate-350">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider border-b border-slate-850 pb-2">
                Compliance Remediation Inspector
              </h3>
              <p><span className="text-slate-500 font-bold block mb-1">Recommended Remediation:</span>{selectedFinding.remediation}</p>
              {selectedFinding.justification && (
                <p><span className="text-slate-500 font-bold block mb-1">Justification provided:</span>{selectedFinding.justification}</p>
              )}

              <div className="space-y-2 pt-2 border-t border-slate-850">
                <label className="text-[10px] font-bold text-slate-500 block">JUSTIFICATION TEXT FOR ACKNOWLEDGE/IGNORE:</label>
                <input
                  type="text"
                  placeholder="e.g. Approved temporary exception by SecOps"
                  value={justification}
                  onChange={(e) => setJustification(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-850 px-3 py-1.5 rounded focus:outline-none"
                />
              </div>

              <div className="flex gap-2 justify-end pt-2">
                <button
                  onClick={() => handleAcknowledge(selectedFinding.id)}
                  className="px-3 py-1.5 bg-yellow-600 hover:bg-yellow-500 text-white rounded font-semibold text-xs"
                >
                  Acknowledge Violation
                </button>
                <button
                  onClick={() => handleIgnore(selectedFinding.id)}
                  className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded font-semibold text-xs"
                >
                  Ignore Finding
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* SCAN SCHEDULES TAB VIEW */}
      {activeTab === 'schedules' && (
        <div className="space-y-6">
          <div className="flex justify-end">
            <button
              onClick={() => setScheduleModalOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-red-650 hover:bg-red-600 text-white rounded text-xs font-semibold shadow-md shadow-red-550/20 transition"
            >
              <Plus className="w-3.5 h-3.5" />
              Add compliance Schedule
            </button>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-lg overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-left text-xs">
                <thead>
                  <tr className="bg-slate-950 border-b border-slate-800 text-[10px] uppercase font-bold text-slate-500 tracking-wider font-mono">
                    <th className="px-4 py-3">Schedule Name</th>
                    <th className="px-4 py-3">Cron Expression</th>
                    <th className="px-4 py-3">Audit Target</th>
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
                      <td colSpan={4} className="p-4 text-center text-slate-600 italic">No scheduled compliance scans defined</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
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
                    <td className="px-4 py-3 text-slate-355 truncate max-w-md">
                      {op.error ? <span className="text-red-400 font-semibold">{op.error}</span> : op.logs[op.logs.length - 1]}
                    </td>
                  </tr>
                ))}
                {(operationsQuery.data?.length || 0) === 0 && (
                  <tr>
                    <td colSpan={4} className="p-4 text-center text-slate-655 italic">No compliance operations recorded</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* CREATE POLICY MODAL */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <form onSubmit={handlePolicySubmit} className="bg-slate-900 border border-slate-800 rounded-lg max-w-md w-full p-6 space-y-4 shadow-xl">
            <div className="flex justify-between items-center border-b border-slate-850 pb-3">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">Create Governance Policy</h3>
              <button type="button" onClick={() => setCreateModalOpen(false)} className="text-slate-500 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="space-y-3.5 text-xs text-slate-300">
              <div className="space-y-1">
                <label className="text-slate-455 block font-semibold">Policy Name:</label>
                <input
                  type="text"
                  placeholder="e.g. Block execution of latest tags"
                  value={policyForm.name}
                  onChange={(e) => setPolicyForm(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full bg-slate-950 border border-slate-850 px-3 py-1.5 rounded text-slate-300 focus:outline-none"
                  required
                />
              </div>
              <div className="space-y-1">
                <label className="text-slate-455 block font-semibold">Description:</label>
                <textarea
                  placeholder="Summarize governance constraint rules..."
                  value={policyForm.description}
                  onChange={(e) => setPolicyForm(prev => ({ ...prev, description: e.target.value }))}
                  className="w-full bg-slate-950 border border-slate-850 px-3 py-1.5 rounded text-slate-300 focus:outline-none h-16 resize-none"
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-slate-455 block font-semibold">Severity:</label>
                  <select
                    value={policyForm.severity}
                    onChange={(e) => setPolicyForm(prev => ({ ...prev, severity: e.target.value as any }))}
                    className="w-full bg-slate-950 border border-slate-850 px-3 py-1.5 rounded text-slate-300 focus:outline-none font-mono"
                  >
                    <option value="critical">Critical</option>
                    <option value="high">High</option>
                    <option value="medium">Medium</option>
                    <option value="low">Low</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-slate-455 block font-semibold">Target Type:</label>
                  <select
                    value={policyForm.targetResourceType}
                    onChange={(e) => setPolicyForm(prev => ({ ...prev, targetResourceType: e.target.value as any }))}
                    className="w-full bg-slate-950 border border-slate-850 px-3 py-1.5 rounded text-slate-300 focus:outline-none font-mono"
                  >
                    <option value="container">Container</option>
                    <option value="image">Image</option>
                    <option value="network">Network</option>
                    <option value="volume">Volume</option>
                  </select>
                </div>
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
                className="px-3.5 py-1.5 bg-red-600 hover:bg-red-500 text-white rounded text-xs font-semibold shadow-md shadow-red-500/20 transition"
              >
                Create Policy
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
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">Create Scan Schedule</h3>
              <button type="button" onClick={() => setScheduleModalOpen(false)} className="text-slate-500 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="space-y-3.5 text-xs text-slate-300">
              <div className="space-y-1">
                <label className="text-slate-455 block font-semibold">Schedule Name:</label>
                <input
                  type="text"
                  placeholder="e.g. Daily Compliance Audit"
                  value={scheduleForm.name}
                  onChange={(e) => setScheduleForm(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full bg-slate-950 border border-slate-850 px-3 py-1.5 rounded text-slate-300 focus:outline-none"
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
                <label className="text-slate-455 block font-semibold">Pruning Target:</label>
                <select
                  value={scheduleForm.target}
                  onChange={(e) => setScheduleForm(prev => ({ ...prev, target: e.target.value as any }))}
                  className="w-full bg-slate-950 border border-slate-850 px-3 py-1.5 rounded text-slate-300 focus:outline-none font-mono"
                >
                  <option value="all">Audit All Resources</option>
                  <option value="containers">Audit Container Runtimes only</option>
                  <option value="images">Audit static image templates only</option>
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

export default PolicyDashboard;
