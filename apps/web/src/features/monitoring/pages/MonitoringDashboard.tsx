import React, { useState, useEffect } from 'react';
import { 
  Activity, 
  Cpu, 
  Database, 
  Network, 
  HardDrive, 
  RefreshCw, 
  TrendingUp, 
  List
} from 'lucide-react';
import { useMonitoringSummary } from '../hooks/useMonitoring';
import { fetchContainerStats } from '../api/monitoringApi';
import type { ContainerMetricPoint } from '@dockverse/types';

export function MonitoringDashboard() {
  const { data: summary, isLoading: isLoadingSummary } = useMonitoringSummary();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  
  // Custom polling for containers list stats
  const [containersStats, setContainersStats] = useState<Record<string, ContainerMetricPoint[]>>({});
  const [runningList, setRunningList] = useState<any[]>([]);

  useEffect(() => {
    async function loadContainers() {
      try {
        const response = await fetch('/api/v1/containers');
        if (response.ok) {
          const result = await response.json();
          const running = (result.data || []).filter((c: any) => c.state === 'running');
          setRunningList(running);
          
          if (running.length > 0 && !selectedId) {
            setSelectedId(running[0].id);
          }

          // Fetch metric point for each running container
          for (const c of running) {
            try {
              const metrics = await fetchContainerStats(c.id);
              setContainersStats(prev => ({
                ...prev,
                [c.id]: metrics.points
              }));
            } catch {
              // Gracefully swallow stats error
            }
          }
        }
      } catch {
        // Safe check fallback
      }
    }

    loadContainers();
    const interval = setInterval(loadContainers, 5000);
    return () => clearInterval(interval);
  }, [selectedId]);

  const activeStats = selectedId ? containersStats[selectedId] || [] : [];
  const selectedContainer = runningList.find(c => c.id === selectedId);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 pb-4 border-b border-border/40 select-none">
        <div>
          <h1 className="text-xl font-bold text-slate-100 flex items-center gap-2">
            <Activity className="w-5 h-5 text-blue-500" />
            Live Monitoring Platform
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Realtime host telemetry, microservice resource allocation, and historical metrics graph analytics
          </p>
        </div>
      </div>

      {/* Summary grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 select-none">
        <div className="bg-card border border-border/60 p-4 rounded-lg flex items-center gap-4">
          <div className="p-3 bg-blue-500/10 rounded-lg text-blue-500">
            <Cpu className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Total CPU Load</div>
            <div className="text-xl font-bold text-slate-100 mt-0.5">
              {isLoadingSummary ? '...' : `${summary?.totalCpuPercent || 0}%`}
            </div>
          </div>
        </div>

        <div className="bg-card border border-border/60 p-4 rounded-lg flex items-center gap-4">
          <div className="p-3 bg-green-500/10 rounded-lg text-green-500">
            <Database className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Total Memory Load</div>
            <div className="text-xl font-bold text-slate-100 mt-0.5">
              {isLoadingSummary ? '...' : `${((summary?.totalMemoryBytes || 0) / 1024 / 1024).toFixed(1)} MB`}
            </div>
          </div>
        </div>

        <div className="bg-card border border-border/60 p-4 rounded-lg flex items-center gap-4">
          <div className="p-3 bg-yellow-500/10 rounded-lg text-yellow-500">
            <Network className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Network IO Rate</div>
            <div className="text-xl font-bold text-slate-100 mt-0.5">
              {isLoadingSummary ? '...' : `${((summary?.totalNetworkRxBytes || 0) / 1024 / 1024).toFixed(2)} MB RX`}
            </div>
          </div>
        </div>

        <div className="bg-card border border-border/60 p-4 rounded-lg flex items-center gap-4">
          <div className="p-3 bg-purple-500/10 rounded-lg text-purple-500">
            <TrendingUp className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Monitored Stacks</div>
            <div className="text-xl font-bold text-slate-100 mt-0.5">
              {isLoadingSummary ? '...' : `${summary?.runningContainersCount || 0} active`}
            </div>
          </div>
        </div>
      </div>

      {/* Main monitoring workspace */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        
        {/* Left col: Containers selector */}
        <div className="xl:col-span-1 bg-card border border-border rounded-lg p-4 space-y-4">
          <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5 select-none">
            <List className="w-4 h-4 text-blue-500" />
            Active Microservices
          </h3>

          {runningList.length === 0 ? (
            <p className="text-xs text-slate-500 italic">No running containers detected to fetch telemetry</p>
          ) : (
            <div className="space-y-2 max-h-[500px] overflow-y-auto">
              {runningList.map((c) => {
                const statsList = containersStats[c.id] || [];
                const lastPoint = statsList[statsList.length - 1];
                const isSelected = selectedId === c.id;

                return (
                  <button
                    key={c.id}
                    onClick={() => setSelectedId(c.id)}
                    className={`w-full p-3 rounded border text-left transition flex items-center justify-between ${
                      isSelected ? 'bg-slate-900 border-blue-500/80 text-slate-100' : 'bg-slate-950/40 border-border/60 hover:bg-slate-900/40 text-slate-400'
                    }`}
                  >
                    <div>
                      <div className="text-xs font-bold text-slate-200 truncate max-w-[150px]">{c.name}</div>
                      <div className="text-[10px] text-slate-500 truncate max-w-[150px] font-mono mt-0.5">{c.image}</div>
                    </div>
                    {lastPoint && (
                      <div className="text-right text-[10px] font-mono space-y-0.5 shrink-0">
                        <div className="text-blue-400">CPU: {lastPoint.cpuPercent}%</div>
                        <div className="text-green-400">MEM: {lastPoint.memoryPercent}%</div>
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Right 2 cols: Live charts detail panel */}
        <div className="xl:col-span-2 space-y-6">
          <div className="bg-card border border-border rounded-lg p-5 space-y-6">
            <div className="border-b border-border/40 pb-4 select-none">
              <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                <Activity className="w-4.5 h-4.5 text-blue-500" />
                {selectedContainer ? selectedContainer.name : 'Select a Container'}
              </h3>
              <p className="text-[11px] text-slate-500 mt-0.5 font-mono">
                ID: {selectedId || 'none'}
              </p>
            </div>

            {activeStats.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-slate-500 animate-pulse">
                <RefreshCw className="w-7 h-7 animate-spin text-blue-500 mb-2" />
                <p className="text-xs">Buffering telemetry metric streams...</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* CPU Chart */}
                <div className="bg-slate-950/60 p-4 border border-border/60 rounded-lg space-y-3">
                  <div className="flex justify-between items-center select-none">
                    <span className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                      <Cpu className="w-3.5 h-3.5 text-blue-400" />
                      CPU Usage History
                    </span>
                    <span className="text-xs font-mono font-bold text-blue-400">
                      {activeStats[activeStats.length - 1].cpuPercent}%
                    </span>
                  </div>
                  <Sparkline points={activeStats} dataKey="cpuPercent" color="#3b82f6" />
                </div>

                {/* Memory Chart */}
                <div className="bg-slate-950/60 p-4 border border-border/60 rounded-lg space-y-3">
                  <div className="flex justify-between items-center select-none">
                    <span className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                      <Database className="w-3.5 h-3.5 text-green-400" />
                      Memory Usage History
                    </span>
                    <span className="text-xs font-mono font-bold text-green-400">
                      {activeStats[activeStats.length - 1].memoryPercent}%
                    </span>
                  </div>
                  <Sparkline points={activeStats} dataKey="memoryPercent" color="#10b981" />
                </div>

                {/* Network Rate summary */}
                <div className="bg-slate-950/60 p-4 border border-border/60 rounded-lg space-y-3 font-mono text-xs text-slate-400 select-text">
                  <div className="text-xs font-bold text-slate-300 border-b border-border/30 pb-1.5 mb-2 flex items-center gap-1.5 select-none">
                    <Network className="w-3.5 h-3.5 text-yellow-500" />
                    Network Statistics
                  </div>
                  <div className="flex justify-between">
                    <span>Rx Bytes (Inbound):</span>
                    <span className="text-slate-200">
                      {((activeStats[activeStats.length - 1].networkRxBytes) / 1024 / 1024).toFixed(2)} MB
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Tx Bytes (Outbound):</span>
                    <span className="text-slate-200">
                      {((activeStats[activeStats.length - 1].networkTxBytes) / 1024 / 1024).toFixed(2)} MB
                    </span>
                  </div>
                </div>

                {/* Block Disk IO Rate summary */}
                <div className="bg-slate-950/60 p-4 border border-border/60 rounded-lg space-y-3 font-mono text-xs text-slate-400 select-text">
                  <div className="text-xs font-bold text-slate-300 border-b border-border/30 pb-1.5 mb-2 flex items-center gap-1.5 select-none">
                    <HardDrive className="w-3.5 h-3.5 text-purple-400" />
                    Storage disk block I/O
                  </div>
                  <div className="flex justify-between">
                    <span>Read Ops:</span>
                    <span className="text-slate-200">
                      {((activeStats[activeStats.length - 1].ioReadBytes) / 1024 / 1024).toFixed(2)} MB
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Write Ops:</span>
                    <span className="text-slate-200">
                      {((activeStats[activeStats.length - 1].ioWriteBytes) / 1024 / 1024).toFixed(2)} MB
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// Custom sparkline renderer utilizing SVG
interface SparklineProps {
  points: ContainerMetricPoint[];
  dataKey: keyof ContainerMetricPoint;
  color: string;
}

function Sparkline({ points, dataKey, color }: SparklineProps) {
  if (points.length < 2) {
    return <div className="text-slate-500 italic text-[11px] select-none py-4">Buffering datapoints...</div>;
  }
  const values = points.map(p => Number(p[dataKey]) || 0);
  const max = Math.max(...values, 10);
  const min = Math.min(...values, 0);
  const range = max - min;

  const width = 300;
  const height = 80;
  const xStep = width / (points.length - 1);

  const svgPoints = points.map((p, idx) => {
    const x = idx * xStep;
    const y = height - (( (Number(p[dataKey]) || 0) - min) / range) * height;
    return `${x},${y}`;
  }).join(' ');

  return (
    <div className="pt-2 select-none">
      <svg width="100%" height={height} viewBox={`0 0 ${width} ${height}`} className="overflow-visible">
        <polyline
          fill="none"
          stroke={color}
          strokeWidth="2"
          points={svgPoints}
        />
      </svg>
    </div>
  );
}

export default MonitoringDashboard;
