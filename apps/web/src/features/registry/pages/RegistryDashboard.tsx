import React, { useState, useEffect, useCallback } from 'react';
import { 
  Database, 
  Search, 
  Lock, 
  Download, 
  Upload, 
  Terminal, 
  CheckCircle2, 
  X, 
  RefreshCw, 
  List, 
  Compass 
} from 'lucide-react';
import { useRegistry, useRegistryOperation } from '../hooks/useRegistry';
import { searchRegistry, fetchTags, fetchManifest } from '../api/registryApi';
import type { RegistryRepository, RegistryTag, RegistryManifest } from '@dockverse/types';

export function RegistryDashboard() {
  const { providers, login, logout, pullImage, pushImage, refetchProviders } = useRegistry();

  // Search/Catalog State
  const [searchQuery, setSearchQuery] = useState('nginx');
  const [searchResults, setSearchResults] = useState<RegistryRepository[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  // Selected Repo Details
  const [selectedRepo, setSelectedRepo] = useState<string | null>(null);
  const [tagsList, setTagsList] = useState<RegistryTag[]>([]);
  const [isLoadingTags, setIsLoadingTags] = useState(false);

  // Manifest Details Modal
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [manifest, setManifest] = useState<RegistryManifest | null>(null);
  const [isLoadingManifest, setIsLoadingManifest] = useState(false);

  // Active operation ID for Pull/Push Progress logs
  const [activeOpId, setActiveOpId] = useState<string | null>(null);

  // Login Form modal for providers
  const [loginProviderId, setLoginProviderId] = useState<string | null>(null);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  const handleSearch = useCallback(async () => {
    if (!searchQuery.trim()) return;
    setIsSearching(true);
    try {
      const result = await searchRegistry(searchQuery.trim());
      setSearchResults(result.repositories);
      if (result.repositories.length > 0) {
        setSelectedRepo(result.repositories[0].name);
      }
    } catch {
      // Gracefully swallow search error
    } finally {
      setIsSearching(false);
    }
  }, [searchQuery]);

  // Load repositories search on mount
  useEffect(() => {
    handleSearch();
  }, [handleSearch]);

  // Fetch tags when repository selection changes
  useEffect(() => {
    if (!selectedRepo) return;
    async function loadTags() {
      setIsLoadingTags(true);
      try {
        const list = await fetchTags(selectedRepo!);
        setTagsList(list);
      } catch {
        // Fallback placeholder
      } finally {
        setIsLoadingTags(false);
      }
    }
    loadTags();
  }, [selectedRepo]);

  // Fetch manifest details
  const handleViewManifest = async (tagName: string) => {
    if (!selectedRepo) return;
    setSelectedTag(tagName);
    setIsLoadingManifest(true);
    try {
      const details = await fetchManifest(selectedRepo, tagName);
      setManifest(details);
    } catch {
      // Graceful
    } finally {
      setIsLoadingManifest(false);
    }
  };

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!loginProviderId || !username.trim()) return;
    try {
      await login({ providerId: loginProviderId, username, password });
      setLoginProviderId(null);
      setUsername('');
      setPassword('');
      refetchProviders();
    } catch (err: any) {
      alert(err.message || 'Login failed');
    }
  };

  const handleLogout = async (provId: string) => {
    if (confirm('Disconnect from this registry provider?')) {
      try {
        await logout(provId);
        refetchProviders();
      } catch (err: any) {
        alert(err.message || 'Logout failed');
      }
    }
  };

  const handlePullImage = async (tagName: string) => {
    if (!selectedRepo) return;
    try {
      const result = await pullImage({ imageName: selectedRepo, tag: tagName });
      setActiveOpId(result.operationId);
    } catch (err: any) {
      alert(err.message || 'Pull request failed');
    }
  };

  const handlePushImage = async (tagName: string) => {
    if (!selectedRepo) return;
    try {
      const result = await pushImage({ imageName: selectedRepo, tag: tagName });
      setActiveOpId(result.operationId);
    } catch (err: any) {
      alert(err.message || 'Push request failed');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 pb-4 border-b border-border/40 select-none">
        <div>
          <h1 className="text-xl font-bold text-slate-100 flex items-center gap-2">
            <Database className="w-5 h-5 text-blue-500" />
            Registry Management Platform
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Browse repositories, inspect image manifests, and pull layers across OCI registries
          </p>
        </div>
      </div>

      {/* Provider selection shelf */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Registry Providers Column */}
        <div className="md:col-span-1 bg-card border border-border p-4 rounded-lg space-y-4 select-none">
          <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
            <Compass className="w-4 h-4 text-blue-500" />
            Registry Providers
          </h3>

          <div className="space-y-2 max-h-[450px] overflow-y-auto pr-1">
            {providers.map((p) => {
              const isConnected = p.status === 'connected';

              return (
                <div key={p.id} className="p-3 bg-slate-950/40 border border-border/60 rounded flex justify-between items-start">
                  <div className="space-y-0.5 max-w-[170px]">
                    <div className="text-xs font-bold text-slate-200 flex items-center gap-1">
                      {p.name}
                      {isConnected && <CheckCircle2 className="w-3 h-3 text-green-500" />}
                    </div>
                    <div className="text-[10px] text-slate-500 truncate">{p.description}</div>
                  </div>
                  
                  {isConnected ? (
                    <button 
                      onClick={() => handleLogout(p.id)}
                      className="py-1 px-2 border border-red-900 bg-red-950/20 text-[10px] text-red-400 font-semibold rounded hover:bg-red-950/40"
                    >
                      Disconnect
                    </button>
                  ) : (
                    <button 
                      onClick={() => setLoginProviderId(p.id)}
                      className="py-1 px-2 border border-border bg-slate-900 text-[10px] text-slate-300 font-semibold rounded hover:bg-slate-800"
                    >
                      Connect
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Discovery Repository Browser */}
        <div className="md:col-span-2 space-y-6">
          
          {/* Search bar */}
          <div className="bg-card border border-border/60 p-4 rounded-lg flex items-center gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
              <input
                type="text"
                placeholder="Search registry catalogs (e.g. nginx, node, postgres)..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                className="w-full bg-slate-950 border border-border rounded pl-10 pr-4 py-2 text-xs text-slate-200 focus:outline-none focus:border-blue-500"
              />
            </div>
            <button
              onClick={handleSearch}
              disabled={isSearching}
              className="py-2 px-4 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-xs font-semibold rounded transition flex items-center gap-1.5"
            >
              {isSearching ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : 'Search'}
            </button>
          </div>

          {/* Search Results list & Detail Tags Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {/* Repos list */}
            <div className="sm:col-span-1 bg-card border border-border/60 p-3 rounded-lg space-y-3 select-none">
              <h4 className="text-xs font-bold text-slate-400 border-b border-border/40 pb-1.5 flex items-center gap-1">
                <List className="w-3.5 h-3.5 text-blue-500" />
                Repositories
              </h4>
              {searchResults.length === 0 ? (
                <p className="text-xs text-slate-500 italic">No search results found</p>
              ) : (
                <div className="space-y-1.5 max-h-[350px] overflow-y-auto">
                  {searchResults.map((r) => {
                    const isSelected = selectedRepo === r.name;
                    return (
                      <button
                        key={r.name}
                        onClick={() => setSelectedRepo(r.name)}
                        className={`w-full p-2 text-xs font-bold text-left rounded truncate transition ${
                          isSelected ? 'bg-slate-900 text-blue-400' : 'bg-transparent text-slate-400 hover:bg-slate-900/30'
                        }`}
                      >
                        {r.namespace ? `${r.namespace}/${r.name}` : r.name}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Tags grid details */}
            <div className="sm:col-span-2 bg-card border border-border p-4 rounded-lg space-y-4">
              <h4 className="text-xs font-bold text-slate-200 border-b border-border/40 pb-1.5 select-none">
                Tags details for repository: <span className="text-blue-500 font-mono font-bold">{selectedRepo || 'none'}</span>
              </h4>

              {isLoadingTags ? (
                <div className="flex justify-center items-center py-12 text-slate-500 animate-pulse">
                  <RefreshCw className="w-5 h-5 animate-spin text-blue-500 mr-2" />
                  <span className="text-xs">Fetching tags list...</span>
                </div>
              ) : tagsList.length === 0 ? (
                <p className="text-xs text-slate-500 italic select-none">Select a repository to view versions</p>
              ) : (
                <div className="space-y-3 max-h-[350px] overflow-y-auto">
                  {tagsList.map((tag) => (
                    <div key={tag.name} className="p-3 bg-slate-950/40 border border-border/60 rounded flex justify-between items-center text-xs">
                      <div>
                        <div className="font-bold text-slate-200">{tag.name}</div>
                        <div className="text-[10px] text-slate-500 font-mono truncate max-w-[150px] mt-0.5">{tag.digest}</div>
                      </div>
                      <div className="flex gap-2 select-none">
                        <button 
                          onClick={() => handleViewManifest(tag.name)}
                          className="py-1 px-2 border border-border bg-slate-900 hover:bg-slate-800 text-[10px] text-slate-300 rounded"
                        >
                          Manifest
                        </button>
                        <button 
                          onClick={() => handlePullImage(tag.name)}
                          className="py-1 px-2 bg-blue-600 hover:bg-blue-500 text-[10px] text-white rounded flex items-center gap-1"
                        >
                          <Download className="w-3 h-3" />
                          Pull
                        </button>
                        <button 
                          onClick={() => handlePushImage(tag.name)}
                          className="py-1 px-2 border border-border bg-slate-900 hover:bg-slate-800 text-[10px] text-slate-300 rounded flex items-center gap-1"
                        >
                          <Upload className="w-3 h-3" />
                          Push
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Login modal dialog */}
      {loginProviderId && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 z-50 select-none">
          <div className="bg-card border border-border rounded-lg max-w-sm w-full p-5 space-y-4 shadow-2xl">
            <div className="flex justify-between items-center pb-2 border-b border-border">
              <h3 className="text-sm font-bold text-slate-200 flex items-center gap-1.5">
                <Lock className="w-4 h-4 text-blue-500" />
                Connect Registry Provider
              </h3>
              <button onClick={() => setLoginProviderId(null)} className="text-slate-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>
            
            <form onSubmit={handleLoginSubmit} className="space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Username</label>
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full bg-slate-950 border border-border rounded px-3 py-1.5 text-xs text-slate-200 focus:outline-none"
                  placeholder="Registry username"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Access Token / Password</label>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-slate-950 border border-border rounded px-3 py-1.5 text-xs text-slate-200 focus:outline-none"
                  placeholder="••••••••••••••••"
                />
              </div>

              <button
                type="submit"
                className="w-full py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded"
              >
                Authenticate Connection
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Manifest modal dialog */}
      {selectedTag && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-card border border-border rounded-lg max-w-lg w-full p-5 space-y-4 shadow-2xl flex flex-col h-[400px]">
            <div className="flex justify-between items-center pb-2 border-b border-border select-none">
              <h3 className="text-sm font-bold text-slate-200">
                Manifest layers config: <span className="text-blue-500 font-mono">{selectedTag}</span>
              </h3>
              <button 
                onClick={() => {
                  setSelectedTag(null);
                  setManifest(null);
                }} 
                className="text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-2 text-xs font-mono">
              {isLoadingManifest ? (
                <div className="flex justify-center items-center h-full text-slate-500 animate-pulse select-none">
                  <RefreshCw className="w-5 h-5 animate-spin text-blue-500 mr-2" />
                  <span>Loading layers...</span>
                </div>
              ) : !manifest ? (
                <p className="text-slate-500 italic select-none">Failed to load manifest layers details</p>
              ) : (
                <div className="space-y-3">
                  <div className="bg-slate-950/60 p-3 rounded border border-border/40 select-text">
                    <div>Schema Version: {manifest.schemaVersion}</div>
                    <div className="truncate mt-1">Media Type: {manifest.mediaType}</div>
                  </div>

                  <div className="space-y-2 select-text">
                    <div className="text-[10px] font-bold text-slate-400 uppercase select-none">Image Layers ({manifest.layers.length})</div>
                    {manifest.layers.map((layer, idx) => (
                      <div key={idx} className="p-2 bg-slate-950/30 border border-border/40 rounded space-y-0.5">
                        <div className="truncate text-slate-300">Digest: {layer.digest}</div>
                        <div className="text-slate-500 text-[10px]">Size: {(layer.sizeBytes / 1024 / 1024).toFixed(2)} MB</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Operation Progress Window */}
      {activeOpId && (
        <RegistryOperationWindow 
          operationId={activeOpId} 
          onClose={() => setActiveOpId(null)} 
        />
      )}
    </div>
  );
}

interface OpWindowProps {
  operationId: string;
  onClose: () => void;
}

function RegistryOperationWindow({ operationId, onClose }: OpWindowProps) {
  const { data: progress, isLoading } = useRegistryOperation(operationId);

  // Auto-scroll logs terminal
  const terminalEndRef = React.useRef<HTMLDivElement>(null);
  useEffect(() => {
    terminalEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [progress?.logs]);

  return (
    <div className="fixed inset-0 bg-slate-950/85 backdrop-blur-sm flex items-center justify-center p-4 z-50 select-none">
      <div className="bg-card border border-border rounded-lg max-w-3xl w-full h-[500px] overflow-hidden shadow-2xl flex flex-col">
        <div className="flex justify-between items-center p-4 border-b border-border bg-sidebar">
          <h3 className="text-sm font-bold text-slate-200 flex items-center gap-1.5">
            <Terminal className="w-4 h-4 text-blue-500 animate-pulse" />
            Registry Operation log stream
          </h3>
          <button 
            onClick={onClose}
            className="p-1 hover:bg-slate-800 text-slate-400 hover:text-white rounded transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Console stream log block */}
        <div className="flex-1 bg-black p-4 overflow-y-auto font-mono text-[11px] text-slate-300 select-text space-y-1">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center h-full text-slate-500 animate-pulse">
              <RefreshCw className="w-6 h-6 animate-spin text-blue-500 mb-1" />
              <p>Connecting to operation thread...</p>
            </div>
          ) : !progress || !progress.logs ? (
            <p className="text-slate-500 italic">Initiating task stream...</p>
          ) : (
            <>
              {progress.logs.map((line, idx) => (
                <div key={idx} className="whitespace-pre-wrap select-all">{line}</div>
              ))}
              <div ref={terminalEndRef} />
            </>
          )}
        </div>

        {/* Footer info status bar */}
        <div className="p-3 border-t border-border bg-sidebar flex justify-between items-center">
          <div className="text-[11px] text-slate-400">
            Task status: <span className="font-bold text-slate-200 capitalize">{progress?.status || 'loading'}</span>
          </div>
          <button
            onClick={onClose}
            className="py-1.5 px-4 bg-slate-900 border border-border text-slate-300 rounded text-xs hover:bg-slate-800 transition"
          >
            Close Terminal
          </button>
        </div>
      </div>
    </div>
  );
}

export default RegistryDashboard;
