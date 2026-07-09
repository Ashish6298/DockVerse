import React, { useState } from 'react';
import {
  Clock,
  Plus,
  Trash2,
  RefreshCcw,
  AlertTriangle,
  Search,
  X,
  Info,
  Download,
  Terminal,
  ShieldAlert,
  SlidersHorizontal,
  CheckCircle2
} from 'lucide-react';
import {
  useEventsDashboard,
  useEventsList,
  useEventSchedules,
  useEventOperations,
  useEventOperation,
  useEventMutations
} from '../hooks/useEvents';
import { useEventStore } from '../store/eventStore';

export function EventDashboard() {
  const {
    activeTab,
    selectedEventId,
    activeOperationId,
    isScheduleModalOpen,
    setActiveTab,
    setSelectedEventId,
    setActiveOperationId,
    setScheduleModalOpen
  } = useEventStore();

  const [severityFilter, setSeverityFilter] = useState<string>('');
  const [typeFilter, setTypeFilter] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState<string>('');

  const dashboardQuery = useEventsDashboard();
  const eventsQuery = useEventsList({
    severity: severityFilter || undefined,
    resourceType: typeFilter || undefined,
    searchTerm: searchTerm || undefined
  });
  const schedulesQuery = useEventSchedules();
  const operationsQuery = useEventOperations();
  const activeOpQuery = useEventOperation(activeOperationId || '');

  const mutations = useEventMutations();

  // Selected event details
  const selectedEvent = eventsQuery.data?.find(e => e.id === selectedEventId);

  // Form states
  const [scheduleForm, setScheduleForm] = useState({
    name: '',
    cronExpression: '0 0 * * *',
    target: 'all' as 'all' | 'containers' | 'images' | 'system'
  });

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

  const handleExport = async (format: 'json' | 'csv') => {
    try {
      const res = await mutations.triggerExport(format);
      setActiveOperationId(res.operationId);
    } catch (err: any) {
      alert(err.message || 'Export failed');
    }
  };

  const handlePruning = async () => {
    try {
      const res = await mutations.triggerMaintenance();
      setActiveOperationId(res.operationId);
    } catch (err: any) {
      alert(err.message || 'Maintenance failed');
    }
  };

  return (
    <div className="space-y-6">
      {/* Title Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-800 pb-4">
        <div>
          <h1 className="text-xl font-bold flex items-center gap-2 text-white">
            <Clock className="w-6 h-6 text-blue-500" />
            Event Center & Audit Logs
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Centralized registry and log viewer for Docker engine activity, stack deployments, and container lifecycles.
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
          <div className="relative group">
            <button
              className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded text-xs font-semibold transition"
            >
              <Download className="w-3.5 h-3.5" />
              Export logs
            </button>
            <div className="absolute right-0 mt-1 hidden group-hover:block bg-slate-900 border border-slate-800 rounded shadow-lg z-50 py-1 text-left w-24">
              <button onClick={() => handleExport('json')} className="w-full text-left px-3 py-1 text-[11px] hover:bg-slate-800 text-slate-350">JSON Format</button>
              <button onClick={() => handleExport('csv')} className="w-full text-left px-3 py-1 text-[11px] hover:bg-slate-800 text-slate-350">CSV Format</button>
            </div>
          </div>
          <button
            onClick={handlePruning}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded text-xs font-semibold shadow-md shadow-blue-500/20 transition"
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
            Run Maintenance
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
            <span className="text-[10px] text-slate-550 font-bold uppercase tracking-wider">Total Events</span>
            <h3 className="text-xl font-extrabold mt-1 text-white">{dashboardQuery.data?.totalEvents || 0}</h3>
          </div>
          <div className="p-3 bg-blue-500/10 text-blue-400 rounded-lg"><Terminal className="w-5 h-5" /></div>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-5 rounded-lg flex items-center justify-between shadow-sm">
          <div>
            <span className="text-[10px] text-slate-550 font-bold uppercase tracking-wider">Today's Ingestion</span>
            <h3 className="text-xl font-extrabold mt-1 text-emerald-500">{dashboardQuery.data?.eventsToday || 0}</h3>
          </div>
          <div className="p-3 bg-emerald-500/10 text-emerald-500 rounded-lg"><CheckCircle2 className="w-5 h-5" /></div>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-5 rounded-lg flex items-center justify-between shadow-sm">
          <div>
            <span className="text-[10px] text-slate-550 font-bold uppercase tracking-wider">Warnings Ingested</span>
            <h3 className="text-xl font-extrabold mt-1 text-yellow-500">{dashboardQuery.data?.warningEvents || 0}</h3>
          </div>
          <div className="p-3 bg-yellow-500/10 text-yellow-500 rounded-lg"><AlertTriangle className="w-5 h-5" /></div>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-5 rounded-lg flex items-center justify-between shadow-sm">
          <div>
            <span className="text-[10px] text-slate-550 font-bold uppercase tracking-wider">Error Events</span>
            <h3 className="text-xl font-extrabold mt-1 text-red-500">{dashboardQuery.data?.errorEvents || 0}</h3>
          </div>
          <div className="p-3 bg-red-500/10 text-red-500 rounded-lg"><ShieldAlert className="w-5 h-5" /></div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex border-b border-slate-800 gap-1">
        <button
          onClick={() => { setActiveTab('events'); setSelectedEventId(null); }}
          className={`px-4 py-2 text-xs font-semibold border-b-2 transition ${
            activeTab === 'events' ? 'border-blue-500 text-blue-400 bg-blue-500/5' : 'border-transparent text-slate-400 hover:text-slate-350'
          }`}
        >
          Audit Log List ({eventsQuery.data?.length || 0})
        </button>
        <button
          onClick={() => { setActiveTab('schedules'); setSelectedEventId(null); }}
          className={`px-4 py-2 text-xs font-semibold border-b-2 transition ${
            activeTab === 'schedules' ? 'border-blue-500 text-blue-400 bg-blue-500/5' : 'border-transparent text-slate-400 hover:text-slate-350'
          }`}
        >
          Pruning Schedules ({schedulesQuery.data?.length || 0})
        </button>
        <button
          onClick={() => { setActiveTab('history'); setSelectedEventId(null); }}
          className={`px-4 py-2 text-xs font-semibold border-b-2 transition ${
            activeTab === 'history' ? 'border-blue-500 text-blue-400 bg-blue-500/5' : 'border-transparent text-slate-400 hover:text-slate-350'
          }`}
        >
          Operation logs
        </button>
      </div>

      {/* SEARCH FILTERS */}
      {activeTab === 'events' && (
        <div className="flex flex-wrap items-center gap-4 bg-slate-900 border border-slate-800 p-4 rounded-lg text-xs">
          <div className="flex items-center gap-2 bg-slate-950 border border-slate-850 px-3 py-1.5 rounded w-full sm:max-w-xs">
            <Search className="w-4 h-4 text-slate-550 shrink-0" />
            <input
              type="text"
              placeholder="Search event messages..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-transparent text-xs text-slate-300 placeholder-slate-650 focus:outline-none"
            />
          </div>

          <div className="flex items-center gap-2">
            <span className="text-slate-500 font-semibold font-mono">Severity:</span>
            <select
              value={severityFilter}
              onChange={(e) => setSeverityFilter(e.target.value)}
              className="bg-slate-950 border border-slate-850 text-slate-300 px-2 py-1 rounded focus:outline-none"
            >
              <option value="">All Severities</option>
              <option value="info">Info</option>
              <option value="warning">Warning</option>
              <option value="error">Error</option>
            </select>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-slate-500 font-semibold font-mono">Resource Type:</span>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="bg-slate-950 border border-slate-850 text-slate-300 px-2 py-1 rounded focus:outline-none"
            >
              <option value="">All Resources</option>
              <option value="container">Containers</option>
              <option value="image">Images</option>
              <option value="network">Networks</option>
              <option value="volume">Volumes</option>
              <option value="stack">Stacks</option>
              <option value="system">Host System</option>
            </select>
          </div>
        </div>
      )}

      {/* EVENTS LOG LIST VIEW */}
      {activeTab === 'events' && (
        <div className="space-y-6">
          <div className="bg-slate-900 border border-slate-800 rounded-lg overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-left text-xs">
                <thead>
                  <tr className="bg-slate-950 border-b border-slate-800 text-[10px] uppercase font-bold text-slate-500 tracking-wider font-mono">
                    <th className="px-4 py-3">Timestamp</th>
                    <th className="px-4 py-3">Severity</th>
                    <th className="px-4 py-3">Resource Type</th>
                    <th className="px-4 py-3">Target ID</th>
                    <th className="px-4 py-3">Originating Module</th>
                    <th className="px-4 py-3">Log Message</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-850 text-slate-300 font-mono text-[11px]">
                  {eventsQuery.data?.map((ev) => (
                    <tr
                      key={ev.id}
                      onClick={() => setSelectedEventId(ev.id)}
                      className={`hover:bg-slate-800/40 cursor-pointer transition ${
                        selectedEventId === ev.id ? 'bg-blue-500/5' : ''
                      }`}
                    >
                      <td className="px-4 py-3.5 text-slate-500">
                        {new Date(ev.timestamp).toLocaleTimeString()}
                      </td>
                      <td className="px-4 py-3.5">
                        <span className={`inline-flex px-1.5 py-0.5 rounded text-[10px] font-bold uppercase ${
                          ev.severity === 'info' ? 'bg-slate-800 text-slate-400' :
                          ev.severity === 'warning' ? 'bg-yellow-950 text-yellow-450' :
                          'bg-red-950 text-red-400'
                        }`}>
                          {ev.severity}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 capitalize text-slate-350">{ev.resourceType}</td>
                      <td className="px-4 py-3.5 text-slate-205 font-semibold">{ev.resourceId}</td>
                      <td className="px-4 py-3.5 text-slate-400">{ev.originatingModule}</td>
                      <td className="px-4 py-3.5 text-slate-200 truncate max-w-sm">{ev.message}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Event Detail Drawer */}
          {selectedEventId && selectedEvent && (
            <div className="bg-slate-900 border border-slate-850 rounded-lg p-6 space-y-4 shadow-lg text-xs leading-relaxed text-slate-300">
              <div className="flex justify-between items-center border-b border-slate-850 pb-3">
                <div>
                  <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                    <Info className="w-4 h-4 text-blue-500" />
                    Structured Event Metadata
                  </h3>
                  <span className="text-[10px] text-slate-550 font-mono block mt-0.5">{selectedEvent.id}</span>
                </div>
                <button onClick={() => setSelectedEventId(null)} className="text-slate-500 hover:text-white">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="bg-slate-950 border border-slate-850 p-4 rounded font-mono text-[11px] text-slate-350 space-y-2.5">
                <div className="flex justify-between"><span className="text-slate-500">Resource Target ID:</span><span className="text-white font-bold">{selectedEvent.resourceId}</span></div>
                <div className="flex justify-between"><span className="text-slate-500">Resource Scope:</span><span className="text-slate-400 capitalize">{selectedEvent.resourceType}</span></div>
                <div className="flex justify-between"><span className="text-slate-500">Action:</span><span className="text-slate-350 font-bold uppercase">{selectedEvent.action}</span></div>
                <div className="flex justify-between"><span className="text-slate-500">Execution Message:</span><span className="text-slate-200">{selectedEvent.message}</span></div>
                <div className="flex justify-between"><span className="text-slate-500">Security Audit Severity:</span><span className="text-slate-400 uppercase font-bold">{selectedEvent.severity}</span></div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* SCHEDULES TAB VIEW */}
      {activeTab === 'schedules' && (
        <div className="space-y-6">
          <div className="flex justify-end">
            <button
              onClick={() => setScheduleModalOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-650 hover:bg-blue-600 text-white rounded text-xs font-semibold shadow-md shadow-blue-550/20 transition"
            >
              <Plus className="w-3.5 h-3.5" />
              Add Pruning Schedule
            </button>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-lg overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-left text-xs">
                <thead>
                  <tr className="bg-slate-950 border-b border-slate-800 text-[10px] uppercase font-bold text-slate-500 tracking-wider font-mono">
                    <th className="px-4 py-3">Schedule Name</th>
                    <th className="px-4 py-3">Cron Expression</th>
                    <th className="px-4 py-3">Pruning Target</th>
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
                      <td colSpan={4} className="p-4 text-center text-slate-600 italic">No scheduled log pruning maintenance defined</td>
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
                    <td colSpan={4} className="p-4 text-center text-slate-650 italic">No operations recorded in this session</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* CREATE SCAN SCHEDULE MODAL */}
      {isScheduleModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <form onSubmit={handleScheduleSubmit} className="bg-slate-900 border border-slate-800 rounded-lg max-w-md w-full p-6 space-y-4 shadow-xl">
            <div className="flex justify-between items-center border-b border-slate-850 pb-3">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">Create log Pruning Schedule</h3>
              <button type="button" onClick={() => setScheduleModalOpen(false)} className="text-slate-500 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="space-y-3.5 text-xs text-slate-300">
              <div className="space-y-1">
                <label className="text-slate-455 block font-semibold">Schedule Name:</label>
                <input
                  type="text"
                  placeholder="e.g. Daily Logs Maintenance"
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
                <label className="text-slate-455 block font-semibold">Pruning Target:</label>
                <select
                  value={scheduleForm.target}
                  onChange={(e) => setScheduleForm(prev => ({ ...prev, target: e.target.value as any }))}
                  className="w-full bg-slate-950 border border-slate-850 px-3 py-1.5 rounded text-slate-300 focus:outline-none font-mono"
                >
                  <option value="all">Prune All Event Types</option>
                  <option value="containers">Prune Container Events only</option>
                  <option value="images">Prune Image events only</option>
                  <option value="system">Prune System audit logs only</option>
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
                className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded text-xs font-semibold shadow-md shadow-blue-555/20 transition"
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

export default EventDashboard;
