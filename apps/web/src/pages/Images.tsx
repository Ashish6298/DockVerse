import React, { useState } from 'react';
import { 
  Layers, 
  Search, 
  Trash2, 
  Tag, 
  Info, 
  X, 
  AlertTriangle, 
  Download, 
  RefreshCw, 
  Settings, 
  User,
  History
} from 'lucide-react';
import { useImages, useImage } from '../hooks/useImages';
import { formatBytes } from '@dockverse/utils';

export function Images() {
  const {
    images,
    isLoading,
    isError,
    error,
    refetch,
    isFetching,
    pullImage,
    deleteImage,
    tagImage,
    pruneImages,
    isPulling,
    isPruning
  } = useImages();

  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<'name' | 'size' | 'created'>('name');

  // Modals & Panels
  const [selectedImageId, setSelectedImageId] = useState<string | null>(null);
  const [isPullModalOpen, setIsPullModalOpen] = useState(false);
  const [isTagModalImageId, setIsTagModalImageId] = useState<string | null>(null);
  const [tagRepo, setTagRepo] = useState('');
  const [tagValue, setTagValue] = useState('latest');
  
  // Confirms
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [isPruningConfirmOpen, setIsPruningConfirmOpen] = useState(false);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);

  // Form State
  const [pullImageRef, setPullImageRef] = useState('');
  const [pullTagRef, setPullTagRef] = useState('latest');
  const [pullError, setPullError] = useState<string | null>(null);
  const [tagError, setTagError] = useState<string | null>(null);

  const handlePull = async (e: React.FormEvent) => {
    e.preventDefault();
    setPullError(null);
    if (!pullImageRef.trim()) {
      setPullError('Image reference is required');
      return;
    }

    setActionLoadingId('pull');
    try {
      await pullImage({ fromImage: pullImageRef.trim(), tag: pullTagRef.trim() });
      setIsPullModalOpen(false);
      setPullImageRef('');
      setPullTagRef('latest');
    } catch (err: any) {
      setPullError(err.message || 'Failed to pull image');
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleTag = async (e: React.FormEvent) => {
    e.preventDefault();
    setTagError(null);
    if (!isTagModalImageId || !tagRepo.trim()) {
      setTagError('Repository name is required');
      return;
    }

    try {
      await tagImage({ id: isTagModalImageId, repo: tagRepo.trim(), tag: tagValue.trim() });
      setIsTagModalImageId(null);
      setTagRepo('');
      setTagValue('latest');
    } catch (err: any) {
      setTagError(err.message || 'Failed to tag image');
    }
  };

  const handleDelete = async (id: string) => {
    setActionLoadingId(id);
    try {
      await deleteImage({ id, force: true });
      setConfirmDeleteId(null);
    } catch (err: any) {
      alert(err.message || 'Deletion failed');
    } finally {
      setActionLoadingId(null);
    }
  };

  const handlePrune = async () => {
    setActionLoadingId('prune');
    try {
      const result = await pruneImages();
      setIsPruningConfirmOpen(false);
      alert(`Pruned successfully. Reclaimed ${formatBytes(result.spaceReclaimed)}.`);
    } catch (err: any) {
      alert(err.message || 'Prune failed');
    } finally {
      setActionLoadingId(null);
    }
  };

  const filteredImages = images
    .filter((img) => {
      const matchSearch = img.id.toLowerCase().includes(searchTerm.toLowerCase()) || 
        img.tags.some(t => t.toLowerCase().includes(searchTerm.toLowerCase()));
      return matchSearch;
    })
    .sort((a, b) => {
      if (sortBy === 'name') {
        const nameA = a.tags[0] || a.id;
        const nameB = b.tags[0] || b.id;
        return nameA.localeCompare(nameB);
      }
      if (sortBy === 'size') {
        return b.size - a.size;
      }
      return b.created - a.created;
    });

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-slate-500 animate-pulse">
        <Layers className="w-8 h-8 text-blue-500 animate-bounce mb-2" />
        <p className="text-xs">Loading local images...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 pb-4 border-b border-border/40 select-none">
        <div>
          <h1 className="text-xl font-bold text-slate-100 flex items-center gap-2">
            <Layers className="w-5 h-5 text-blue-500" />
            Image Manager
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Pull, tag, inspect, and remove Docker Engine local images
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => refetch()}
            disabled={isFetching}
            className="py-1.5 px-3 bg-slate-900 hover:bg-slate-800 active:bg-slate-950 text-slate-300 border border-border hover:border-slate-600 disabled:opacity-50 rounded-lg text-xs font-semibold flex items-center gap-2 transition"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isFetching ? 'animate-spin text-blue-400' : ''}`} />
            Refresh
          </button>
          <button
            onClick={() => setIsPruningConfirmOpen(true)}
            disabled={isPruning}
            className="py-1.5 px-3 bg-slate-900 hover:bg-red-950 hover:text-red-300 hover:border-red-900 text-slate-400 border border-border rounded-lg text-xs font-semibold flex items-center gap-2 transition"
          >
            Prune Unused
          </button>
          <button
            onClick={() => setIsPullModalOpen(true)}
            className="py-1.5 px-3 bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white rounded-lg text-xs font-semibold flex items-center gap-2 transition"
          >
            <Download className="w-3.5 h-3.5" />
            Pull Image
          </button>
        </div>
      </div>

      {isError && (
        <div className="bg-red-500/10 border border-red-500/30 text-red-400 p-4 rounded-lg flex items-center gap-3 text-xs">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          <span>Error loading images: {error instanceof Error ? error.message : 'Unreachable Docker Engine'}</span>
        </div>
      )}

      {/* Toolbar */}
      <div className="flex flex-col md:flex-row justify-between items-center gap-3 bg-card border border-border/60 p-3 rounded-lg select-none">
        <div className="relative w-full md:w-80">
          <Search className="absolute left-3 top-2.5 w-3.5 h-3.5 text-slate-500" />
          <input 
            type="text" 
            placeholder="Search images by repository or tag name..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-slate-950 border border-border rounded pl-9 pr-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-blue-500 transition"
          />
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto justify-end">
          <span className="text-[11px] text-slate-400">Sort By:</span>
          <select 
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="bg-slate-950 border border-border rounded px-2 py-1 text-xs text-slate-300 focus:outline-none focus:border-blue-500"
          >
            <option value="name">Repository Tag</option>
            <option value="size">Size</option>
            <option value="created">Created Date</option>
          </select>
        </div>
      </div>

      {/* Grid list */}
      {filteredImages.length === 0 ? (
        <div className="bg-card border border-border/65 rounded-lg p-10 flex flex-col items-center justify-center text-center space-y-3">
          <Layers className="w-12 h-12 text-slate-600" />
          <h3 className="text-sm font-semibold text-slate-300">No Docker Images Found</h3>
          <p className="text-xs text-slate-500 max-w-sm">
            Local image store is empty. Pull an image from Docker Hub using the pull option in the header.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {filteredImages.map((img) => {
            const hasTag = img.tags.length > 0;
            const primaryTag = hasTag ? img.tags[0] : '<none>:<none>';
            const cleanId = img.id.replace(/^sha256:/, '').slice(0, 12);
            
            return (
              <div 
                key={img.id}
                className="bg-card border border-border hover:border-slate-700 rounded-lg p-4 flex flex-col justify-between transition group relative"
              >
                <div className="space-y-3">
                  <div className="flex justify-between items-start">
                    <div className="space-y-1 truncate pr-6">
                      <h3 
                        onClick={() => setSelectedImageId(img.id)}
                        className="text-sm font-bold text-slate-200 group-hover:text-blue-400 cursor-pointer transition truncate"
                        title={primaryTag}
                      >
                        {primaryTag}
                      </h3>
                      <p className="text-[10px] font-mono text-slate-500 select-all shrink-0">
                        {cleanId}
                      </p>
                    </div>
                  </div>

                  <div className="space-y-1.5 text-xs text-slate-400">
                    {img.tags.length > 1 && (
                      <div className="flex flex-wrap gap-1 pb-1">
                        {img.tags.slice(1).map((t, idx) => (
                          <span key={idx} className="px-1.5 py-0.5 bg-slate-900 border border-border rounded text-[9px] font-mono text-slate-400 truncate max-w-[120px]">{t}</span>
                        ))}
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span className="text-slate-500 text-[11px]">Size:</span>
                      <span className="text-[11px]">{formatBytes(img.size)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500 text-[11px]">Created:</span>
                      <span className="text-[11px]">{new Date(img.created * 1000).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>

                {/* Operations buttons */}
                <div className="mt-5 pt-3 border-t border-border/40 flex justify-between items-center gap-2 select-none">
                  <button 
                    onClick={() => {
                      setIsTagModalImageId(img.id);
                      setTagRepo(primaryTag.split(':')[0] || '');
                    }}
                    className="p-1.5 hover:bg-slate-800 text-slate-400 hover:text-white border border-border rounded transition flex items-center gap-1 text-[11px]"
                    title="Tag image"
                  >
                    <Tag className="w-3.5 h-3.5" />
                    Tag
                  </button>

                  <div className="flex gap-1.5">
                    <button 
                      onClick={() => setSelectedImageId(img.id)}
                      className="p-1.5 bg-slate-900 hover:bg-slate-800 text-slate-300 border border-border rounded transition flex items-center gap-1 text-[11px] font-semibold"
                      title="Inspect settings and build layers"
                    >
                      <Info className="w-3.5 h-3.5" />
                      Details
                    </button>

                    <button 
                      onClick={() => setConfirmDeleteId(img.id)}
                      disabled={actionLoadingId === img.id}
                      className="p-1.5 hover:bg-red-950 text-slate-500 hover:text-red-400 border border-border hover:border-red-900 rounded transition"
                      title="Delete image"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Confirm Delete Overlay */}
                {confirmDeleteId === img.id && (
                  <div className="absolute inset-0 bg-slate-950/95 rounded-lg p-4 flex flex-col justify-between z-10 border border-red-500/40">
                    <div className="space-y-1.5">
                      <h4 className="text-xs font-bold text-red-400 flex items-center gap-1.5">
                        <AlertTriangle className="w-3.5 h-3.5" />
                        Delete Image
                      </h4>
                      <p className="text-[11px] text-slate-400">
                        Are you sure you want to permanently delete image? It will be untagged. If containers rely on it, deletion may fail.
                      </p>
                    </div>
                    <div className="flex gap-2 justify-end">
                      <button 
                        onClick={() => setConfirmDeleteId(null)}
                        className="px-2.5 py-1 bg-slate-900 border border-border text-slate-400 rounded text-xs transition"
                      >
                        Cancel
                      </button>
                      <button 
                        onClick={() => handleDelete(img.id)}
                        className="px-2.5 py-1 bg-red-600 hover:bg-red-500 text-white rounded text-xs transition"
                      >
                        Confirm
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Details Slide Panel */}
      {selectedImageId && (
        <DetailsPanel 
          id={selectedImageId} 
          onClose={() => setSelectedImageId(null)} 
        />
      )}

      {/* Pull Image Modal */}
      {isPullModalOpen && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-card border border-border rounded-lg max-w-md w-full overflow-hidden shadow-2xl flex flex-col">
            <div className="flex justify-between items-center p-4 border-b border-border bg-sidebar select-none">
              <h3 className="text-sm font-bold text-slate-200 flex items-center gap-1.5">
                <Download className="w-4 h-4 text-blue-500" />
                Pull Image Registry
              </h3>
              <button 
                onClick={() => setIsPullModalOpen(false)}
                className="p-1 hover:bg-slate-800 text-slate-400 hover:text-white rounded transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handlePull} className="p-4 space-y-4">
              {pullError && (
                <div className="bg-red-500/10 border border-red-500/30 text-red-400 p-3 rounded text-xs">
                  {pullError}
                </div>
              )}

              {actionLoadingId === 'pull' ? (
                <div className="py-6 flex flex-col items-center justify-center space-y-3">
                  <RefreshCw className="w-8 h-8 text-blue-500 animate-spin" />
                  <p className="text-xs text-slate-400">Downloading image layers. Please wait...</p>
                </div>
              ) : (
                <>
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-400">Registry Image Name *</label>
                    <input 
                      type="text" 
                      value={pullImageRef} 
                      onChange={(e) => setPullImageRef(e.target.value)}
                      placeholder="e.g. redis, postgres, node"
                      className="w-full bg-slate-950 border border-border rounded p-2 text-xs text-slate-200 focus:outline-none focus:border-blue-500 transition"
                      required
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-400">Tag Reference</label>
                    <input 
                      type="text" 
                      value={pullTagRef} 
                      onChange={(e) => setPullTagRef(e.target.value)}
                      placeholder="e.g. latest, alpine, 20-bullseye"
                      className="w-full bg-slate-950 border border-border rounded p-2 text-xs text-slate-200 focus:outline-none focus:border-blue-500 transition"
                    />
                  </div>

                  <div className="flex justify-end gap-2 pt-2 border-t border-border/40 select-none">
                    <button 
                      type="button"
                      onClick={() => setIsPullModalOpen(false)}
                      className="py-2 px-4 bg-slate-900 hover:bg-slate-800 border border-border text-slate-400 rounded text-xs transition"
                    >
                      Cancel
                    </button>
                    <button 
                      type="submit"
                      disabled={isPulling}
                      className="py-2 px-4 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white rounded text-xs transition"
                    >
                      Pull
                    </button>
                  </div>
                </>
              )}
            </form>
          </div>
        </div>
      )}

      {/* Tag Image Modal */}
      {isTagModalImageId && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-card border border-border rounded-lg max-w-md w-full overflow-hidden shadow-2xl flex flex-col">
            <div className="flex justify-between items-center p-4 border-b border-border bg-sidebar select-none">
              <h3 className="text-sm font-bold text-slate-200">Tag Docker Image</h3>
              <button 
                onClick={() => setIsTagModalImageId(null)}
                className="p-1 hover:bg-slate-800 text-slate-400 hover:text-white rounded transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleTag} className="p-4 space-y-4">
              {tagError && (
                <div className="bg-red-500/10 border border-red-500/30 text-red-400 p-3 rounded text-xs">
                  {tagError}
                </div>
              )}

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-400">Repository Name *</label>
                <input 
                  type="text" 
                  value={tagRepo} 
                  onChange={(e) => setTagRepo(e.target.value)}
                  placeholder="e.g. my-app, custom-image"
                  className="w-full bg-slate-950 border border-border rounded p-2 text-xs text-slate-200 focus:outline-none focus:border-blue-500 transition"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-400">Tag</label>
                <input 
                  type="text" 
                  value={tagValue} 
                  onChange={(e) => setTagValue(e.target.value)}
                  placeholder="e.g. latest, v1.0.0"
                  className="w-full bg-slate-950 border border-border rounded p-2 text-xs text-slate-200 focus:outline-none focus:border-blue-500 transition"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-border/40 select-none">
                <button 
                  type="button"
                  onClick={() => setIsTagModalImageId(null)}
                  className="py-2 px-4 bg-slate-900 hover:bg-slate-800 border border-border text-slate-400 rounded text-xs transition"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="py-2 px-4 bg-blue-600 hover:bg-blue-500 text-white rounded text-xs transition"
                >
                  Apply Tag
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Pruning Confirm Modal */}
      {isPruningConfirmOpen && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-card border border-border rounded-lg max-w-sm w-full overflow-hidden shadow-2xl p-4 space-y-4">
            <h3 className="text-sm font-bold text-red-400 flex items-center gap-1.5 select-none">
              <AlertTriangle className="w-4 h-4" />
              Prune Unused Images
            </h3>
            <p className="text-xs text-slate-400">
              Are you sure you want to delete all dangling/unused Docker images? This cannot be undone and will delete images that are not associated with at least one container.
            </p>
            <div className="flex gap-2 justify-end select-none">
              <button 
                onClick={() => setIsPruningConfirmOpen(false)}
                className="py-1.5 px-3 bg-slate-900 border border-border text-slate-400 rounded text-xs transition"
              >
                Cancel
              </button>
              <button 
                onClick={handlePrune}
                disabled={actionLoadingId === 'prune'}
                className="py-1.5 px-3 bg-red-600 hover:bg-red-500 text-white rounded text-xs transition"
              >
                Confirm Prune
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

interface DetailsPanelProps {
  id: string;
  onClose: () => void;
}

function DetailsPanel({ id, onClose }: DetailsPanelProps) {
  const { image, history, isLoading, isLoadingHistory } = useImage(id);
  const [activeTab, setActiveTab] = useState<'inspect' | 'history'>('inspect');

  if (isLoading) {
    return (
      <div className="fixed inset-y-0 right-0 w-full md:w-[600px] bg-sidebar border-l border-border shadow-2xl p-6 flex flex-col justify-center items-center text-slate-500 z-40">
        <Layers className="w-8 h-8 text-blue-500 animate-bounce mb-2" />
        <p className="text-xs">Loading image details...</p>
      </div>
    );
  }

  if (!image) {
    return (
      <div className="fixed inset-y-0 right-0 w-full md:w-[600px] bg-sidebar border-l border-border shadow-2xl p-6 flex flex-col justify-center items-center text-slate-500 z-40">
        <p className="text-xs">Failed to fetch image details</p>
        <button onClick={onClose} className="mt-4 px-3 py-1.5 bg-slate-900 border border-border rounded text-xs">
          Close
        </button>
      </div>
    );
  }

  return (
    <div className="fixed inset-y-0 right-0 w-full md:w-[600px] bg-sidebar border-l border-border shadow-2xl flex flex-col z-40 select-none">
      {/* Panel Header */}
      <div className="p-4 border-b border-border bg-card flex justify-between items-center">
        <div className="space-y-1 pr-6 truncate">
          <h3 className="text-sm font-bold text-slate-200 flex items-center gap-1.5 truncate">
            <Layers className="w-4 h-4 text-blue-500 shrink-0" />
            {image.tags[0] || 'Image Details'}
          </h3>
          <p className="text-[10px] font-mono text-slate-500 select-all truncate">{image.id}</p>
        </div>
        <button 
          onClick={onClose}
          className="p-1 hover:bg-slate-800 text-slate-400 hover:text-white rounded transition"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-border bg-card">
        <button 
          onClick={() => setActiveTab('inspect')}
          className={`flex-1 py-2 text-center text-xs font-semibold border-b-2 transition ${
            activeTab === 'inspect' ? 'border-blue-500 text-blue-400 bg-slate-950/20' : 'border-transparent text-slate-400 hover:bg-slate-900/40'
          }`}
        >
          <Settings className="w-3.5 h-3.5 inline mr-1.5" />
          Configurations
        </button>
        <button 
          onClick={() => setActiveTab('history')}
          className={`flex-1 py-2 text-center text-xs font-semibold border-b-2 transition ${
            activeTab === 'history' ? 'border-blue-500 text-blue-400 bg-slate-950/20' : 'border-transparent text-slate-400 hover:bg-slate-900/40'
          }`}
        >
          <History className="w-3.5 h-3.5 inline mr-1.5" />
          Build Layers History
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 bg-slate-950/30">
        {activeTab === 'inspect' ? (
          <div className="space-y-5">
            {/* System Info */}
            <div className="bg-card border border-border/60 rounded-lg p-4 space-y-3">
              <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider">Image Metadata</h4>
              <div className="grid grid-cols-2 gap-3 text-xs font-mono text-slate-400">
                <div>
                  OS: <span className="text-slate-200 capitalize">{image.os}</span>
                </div>
                <div>
                  Architecture: <span className="text-slate-200">{image.architecture}</span>
                </div>
                <div>
                  Size: <span className="text-slate-200">{formatBytes(image.size)}</span>
                </div>
                <div>
                  Docker Version: <span className="text-slate-200">{image.dockerVersion || 'N/A'}</span>
                </div>
              </div>
            </div>

            {/* Author */}
            {image.author && (
              <div className="bg-card border border-border/60 rounded-lg p-4 space-y-2">
                <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-slate-400" />
                  Author Info
                </h4>
                <p className="text-xs text-slate-400 font-mono select-text truncate">{image.author}</p>
              </div>
            )}

            {/* Config CMD / Entrypoint */}
            <div className="bg-card border border-border/60 rounded-lg p-4 space-y-3">
              <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider">Startup Directives</h4>
              <div className="space-y-2 text-xs font-mono">
                <div>
                  <span className="text-slate-500">Entrypoint:</span>
                  <div className="bg-slate-950 p-2 border border-border/60 rounded text-[10px] text-slate-300 select-text truncate mt-1">
                    {image.entrypoint && image.entrypoint.length > 0 ? image.entrypoint.join(' ') : 'none'}
                  </div>
                </div>
                <div>
                  <span className="text-slate-500">Command:</span>
                  <div className="bg-slate-950 p-2 border border-border/60 rounded text-[10px] text-slate-300 select-text truncate mt-1">
                    {image.cmd && image.cmd.length > 0 ? image.cmd.join(' ') : 'none'}
                  </div>
                </div>
              </div>
            </div>

            {/* Environment Variables */}
            <div className="bg-card border border-border/60 rounded-lg p-4 space-y-3">
              <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider">Environment Variables</h4>
              {!image.env || image.env.length === 0 ? (
                <p className="text-xs text-slate-500 italic text-[11px]">No variables declared</p>
              ) : (
                <div className="bg-slate-950 p-2 border border-border/60 rounded font-mono text-[10px] text-slate-300 max-h-48 overflow-y-auto space-y-1 select-text">
                  {image.env.map((e, idx) => (
                    <div key={idx} className="truncate select-all">{e}</div>
                  ))}
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider select-none mb-1">Image Layers</h4>
            {isLoadingHistory ? (
              <p className="text-xs text-slate-500 italic">Reading layer history...</p>
            ) : history.length === 0 ? (
              <p className="text-xs text-slate-500 italic">No build layer history returned</p>
            ) : (
              <div className="space-y-3">
                {history.map((layer, idx) => (
                  <div key={idx} className="bg-card border border-border/60 rounded p-3 text-xs font-mono space-y-1">
                    <div className="flex justify-between items-center text-[10px] select-none text-slate-500 border-b border-border/30 pb-1 mb-1.5">
                      <span>Layer {idx + 1}</span>
                      <span>{formatBytes(layer.size)}</span>
                    </div>
                    <div className="text-slate-400 select-text truncate" title={layer.createdBy}>
                      Created By: <span className="text-slate-300">{layer.createdBy || '<empty command>'}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default Images;
