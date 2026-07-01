import React, { useState } from 'react';
import { 
  Briefcase, 
  Plus, 
  Trash2, 
  Edit, 
  X, 
  FolderSync, 
  AlertCircle
} from 'lucide-react';
import { useWorkspaces } from '../hooks/useWorkspaces';
import type { Workspace, WorkspaceResource } from '@dockverse/types';


export function Workspaces() {
  const { 
    workspaces, 
    isLoading, 
    isError, 
    error, 
    refetch, 
    isFetching,
    createWorkspace,
    updateWorkspace,
    deleteWorkspace,
    isCreating,
    isUpdating,
    isDeleting
  } = useWorkspaces();

  // Local state for modals and forms
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingWorkspace, setEditingWorkspace] = useState<Workspace | null>(null);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [resources, setResources] = useState<WorkspaceResource[]>([]);
  const [newResourceType, setNewResourceType] = useState<'container' | 'image' | 'network' | 'volume'>('container');
  const [newResourceId, setNewResourceId] = useState('');
  
  // Destructive deletion confirmation state
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  const handleOpenCreate = () => {
    setEditingWorkspace(null);
    setName('');
    setDescription('');
    setResources([]);
    setFormError(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (ws: Workspace) => {
    setEditingWorkspace(ws);
    setName(ws.name);
    setDescription(ws.description || '');
    setResources(ws.resources || []);
    setFormError(null);
    setIsModalOpen(true);
  };

  const handleAddResource = () => {
    if (!newResourceId.trim()) return;
    setResources([...resources, { type: newResourceType, id: newResourceId.trim() }]);
    setNewResourceId('');
  };

  const handleRemoveResource = (index: number) => {
    setResources(resources.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!name.trim()) {
      setFormError('Workspace name is required');
      return;
    }

    try {
      if (editingWorkspace) {
        await updateWorkspace({
          id: editingWorkspace._id,
          input: { name: name.trim(), description: description.trim(), resources }
        });
      } else {
        await createWorkspace({
          name: name.trim(),
          description: description.trim(),
          resources
        });
      }
      setIsModalOpen(false);
    } catch (err: any) {
      setFormError(err.message || 'An error occurred while saving the workspace');
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteWorkspace(id);
      setConfirmDeleteId(null);
    } catch (err: any) {
      alert(err.message || 'Failed to delete workspace');
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-slate-500 animate-pulse">
        <Briefcase className="w-8 h-8 text-blue-500 animate-bounce mb-2" />
        <p className="text-xs">Loading Workspaces...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 pb-4 border-b border-border/40 select-none">
        <div>
          <h1 className="text-xl font-bold text-slate-100 flex items-center gap-2">
            <Briefcase className="w-5 h-5 text-blue-500" />
            Workspace Manager
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Group containers, networks, and images into isolated execution workspaces
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => refetch()}
            disabled={isFetching}
            className="py-1.5 px-3 bg-slate-900 hover:bg-slate-800 active:bg-slate-950 text-slate-300 border border-border hover:border-slate-600 disabled:opacity-50 rounded-lg text-xs font-semibold flex items-center gap-2 transition"
          >
            <FolderSync className={`w-3.5 h-3.5 ${isFetching ? 'animate-spin text-blue-400' : ''}`} />
            Refresh
          </button>
          <button
            onClick={handleOpenCreate}
            className="py-1.5 px-3 bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white rounded-lg text-xs font-semibold flex items-center gap-2 transition"
          >
            <Plus className="w-3.5 h-3.5" />
            New Workspace
          </button>
        </div>
      </div>

      {isError && (
        <div className="bg-red-500/10 border border-red-500/30 text-red-400 p-4 rounded-lg flex items-center gap-3 text-xs">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>Error loading workspaces: {error instanceof Error ? error.message : 'Unknown connection error'}</span>
        </div>
      )}

      {/* Workspace List Grid */}
      {workspaces.length === 0 ? (
        <div className="bg-card border border-border/65 rounded-lg p-10 flex flex-col items-center justify-center text-center space-y-3">
          <Briefcase className="w-12 h-12 text-slate-600" />
          <h3 className="text-sm font-semibold text-slate-300">No Workspaces Found</h3>
          <p className="text-xs text-slate-500 max-w-sm">
            Create a custom workspace to group containers, volumes, networks, and images for easy multi-resource tracking.
          </p>
          <button
            onClick={handleOpenCreate}
            className="py-1.5 px-3 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition"
          >
            <Plus className="w-3.5 h-3.5" />
            Get Started
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {workspaces.map((ws) => (
            <div 
              key={ws._id}
              className="bg-card border border-border hover:border-slate-700 rounded-lg p-5 flex flex-col justify-between transition group relative"
            >
              <div className="space-y-3">
                <div className="flex justify-between items-start">
                  <h3 className="text-sm font-bold text-slate-200 group-hover:text-blue-400 transition truncate pr-8">
                    {ws.name}
                  </h3>
                  <div className="flex gap-1.5">
                    <button 
                      onClick={() => handleOpenEdit(ws)}
                      className="p-1 hover:bg-slate-800 text-slate-500 hover:text-slate-300 rounded transition"
                      title="Edit workspace"
                    >
                      <Edit className="w-3.5 h-3.5" />
                    </button>
                    <button 
                      onClick={() => setConfirmDeleteId(ws._id)}
                      className="p-1 hover:bg-slate-800 text-slate-500 hover:text-red-400 rounded transition"
                      title="Delete workspace"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <p className="text-xs text-slate-400 line-clamp-2">
                  {ws.description || 'No description provided.'}
                </p>

                {/* Resource summaries */}
                <div className="pt-2 border-t border-border/40 grid grid-cols-2 gap-2 text-[11px] font-mono text-slate-500">
                  <div>
                    Type: <span className="text-slate-300">Docker Workspace</span>
                  </div>
                  <div>
                    Resources: <span className="text-slate-300">{ws.resources?.length || 0} items</span>
                  </div>
                </div>
              </div>

              <div className="mt-4 flex justify-between items-center text-[10px] text-slate-500 select-none">
                <span>Created: {new Date(ws.createdAt).toLocaleDateString()}</span>
                <span className="px-2 py-0.5 bg-slate-900 border border-border rounded text-blue-400">
                  Active
                </span>
              </div>

              {/* Deletion Dialog Overlay inside individual card */}
              {confirmDeleteId === ws._id && (
                <div className="absolute inset-0 bg-slate-950/90 rounded-lg p-5 flex flex-col justify-between z-10 border border-red-500/40">
                  <div className="space-y-2">
                    <h4 className="text-xs font-bold text-red-400 flex items-center gap-1.5">
                      <AlertCircle className="w-3.5 h-3.5" />
                      Confirm Deletion
                    </h4>
                    <p className="text-[11px] text-slate-400">
                      Are you sure you want to delete workspace <strong>{ws.name}</strong>? This action is irreversible. Associated containers will not be destroyed.
                    </p>
                  </div>
                  <div className="flex gap-2 justify-end">
                    <button 
                      onClick={() => setConfirmDeleteId(null)}
                      className="px-2.5 py-1 bg-slate-900 border border-border hover:bg-slate-800 text-slate-400 rounded text-xs transition"
                    >
                      Cancel
                    </button>
                    <button 
                      onClick={() => handleDelete(ws._id)}
                      disabled={isDeleting}
                      className="px-2.5 py-1 bg-red-600 hover:bg-red-500 text-white rounded text-xs transition"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Create / Edit Modal Dialog */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-card border border-border rounded-lg max-w-lg w-full overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
            {/* Header */}
            <div className="flex justify-between items-center p-4 border-b border-border bg-sidebar select-none">
              <h3 className="text-sm font-bold text-slate-200">
                {editingWorkspace ? 'Edit Workspace' : 'Create New Workspace'}
              </h3>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="p-1 hover:bg-slate-800 text-slate-400 hover:text-white rounded transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Form Content */}
            <form onSubmit={handleSubmit} className="p-4 space-y-4 overflow-y-auto flex-1">
              {formError && (
                <div className="bg-red-500/10 border border-red-500/30 text-red-400 p-3 rounded text-xs">
                  {formError}
                </div>
              )}

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-400">Workspace Name *</label>
                <input 
                  type="text" 
                  value={name} 
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Production Cluster, Local Test Environment"
                  className="w-full bg-slate-950 border border-border rounded p-2 text-xs text-slate-200 focus:outline-none focus:border-blue-500 transition"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-400">Description</label>
                <textarea 
                  value={description} 
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Short description of this workspace's purpose"
                  rows={3}
                  className="w-full bg-slate-950 border border-border rounded p-2 text-xs text-slate-200 focus:outline-none focus:border-blue-500 transition resize-none"
                />
              </div>

              {/* Associated Docker Resources section */}
              <div className="space-y-3 pt-2 border-t border-border/40">
                <label className="text-xs font-semibold text-slate-400">Associated Docker Resources</label>
                
                {/* Resource additions */}
                <div className="flex gap-2">
                  <select 
                    value={newResourceType}
                    onChange={(e) => setNewResourceType(e.target.value as any)}
                    className="bg-slate-950 border border-border rounded px-2 py-1.5 text-xs text-slate-300 focus:outline-none focus:border-blue-500"
                  >
                    <option value="container">Container ID</option>
                    <option value="image">Image Tag</option>
                    <option value="network">Network Name</option>
                    <option value="volume">Volume Name</option>
                  </select>
                  <input 
                    type="text" 
                    value={newResourceId} 
                    onChange={(e) => setNewResourceId(e.target.value)}
                    placeholder="Enter ID or name"
                    className="flex-1 bg-slate-950 border border-border rounded px-2 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-blue-500 transition"
                  />
                  <button 
                    type="button"
                    onClick={handleAddResource}
                    className="py-1.5 px-3 bg-slate-900 hover:bg-slate-800 text-slate-300 border border-border rounded text-xs transition"
                  >
                    Add
                  </button>
                </div>

                {/* Added resource tags list */}
                {resources.length === 0 ? (
                  <p className="text-[11px] text-slate-500 italic">No resources added to this workspace yet.</p>
                ) : (
                  <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto p-2 border border-border/40 rounded bg-slate-950/40">
                    {resources.map((res, index) => (
                      <div 
                        key={index} 
                        className="flex items-center gap-1.5 px-2 py-1 bg-slate-900 border border-border text-[10px] rounded font-mono text-slate-300"
                      >
                        <span className="text-blue-400 capitalize">{res.type}:</span>
                        <span className="truncate max-w-[120px]">{res.id}</span>
                        <button 
                          type="button" 
                          onClick={() => handleRemoveResource(index)}
                          className="hover:text-red-400 text-slate-500 transition"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end gap-2 pt-4 border-t border-border/40 select-none">
                <button 
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="py-2 px-4 bg-slate-900 hover:bg-slate-800 border border-border text-slate-400 rounded text-xs transition"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  disabled={isCreating || isUpdating}
                  className="py-2 px-4 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white rounded text-xs transition"
                >
                  {editingWorkspace ? 'Save Changes' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default Workspaces;
