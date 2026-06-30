import React, { useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { 
  Server, 
  Cpu, 
  HardDrive, 
  Activity, 
  Box, 
  Layers, 
  Network, 
  FolderSync,
  Info,
  Container,
  Pause,
  StopCircle,
  FileBadge
} from 'lucide-react';
import { fetchDashboardData } from '../api/client';
import { socketService } from '../websocket/socketService';
import { useUIStore } from '../store/uiStore';
import { DashboardCard } from '../components/dashboard/DashboardCard';
import { LoadingState } from '../components/status/LoadingState';
import { ErrorState } from '../components/status/ErrorState';
import { formatBytes } from '@dockverse/utils';
import { DashboardSummary } from '@dockverse/types';

interface DashboardPageProps {
  onRefresh: () => void;
  isRefreshing: boolean;
}

export function Dashboard({ onRefresh, isRefreshing }: DashboardPageProps) {
  const queryClient = useQueryClient();
  const setDockerStatus = useUIStore((state) => state.setDockerStatus);
  const triggerRefreshState = useUIStore((state) => state.triggerRefresh);

  const { data, isLoading, error, refetch, isFetching } = useQuery<DashboardSummary>({
    queryKey: ['dashboard'],
    queryFn: fetchDashboardData,
    refetchInterval: 15000, // Background REST fallback refetch every 15s
  });

  // Handle Socket.IO connection and events
  useEffect(() => {
    socketService.connect();

    const handleSocketUpdate = (statusData: DashboardSummary) => {
      console.log('🔄 Websocket triggered dashboard data update');
      queryClient.setQueryData(['dashboard'], statusData);
      if (statusData.status) {
        setDockerStatus(statusData.status);
      }
      triggerRefreshState();
    };

    socketService.subscribeToStatus(handleSocketUpdate);

    return () => {
      socketService.unsubscribeFromStatus(handleSocketUpdate);
    };
  }, [queryClient, setDockerStatus, triggerRefreshState]);

  // Sync state with Zustand
  useEffect(() => {
    if (data) {
      setDockerStatus(data.status);
    }
  }, [data, setDockerStatus]);

  const handleManualRetry = async () => {
    try {
      await refetch();
    } catch (err) {
      console.error(err);
    }
  };

  const handleManualRefresh = () => {
    onRefresh();
    refetch();
  };

  if (isLoading) {
    return <LoadingState />;
  }

  const isDisconnected = error || !data || data.status === 'disconnected';

  if (isDisconnected) {
    return (
      <ErrorState 
        onRetry={handleManualRetry} 
        isRetrying={isFetching} 
        errorMessage={error instanceof Error ? error.message : undefined} 
      />
    );
  }

  const info = data.info;
  if (!info) {
    return (
      <ErrorState 
        onRetry={handleManualRetry} 
        isRetrying={isFetching} 
        errorMessage="Docker info data not present in response." 
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 pb-4 border-b border-border/40 select-none">
        <div>
          <h1 className="text-xl font-bold text-slate-100 flex items-center gap-2">
            <Server className="w-5 h-5 text-blue-500" />
            Docker Connection Dashboard
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Real-time status and telemetry from local Docker daemon
          </p>
        </div>
        <button
          onClick={handleManualRefresh}
          disabled={isRefreshing || isFetching}
          className="self-start sm:self-auto py-1.5 px-3 bg-slate-900 hover:bg-slate-800 active:bg-slate-950 text-slate-300 border border-border hover:border-slate-600 disabled:opacity-50 rounded-lg text-xs font-semibold flex items-center gap-2 transition"
        >
          <FolderSync className={`w-3.5 h-3.5 ${(isRefreshing || isFetching) ? 'animate-spin text-blue-400' : ''}`} />
          {(isRefreshing || isFetching) ? 'Refreshing...' : 'Refresh'}
        </button>
      </div>

      {/* Stats Category: Docker Resources */}
      <div className="space-y-3">
        <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider select-none">Docker Resources</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <DashboardCard 
            title="Containers" 
            value={info.containers.total} 
            icon={Container} 
            description={`Running: ${info.containers.running} | Stopped: ${info.containers.stopped}`}
            accentColor="border-l-blue-500"
          />
          <DashboardCard 
            title="Images" 
            value={info.images.total} 
            icon={Layers} 
            description="Total local images"
            accentColor="border-l-indigo-500"
          />
          <DashboardCard 
            title="Networks" 
            value={info.networks.total} 
            icon={Network} 
            description="Active networks"
            accentColor="border-l-violet-500"
          />
          <DashboardCard 
            title="Volumes" 
            value={info.volumes.total} 
            icon={HardDrive} 
            description="Active persistent volumes"
            accentColor="border-l-purple-500"
          />
        </div>
      </div>

      {/* Detailed Container States */}
      <div className="space-y-3">
        <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider select-none">Container Breakdown</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <DashboardCard 
            title="Running Containers" 
            value={info.containers.running} 
            icon={Activity} 
            description="Active processes"
            accentColor="border-l-emerald-500"
          />
          <DashboardCard 
            title="Paused Containers" 
            value={info.containers.paused} 
            icon={Pause} 
            description="Suspended processes"
            accentColor="border-l-amber-500"
          />
          <DashboardCard 
            title="Stopped Containers" 
            value={info.containers.stopped} 
            icon={StopCircle} 
            description="Exited processes"
            accentColor="border-l-red-500"
          />
        </div>
      </div>

      {/* Stats Category: Docker Engine System Info */}
      <div className="space-y-3">
        <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider select-none">System Information</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <DashboardCard 
            title="Engine Version" 
            value={info.system.version} 
            icon={FileBadge} 
            description={`API version: ${info.system.apiVersion}`}
            accentColor="border-l-slate-400"
          />
          <DashboardCard 
            title="Operating System" 
            value={info.system.os} 
            icon={Info} 
            description={`Architecture: ${info.system.arch}`}
            accentColor="border-l-slate-400"
          />
          <DashboardCard 
            title="CPU Allocation" 
            value={`${info.system.cpus} Cores`} 
            icon={Cpu} 
            description="Allocated virtual cores"
            accentColor="border-l-slate-400"
          />
          <DashboardCard 
            title="Memory Allocation" 
            value={formatBytes(info.system.memory)} 
            icon={HardDrive} 
            description="Total RAM allocated to VM"
            accentColor="border-l-slate-400"
          />
        </div>
      </div>

      {/* Miscellaneous Details */}
      <div className="bg-card border border-border/80 rounded-lg p-5">
        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider select-none mb-3">Docker Environment</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-mono">
          <div className="flex justify-between py-2 border-b border-border/40">
            <span className="text-slate-500">Root Directory</span>
            <span className="text-slate-300 break-all select-all">{info.system.dockerRootDir}</span>
          </div>
          <div className="flex justify-between py-2 border-b border-border/40">
            <span className="text-slate-500">Uptime</span>
            <span className="text-slate-300">N/A</span>
          </div>
        </div>
      </div>
    </div>
  );
}
export default Dashboard;
