import React, { useState } from 'react';
import { 
  Blocks, 
  Search, 
  Terminal, 
  CheckCircle2, 
  X, 
  RefreshCw, 
  ShieldAlert, 
  Trash2, 
  Play, 
  Square, 
  Settings2,
  ExternalLink,
  ChevronRight
} from 'lucide-react';
import { usePlugins, usePluginDetails, usePluginOperation } from '../hooks/usePlugins';
import { fetchPluginPrivileges } from '../api/pluginApi';
import type { PluginListItem, PluginPrivilege } from '@dockverse/types';

export function Plugins() {
  const { 
    plugins, 
    isLoading, 
    refetch, 
    enablePlugin, 
    disablePlugin, 
    removePlugin, 
    installPlugin,
    configurePlugin,
    upgradePlugin,
    isConfiguring,
    isUpgrading
  } = usePlugins();

  // Search/Filters state
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'enabled' | 'disabled'>('all');
  
  // Selected Plugin for Drawer inspection
  const [selectedPluginId, setSelectedPluginId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'config' | 'privileges' | 'raw'>('overview');

  // Install Modal State
  const [showInstallModal, setShowInstallModal] = useState(false);
  const [installName, setInstallName] = useState('');
  const [installAlias, setInstallAlias] = useState('');
  const [grantPrivileges, setGrantPrivileges] = useState(true);
  const [installPrivileges, setInstallPrivileges] = useState<PluginPrivilege[]>([]);
  const [isLoadingPrivileges, setIsLoadingPrivileges] = useState(false);

  // Active operation ID for polling progress
  const [activeOpId, setActiveOpId] = useState<string | null>(null);

  // Configuration settings Form State
  const [showConfigModal, setShowConfigModal] = useState(false);
  const [configPluginId, setConfigPluginId] = useState<string | null>(null);
  const [configEnv, setConfigEnv] = useState<Record<string, string>>({});

  // Upgrade Modal State
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [upgradePluginId, setUpgradePluginId] = useState<string | null>(null);
  const [upgradeRemoteName, setUpgradeRemoteName] = useState('');
  const [upgradeGrantPrivileges, setUpgradeGrantPrivileges] = useState(true);

  // Get details for the selected plugin in the drawer
  const { data: inspectedDetails, isLoading: isLoadingDetails } = usePluginDetails(selectedPluginId || '');

  // Poll active operation
  const { data: activeOperation } = usePluginOperation(activeOpId || '');

  const handleFetchPrivileges = async () => {
    if (!installName.trim()) return;
    setIsLoadingPrivileges(true);
    setInstallPrivileges([]);
    try {
      const privs = await fetchPluginPrivileges(installName.trim());
      setInstallPrivileges(privs);
    } catch (err: any) {
      alert(err.message || 'Failed to fetch privileges for this plugin name. Ensure it is a valid Docker Hub image.');
    } finally {
      setIsLoadingPrivileges(false);
    }
  };

  const handleInstallSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!installName.trim()) return;
    try {
      const result = await installPlugin({
        remoteName: installName.trim(),
        alias: installAlias.trim() || undefined,
        grantPrivileges
      });
      setActiveOpId(result.operationId);
      setShowInstallModal(false);
      setInstallName('');
      setInstallAlias('');
      setInstallPrivileges([]);
    } catch (err: any) {
      alert(err.message || 'Plugin installation initiation failed');
    }
  };

  const handleOpenConfigModal = (plugin: PluginListItem) => {
    setConfigPluginId(plugin.Id);
    const envObj: Record<string, string> = {};
    plugin.Config.Env?.forEach((e) => {
      envObj[e.Name] = e.Value || '';
    });
    setConfigEnv(envObj);
    setShowConfigModal(true);
  };

  const handleConfigSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!configPluginId) return;
    try {
      await configurePlugin({ id: configPluginId, env: configEnv });
      setShowConfigModal(false);
      setConfigPluginId(null);
      refetch();
    } catch (err: any) {
      alert(err.message || 'Failed to update plugin configuration');
    }
  };

  const handleOpenUpgradeModal = (plugin: PluginListItem) => {
    setUpgradePluginId(plugin.Id);
    setUpgradeRemoteName(plugin.Name);
    setShowUpgradeModal(true);
  };

  const handleUpgradeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!upgradePluginId || !upgradeRemoteName.trim()) return;
    try {
      const result = await upgradePlugin({
        id: upgradePluginId,
        remoteName: upgradeRemoteName.trim(),
        grantPrivileges: upgradeGrantPrivileges
      });
      setActiveOpId(result.operationId);
      setShowUpgradeModal(false);
      setUpgradePluginId(null);
    } catch (err: any) {
      alert(err.message || 'Upgrade initiation failed');
    }
  };

  const handleToggleEnable = async (plugin: PluginListItem) => {
    try {
      if (plugin.Active) {
        if (confirm(`Disable plugin "${plugin.Name}"?`)) {
          await disablePlugin({ id: plugin.Id });
        }
      } else {
        await enablePlugin(plugin.Id);
      }
      refetch();
    } catch (err: any) {
      alert(err.message || 'Failed to toggle plugin state');
    }
  };

  const handleUninstall = async (plugin: PluginListItem) => {
    if (confirm(`Are you absolutely sure you want to uninstall and remove plugin "${plugin.Name}"?`)) {
      try {
        await removePlugin({ id: plugin.Id, force: true });
        if (selectedPluginId === plugin.Id) {
          setSelectedPluginId(null);
        }
        refetch();
      } catch (err: any) {
        alert(err.message || 'Failed to uninstall plugin');
      }
    }
  };

  // Filter plugins
  const filteredPlugins = plugins.filter((plugin) => {
    const matchesSearch = plugin.Name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      plugin.Config.Description?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' ||
      (statusFilter === 'enabled' && plugin.Active) ||
      (statusFilter === 'disabled' && !plugin.Active);

    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 pb-4 border-b border-border/40 select-none">
        <div>
          <h1 className="text-xl font-bold text-slate-100 flex items-center gap-2">
            <Blocks className="w-5 h-5 text-blue-500" />
            Docker Engine Plugins
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Install, configure, and manage system-level extensions and plugins for your Docker daemon.
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => refetch()}
            className="px-3 py-1.5 bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-300 rounded text-xs font-medium flex items-center gap-1.5 transition"
            title="Refresh List"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Refresh
          </button>
          <button
            onClick={() => setShowInstallModal(true)}
            className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded text-xs font-medium flex items-center gap-1.5 transition"
          >
            Install Plugin
          </button>
        </div>
      </div>

      {/* Operations logs panel (if active operation running/polling) */}
      {activeOpId && activeOperation && (
        <div className="bg-slate-950 border border-slate-800 rounded-lg p-4 space-y-3 font-mono text-xs relative">
          <div className="flex justify-between items-center pb-2 border-b border-slate-900">
            <span className="flex items-center gap-2 text-slate-300">
              <Terminal className="w-4 h-4 text-blue-400 animate-pulse" />
              Active Operation Status: <strong>{activeOperation.status.toUpperCase()}</strong>
            </span>
            <button
              onClick={() => setActiveOpId(null)}
              className="text-slate-500 hover:text-slate-300"
              title="Close log viewer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="max-h-40 overflow-y-auto space-y-1 bg-slate-900/50 p-3 rounded border border-slate-950/60 font-mono text-slate-400">
            {activeOperation.logs?.map((log, index) => (
              <div key={index} className="whitespace-pre-wrap">{log}</div>
            ))}
            {activeOperation.status === 'running' && (
              <div className="text-blue-400 animate-pulse">Running operation...</div>
            )}
            {activeOperation.status === 'failed' && (
              <div className="text-red-500 font-bold">Failed: {activeOperation.error}</div>
            )}
            {activeOperation.status === 'success' && (
              <div className="text-green-500 font-bold flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4" /> Task finished successfully!
              </div>
            )}
          </div>
        </div>
      )}

      {/* Toolbar Filters */}
      <div className="flex flex-col sm:flex-row gap-3 bg-card/20 p-3 rounded-lg border border-border/20">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
          <input
            type="text"
            placeholder="Search plugins..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded pl-9 pr-4 py-2 text-xs text-slate-300 focus:outline-none focus:border-blue-500 transition"
          />
        </div>
        <div className="flex gap-2">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="bg-slate-950 border border-slate-800 rounded px-3 py-2 text-xs text-slate-300 focus:outline-none focus:border-blue-500 transition"
          >
            <option value="all">All Statuses</option>
            <option value="enabled">Enabled Only</option>
            <option value="disabled">Disabled Only</option>
          </select>
        </div>
      </div>

      {/* Main Grid View */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((n) => (
            <div key={n} className="bg-slate-900/40 border border-slate-800 rounded-lg p-5 animate-pulse space-y-3">
              <div className="h-4 bg-slate-800 rounded w-2/3"></div>
              <div className="h-3 bg-slate-800 rounded w-1/2"></div>
              <div className="h-10 bg-slate-800 rounded"></div>
            </div>
          ))}
        </div>
      ) : filteredPlugins.length === 0 ? (
        <div className="bg-card/10 border border-dashed border-border/30 rounded-lg p-10 text-center space-y-3 select-none">
          <Blocks className="w-10 h-10 text-slate-600 mx-auto" />
          <h3 className="text-sm font-semibold text-slate-300">No Plugins Found</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            No Docker Engine plugins match the current filters. Install a plugin to extend daemon functionality.
          </p>
          <button
            onClick={() => setShowInstallModal(true)}
            className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded text-xs font-medium inline-block transition"
          >
            Install Plugin Now
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredPlugins.map((plugin) => (
            <div
              key={plugin.Id}
              className={`bg-slate-950 border transition-all duration-200 rounded-lg flex flex-col justify-between ${
                selectedPluginId === plugin.Id
                  ? 'border-blue-500 ring-1 ring-blue-500/20'
                  : 'border-slate-800 hover:border-slate-700'
              }`}
            >
              <div className="p-5 space-y-4">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 
                      onClick={() => {
                        setSelectedPluginId(plugin.Id);
                        setActiveTab('overview');
                      }}
                      className="font-semibold text-sm text-slate-200 hover:text-blue-400 cursor-pointer transition truncate max-w-[200px]"
                      title={plugin.Name}
                    >
                      {plugin.Name}
                    </h3>
                    <span className="text-[10px] text-slate-500 font-mono truncate block max-w-[200px]">
                      ID: {plugin.Id.substring(0, 12)}
                    </span>
                  </div>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-semibold tracking-wider font-mono ${
                    plugin.Active
                      ? 'bg-green-500/10 text-green-400 border border-green-500/20'
                      : 'bg-slate-800 text-slate-500 border border-slate-700/50'
                  }`}>
                    {plugin.Active ? 'ENABLED' : 'DISABLED'}
                  </span>
                </div>

                <p className="text-xs text-slate-400 line-clamp-2 h-8">
                  {plugin.Config.Description || 'No description provided.'}
                </p>

                {plugin.Config.Interface?.Types && plugin.Config.Interface.Types.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {plugin.Config.Interface.Types.map((type, idx) => (
                      <span key={idx} className="bg-slate-900 border border-slate-850 px-2 py-0.5 rounded text-[9px] text-slate-400 font-mono">
                        {type}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Actions Footer */}
              <div className="border-t border-slate-900 bg-slate-950/60 px-4 py-3 rounded-b-lg flex justify-between items-center text-xs select-none">
                <button
                  onClick={() => {
                    setSelectedPluginId(plugin.Id);
                    setActiveTab('overview');
                  }}
                  className="text-slate-400 hover:text-white flex items-center gap-1 transition"
                >
                  Inspect <ChevronRight className="w-3.5 h-3.5" />
                </button>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleToggleEnable(plugin)}
                    className={`p-1.5 rounded transition ${
                      plugin.Active 
                        ? 'bg-slate-900 text-red-400 hover:bg-red-500/10 hover:text-red-300' 
                        : 'bg-slate-900 text-green-400 hover:bg-green-500/10 hover:text-green-300'
                    }`}
                    title={plugin.Active ? 'Disable Plugin' : 'Enable Plugin'}
                  >
                    {plugin.Active ? <Square className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                  </button>
                  <button
                    onClick={() => handleOpenConfigModal(plugin)}
                    className="p-1.5 bg-slate-900 text-slate-400 hover:text-white rounded hover:bg-slate-800 transition"
                    title="Configure Environment"
                  >
                    <Settings2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => handleOpenUpgradeModal(plugin)}
                    className="p-1.5 bg-slate-900 text-slate-400 hover:text-white rounded hover:bg-slate-800 transition"
                    title="Upgrade Plugin"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => handleUninstall(plugin)}
                    className="p-1.5 bg-slate-900 text-red-500 hover:text-red-400 hover:bg-red-950/20 rounded transition"
                    title="Uninstall Plugin"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Drawer Inspection view */}
      {selectedPluginId && (
        <div className="fixed inset-y-0 right-0 w-full md:w-[480px] bg-slate-950 border-l border-slate-800 z-50 flex flex-col justify-between shadow-2xl animate-in slide-in-from-right duration-200">
          <div className="flex-1 overflow-y-auto">
            {/* Drawer Header */}
            <div className="p-6 border-b border-slate-900 flex justify-between items-start bg-slate-950 sticky top-0 z-10">
              <div>
                <h2 className="text-base font-bold text-slate-100 flex items-center gap-2">
                  <Blocks className="w-5 h-5 text-blue-500" />
                  Plugin Inspector
                </h2>
                <p className="text-[11px] text-slate-500 font-mono mt-1">{selectedPluginId}</p>
              </div>
              <button
                onClick={() => setSelectedPluginId(null)}
                className="p-1 text-slate-500 hover:text-slate-300 hover:bg-slate-900 rounded transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Tab Navigation */}
            <div className="flex border-b border-slate-900 px-6 bg-slate-950/80 sticky top-[77px] z-10 select-none">
              {(['overview', 'config', 'privileges', 'raw'] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`py-3 px-4 border-b-2 text-xs font-medium capitalize transition -mb-px ${
                    activeTab === tab
                      ? 'border-blue-500 text-blue-400'
                      : 'border-transparent text-slate-500 hover:text-slate-300'
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>

            {/* Drawer Content */}
            <div className="p-6">
              {isLoadingDetails ? (
                <div className="space-y-4 animate-pulse">
                  <div className="h-4 bg-slate-900 rounded w-1/3"></div>
                  <div className="h-20 bg-slate-900 rounded"></div>
                  <div className="h-10 bg-slate-900 rounded"></div>
                </div>
              ) : inspectedDetails ? (
                <div className="space-y-6">
                  {/* Overview Tab */}
                  {activeTab === 'overview' && (
                    <div className="space-y-5">
                      <div className="bg-slate-900/40 border border-slate-905 p-4 rounded-lg space-y-3">
                        <div className="grid grid-cols-2 gap-4 text-xs">
                          <div>
                            <span className="text-slate-500 block">Name</span>
                            <span className="text-slate-300 font-semibold">{inspectedDetails.Name}</span>
                          </div>
                          <div>
                            <span className="text-slate-500 block">Docker Version</span>
                            <span className="text-slate-300 font-mono">{inspectedDetails.Config.DockerVersion || 'N/A'}</span>
                          </div>
                          <div>
                            <span className="text-slate-500 block">Status</span>
                            <span className={`inline-block font-semibold mt-1 ${inspectedDetails.Active ? 'text-green-400' : 'text-slate-500'}`}>
                              {inspectedDetails.Active ? 'Active' : 'Inactive'}
                            </span>
                          </div>
                          <div>
                            <span className="text-slate-500 block">Socket</span>
                            <span className="text-slate-300 font-mono text-[10px] block truncate">{inspectedDetails.Config.Interface?.Socket || 'N/A'}</span>
                          </div>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Description</h4>
                        <p className="text-xs text-slate-300 bg-slate-900/20 border border-slate-900 p-3 rounded">
                          {inspectedDetails.Config.Description || 'No description provided.'}
                        </p>
                      </div>

                      {inspectedDetails.Config.Documentation && (
                        <div className="flex items-center gap-1.5 text-xs text-blue-400 hover:underline">
                          <ExternalLink className="w-3.5 h-3.5" />
                          <a href={inspectedDetails.Config.Documentation} target="_blank" rel="noreferrer">
                            View Documentation Site
                          </a>
                        </div>
                      )}

                      {inspectedDetails.Config.Interface?.Types && (
                        <div className="space-y-2">
                          <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Interface Capabilities</h4>
                          <div className="flex flex-wrap gap-1.5">
                            {inspectedDetails.Config.Interface.Types.map((type, idx) => (
                              <span key={idx} className="bg-slate-900 border border-slate-800 text-slate-300 px-2 py-1 rounded text-[10px] font-mono">
                                {type}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Config Tab */}
                  {activeTab === 'config' && (
                    <div className="space-y-6">
                      {/* Environment Variables */}
                      <div className="space-y-2">
                        <div className="flex justify-between items-center">
                          <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Environment Config</h4>
                          <button
                            onClick={() => handleOpenConfigModal(inspectedDetails)}
                            className="text-[10px] text-blue-400 hover:underline flex items-center gap-1"
                          >
                            <Settings2 className="w-3 h-3" /> Edit Settings
                          </button>
                        </div>
                        {inspectedDetails.Config.Env && inspectedDetails.Config.Env.length > 0 ? (
                          <div className="border border-slate-900 rounded overflow-hidden divide-y divide-slate-900 text-xs">
                            {inspectedDetails.Config.Env.map((env, idx) => (
                              <div key={idx} className="p-3 bg-slate-900/10 flex justify-between items-start gap-4">
                                <div className="space-y-1">
                                  <span className="font-mono text-slate-300 font-semibold block">{env.Name}</span>
                                  {env.Description && <span className="text-[10px] text-slate-500 block">{env.Description}</span>}
                                </div>
                                <div className="text-right">
                                  <span className="font-mono bg-slate-950 px-2 py-0.5 rounded text-[10px] text-blue-300 block truncate max-w-[200px]" title={env.Value}>
                                    {env.Value || 'unset'}
                                  </span>
                                  {env.Settable && env.Settable.length > 0 && (
                                    <span className="text-[9px] text-green-500/80 block mt-1 font-mono">Settable</span>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-xs text-slate-500 italic">No environment configurations found.</p>
                        )}
                      </div>

                      {/* Mounts */}
                      <div className="space-y-2">
                        <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Mount Points</h4>
                        {inspectedDetails.Config.Mounts && inspectedDetails.Config.Mounts.length > 0 ? (
                          <div className="space-y-2">
                            {inspectedDetails.Config.Mounts.map((mount, idx) => (
                              <div key={idx} className="bg-slate-900/30 border border-slate-900 p-3 rounded text-xs space-y-2">
                                <div className="flex justify-between items-center border-b border-slate-900 pb-1.5">
                                  <span className="font-semibold text-slate-300">{mount.Name || `Mount #${idx}`}</span>
                                  <span className="text-[9px] bg-slate-950 border border-slate-850 px-1.5 py-0.5 rounded text-slate-400 uppercase font-mono">{mount.Type}</span>
                                </div>
                                {mount.Description && <p className="text-[10px] text-slate-500">{mount.Description}</p>}
                                <div className="grid grid-cols-2 gap-2 text-[10px] font-mono">
                                  <div>
                                    <span className="text-slate-500 block">Host Path:</span>
                                    <span className="text-slate-400 truncate block">{mount.Source || 'N/A'}</span>
                                  </div>
                                  <div>
                                    <span className="text-slate-500 block">Plugin Destination:</span>
                                    <span className="text-slate-400 truncate block">{mount.Destination || 'N/A'}</span>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-xs text-slate-500 italic">No mounts defined.</p>
                        )}
                      </div>

                      {/* Devices */}
                      <div className="space-y-2">
                        <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Device Access</h4>
                        {inspectedDetails.Config.Devices && inspectedDetails.Config.Devices.length > 0 ? (
                          <div className="space-y-2">
                            {inspectedDetails.Config.Devices.map((device, idx) => (
                              <div key={idx} className="bg-slate-900/30 border border-slate-900 p-3 rounded text-xs">
                                <div className="flex justify-between items-center">
                                  <span className="font-semibold text-slate-300">{device.Name || `Device #${idx}`}</span>
                                  <span className="font-mono text-slate-400">{device.Path}</span>
                                </div>
                                {device.Description && <p className="text-[10px] text-slate-500 mt-1">{device.Description}</p>}
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-xs text-slate-500 italic">No devices mapped.</p>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Privileges Tab */}
                  {activeTab === 'privileges' && (
                    <div className="space-y-4">
                      {inspectedDetails.Privileges && inspectedDetails.Privileges.length > 0 ? (
                        <div className="space-y-3">
                          <div className="bg-red-950/20 border border-red-900/40 p-3 rounded flex items-start gap-2.5">
                            <ShieldAlert className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                            <p className="text-[11px] text-red-400 leading-normal">
                              This plugin runs with advanced privileges. Review requested resource privileges carefully before deploying.
                            </p>
                          </div>
                          <div className="space-y-2">
                            {inspectedDetails.Privileges.map((priv, idx) => (
                              <div key={idx} className="bg-slate-900/35 border border-slate-900 p-3 rounded text-xs space-y-1">
                                <span className="font-bold text-slate-300 block">{priv.Name}</span>
                                <span className="text-[11px] text-slate-500 block leading-relaxed">{priv.Description}</span>
                                {priv.Value && priv.Value.length > 0 && (
                                  <div className="pt-1.5 flex flex-wrap gap-1">
                                    {priv.Value.map((v, vIdx) => (
                                      <span key={vIdx} className="bg-slate-950 border border-slate-850 px-2 py-0.5 rounded text-[10px] text-red-400 font-mono">
                                        {v}
                                      </span>
                                    ))}
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      ) : (
                        <div className="bg-slate-900/20 border border-slate-900 p-4 rounded text-center">
                          <p className="text-xs text-slate-400">No special privileges requested by this plugin.</p>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Raw inspect tab */}
                  {activeTab === 'raw' && (
                    <div className="bg-slate-950 border border-slate-900 p-4 rounded-lg max-h-[500px] overflow-auto">
                      <pre className="text-[10px] text-slate-400 font-mono whitespace-pre">{JSON.stringify(inspectedDetails, null, 2)}</pre>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-10 text-xs text-slate-500">Failed to inspect plugin.</div>
              )}
            </div>
          </div>
          <div className="p-6 border-t border-slate-900 bg-slate-950 flex justify-end gap-2 select-none">
            <button
              onClick={() => setSelectedPluginId(null)}
              className="px-4 py-2 border border-slate-800 hover:border-slate-700 text-slate-300 rounded text-xs font-semibold transition"
            >
              Close Inspector
            </button>
          </div>
        </div>
      )}

      {/* Plugin Install dialog modal */}
      {showInstallModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <form 
            onSubmit={handleInstallSubmit}
            className="bg-slate-950 border border-slate-800 rounded-lg w-full max-w-md flex flex-col justify-between overflow-hidden shadow-2xl animate-in zoom-in-95 duration-150"
          >
            <div className="p-6 space-y-4">
              <div className="flex justify-between items-center pb-2 border-b border-slate-900">
                <h3 className="text-sm font-bold text-slate-200 flex items-center gap-2">
                  <Blocks className="w-5 h-5 text-blue-500" />
                  Install Docker Engine Plugin
                </h3>
                <button
                  type="button"
                  onClick={() => {
                    setShowInstallModal(false);
                    setInstallName('');
                    setInstallAlias('');
                    setInstallPrivileges([]);
                  }}
                  className="text-slate-500 hover:text-slate-300"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-3 text-xs">
                <div className="space-y-1">
                  <label className="text-slate-400 font-medium">Plugin Repository Name (Docker Hub)</label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="e.g. vieux/sshfs:latest"
                      value={installName}
                      onChange={(e) => setInstallName(e.target.value)}
                      className="flex-1 bg-slate-900 border border-slate-850 rounded px-3 py-2 text-slate-300 focus:outline-none focus:border-blue-500 transition"
                      required
                    />
                    <button
                      type="button"
                      onClick={handleFetchPrivileges}
                      className="px-2.5 bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-300 font-semibold rounded"
                    >
                      Fetch Privileges
                    </button>
                  </div>
                  <span className="text-[10px] text-slate-500 block">Provide the remote image tag name from Docker registry.</span>
                </div>

                <div className="space-y-1">
                  <label className="text-slate-400 font-medium">Alias (Optional local name)</label>
                  <input
                    type="text"
                    placeholder="e.g. sshfs"
                    value={installAlias}
                    onChange={(e) => setInstallAlias(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-850 rounded px-3 py-2 text-slate-300 focus:outline-none focus:border-blue-500 transition"
                  />
                </div>

                {isLoadingPrivileges && (
                  <div className="py-4 text-center text-slate-500 animate-pulse">Loading privileges details...</div>
                )}

                {installPrivileges.length > 0 && (
                  <div className="space-y-2 border border-slate-900 p-3 rounded bg-slate-900/10">
                    <span className="text-slate-400 font-semibold block text-[11px]">Requested Privileges:</span>
                    <div className="max-h-32 overflow-y-auto space-y-1.5 pr-1">
                      {installPrivileges.map((priv, idx) => (
                        <div key={idx} className="bg-slate-950 p-2 rounded text-[10px] border border-slate-900">
                          <strong className="text-slate-300 block">{priv.Name}</strong>
                          <span className="text-slate-500 block">{priv.Description}</span>
                          {priv.Value && priv.Value.length > 0 && (
                            <span className="text-red-400 font-mono block mt-1">Value: {priv.Value.join(', ')}</span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="flex items-center gap-2 pt-2">
                  <input
                    type="checkbox"
                    id="grant"
                    checked={grantPrivileges}
                    onChange={(e) => setGrantPrivileges(e.target.checked)}
                    className="rounded bg-slate-900 border-slate-800 text-blue-500 focus:ring-0 focus:ring-offset-0 focus:outline-none"
                  />
                  <label htmlFor="grant" className="text-slate-400 select-none cursor-pointer">
                    Grant and accept plugin privileges automatically
                  </label>
                </div>
              </div>
            </div>

            <div className="p-6 border-t border-slate-900 bg-slate-950 flex justify-end gap-2 text-xs select-none">
              <button
                type="button"
                onClick={() => {
                  setShowInstallModal(false);
                  setInstallName('');
                  setInstallAlias('');
                  setInstallPrivileges([]);
                }}
                className="px-4 py-2 border border-slate-800 hover:border-slate-700 text-slate-300 rounded font-semibold transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded font-semibold transition"
              >
                Install
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Edit Configuration Settings dialog modal */}
      {showConfigModal && configPluginId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <form 
            onSubmit={handleConfigSubmit}
            className="bg-slate-950 border border-slate-800 rounded-lg w-full max-w-md flex flex-col justify-between overflow-hidden shadow-2xl animate-in zoom-in-95 duration-150"
          >
            <div className="p-6 space-y-4">
              <div className="flex justify-between items-center pb-2 border-b border-slate-900">
                <h3 className="text-sm font-bold text-slate-200 flex items-center gap-2">
                  <Settings2 className="w-5 h-5 text-blue-500" />
                  Configure Settings
                </h3>
                <button
                  type="button"
                  onClick={() => {
                    setShowConfigModal(false);
                    setConfigPluginId(null);
                  }}
                  className="text-slate-500 hover:text-slate-300"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
                {Object.keys(configEnv).length > 0 ? (
                  Object.entries(configEnv).map(([key, val]) => (
                    <div key={key} className="space-y-1 text-xs">
                      <label className="text-slate-400 font-semibold font-mono">{key}</label>
                      <input
                        type="text"
                        value={val}
                        onChange={(e) => setConfigEnv({ ...configEnv, [key]: e.target.value })}
                        className="w-full bg-slate-900 border border-slate-850 rounded px-3 py-2 text-slate-300 focus:outline-none focus:border-blue-500 transition font-mono"
                      />
                    </div>
                  ))
                ) : (
                  <div className="text-center py-6 text-xs text-slate-500">
                    No settable configurations found for this plugin.
                  </div>
                )}
              </div>
            </div>

            <div className="p-6 border-t border-slate-900 bg-slate-950 flex justify-end gap-2 text-xs select-none">
              <button
                type="button"
                onClick={() => {
                  setShowConfigModal(false);
                  setConfigPluginId(null);
                }}
                className="px-4 py-2 border border-slate-800 hover:border-slate-700 text-slate-300 rounded font-semibold transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isConfiguring}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded font-semibold transition"
              >
                Save Settings
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Plugin Upgrade dialog modal */}
      {showUpgradeModal && upgradePluginId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <form 
            onSubmit={handleUpgradeSubmit}
            className="bg-slate-950 border border-slate-800 rounded-lg w-full max-w-md flex flex-col justify-between overflow-hidden shadow-2xl animate-in zoom-in-95 duration-150"
          >
            <div className="p-6 space-y-4">
              <div className="flex justify-between items-center pb-2 border-b border-slate-900">
                <h3 className="text-sm font-bold text-slate-200 flex items-center gap-2">
                  <RefreshCw className="w-5 h-5 text-blue-500" />
                  Upgrade Docker Plugin
                </h3>
                <button
                  type="button"
                  onClick={() => {
                    setShowUpgradeModal(false);
                    setUpgradePluginId(null);
                  }}
                  className="text-slate-500 hover:text-slate-300"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-3 text-xs">
                <div className="space-y-1">
                  <label className="text-slate-400 font-medium">Remote Upgrade Source Repository</label>
                  <input
                    type="text"
                    placeholder="e.g. vieux/sshfs:latest"
                    value={upgradeRemoteName}
                    onChange={(e) => setUpgradeRemoteName(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-850 rounded px-3 py-2 text-slate-300 focus:outline-none focus:border-blue-500 transition"
                    required
                  />
                  <span className="text-[10px] text-slate-500 block">Upgrades this plugin to the tag or repository version specified.</span>
                </div>

                <div className="flex items-center gap-2 pt-2">
                  <input
                    type="checkbox"
                    id="upgrade-grant"
                    checked={upgradeGrantPrivileges}
                    onChange={(e) => setUpgradeGrantPrivileges(e.target.checked)}
                    className="rounded bg-slate-900 border-slate-800 text-blue-500 focus:ring-0 focus:ring-offset-0 focus:outline-none"
                  />
                  <label htmlFor="upgrade-grant" className="text-slate-400 select-none cursor-pointer">
                    Grant and accept plugin privileges automatically
                  </label>
                </div>
              </div>
            </div>

            <div className="p-6 border-t border-slate-900 bg-slate-950 flex justify-end gap-2 text-xs select-none">
              <button
                type="button"
                onClick={() => {
                  setShowUpgradeModal(false);
                  setUpgradePluginId(null);
                }}
                className="px-4 py-2 border border-slate-800 hover:border-slate-700 text-slate-300 rounded font-semibold transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isUpgrading}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded font-semibold transition"
              >
                Upgrade
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}

export default Plugins;
