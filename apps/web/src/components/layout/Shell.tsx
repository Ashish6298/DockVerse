import React from 'react';
import { 
  LayoutDashboard, 
  Briefcase, 
  Box, 
  Layers, 
  Network, 
  HardDrive, 
  FileCode, 
  Workflow, 
  Activity, 
  Search, 
  HeartPulse, 
  BookOpen, 
  Camera, 
  Globe, 
  Blocks, 
  Settings, 
  Info,
  Menu,
  ChevronLeft,
  RefreshCw,
  Sun,
  Moon
} from 'lucide-react';
import { useUIStore } from '../../store/uiStore';

interface ShellProps {
  children: React.ReactNode;
  activeRoute: string;
  onNavigate: (route: string) => void;
  onRefresh: () => void;
  isRefreshing: boolean;
}

export function Shell({ children, activeRoute, onNavigate, onRefresh, isRefreshing }: ShellProps) {
  const { 
    sidebarCollapsed, 
    toggleSidebar, 
    theme, 
    setTheme, 
    dockerStatus, 
    lastRefreshedAt 
  } = useUIStore();

  const navigationItems = [
    { id: 'dashboard', name: 'Dashboard', icon: LayoutDashboard },
    { id: 'workspaces', name: 'Workspaces', icon: Briefcase, disabled: true },
    { id: 'containers', name: 'Containers', icon: Box, disabled: true },
    { id: 'images', name: 'Images', icon: Layers, disabled: true },
    { id: 'networks', name: 'Networks', icon: Network, disabled: true },
    { id: 'volumes', name: 'Volumes', icon: HardDrive, disabled: true },
    { id: 'dockerfiles', name: 'Dockerfiles', icon: FileCode, disabled: true },
    { id: 'compose', name: 'Compose Studio', icon: Workflow, disabled: true },
    { id: 'monitoring', name: 'Monitoring', icon: Activity, disabled: true },
    { id: 'inspector', name: 'Inspector', icon: Search, disabled: true },
    { id: 'doctor', name: 'Docker Doctor', icon: HeartPulse, disabled: true },
    { id: 'snapshots', name: 'Snapshots', icon: Camera, disabled: true },
    { id: 'registry', name: 'Registry Explorer', icon: Globe, disabled: true },
    { id: 'plugins', name: 'Plugins', icon: Blocks, disabled: true },
    { id: 'docs', name: 'Documentation', icon: BookOpen, disabled: true },
    { id: 'settings', name: 'Settings', icon: Settings, disabled: true },
    { id: 'about', name: 'About', icon: Info, disabled: true },
  ];

  return (
    <div className="h-screen w-screen flex flex-col bg-background text-foreground overflow-hidden font-sans">
      {/* Top Navbar */}
      <header className="h-12 border-b border-border bg-sidebar px-4 flex items-center justify-between select-none">
        <div className="flex items-center gap-3">
          <button 
            onClick={toggleSidebar} 
            className="p-1 hover:bg-card rounded text-slate-400 hover:text-white transition"
          >
            {sidebarCollapsed ? <Menu className="w-5 h-5" /> : <ChevronLeft className="w-5 h-5" />}
          </button>
          <span className="font-semibold tracking-wider text-sm bg-gradient-to-r from-blue-500 to-indigo-400 bg-clip-text text-transparent">
            DOCKVERSE
          </span>
          <span className="text-xs text-slate-500 font-mono px-2 py-0.5 border border-slate-800 rounded bg-slate-900">
            v1.0.0
          </span>
        </div>

        {/* Top middle workspace placeholder */}
        <div className="hidden md:flex items-center gap-2 bg-slate-950 px-3 py-1 rounded border border-border text-xs text-slate-400">
          <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse"></span>
          <span>Workspace: <strong>Default</strong></span>
        </div>

        {/* Right side actions */}
        <div className="flex items-center gap-2">
          <button
            onClick={onRefresh}
            disabled={isRefreshing}
            className={`p-1.5 hover:bg-card rounded text-slate-400 hover:text-white transition flex items-center gap-1 ${
              isRefreshing ? 'animate-spin text-blue-400' : ''
            }`}
            title="Force refresh"
          >
            <RefreshCw className="w-4 h-4" />
          </button>

          <button
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            className="p-1.5 hover:bg-card rounded text-slate-400 hover:text-white transition"
            title="Toggle theme"
          >
            {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>
        </div>
      </header>

      {/* Main layout container */}
      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar */}
        <aside 
          className={`border-r border-border bg-sidebar flex flex-col justify-between transition-all duration-300 select-none ${
            sidebarCollapsed ? 'w-14' : 'w-60'
          }`}
        >
          <nav className="flex-1 py-3 overflow-y-auto px-2 space-y-1">
            {navigationItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeRoute === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => !item.disabled && onNavigate(item.id)}
                  disabled={item.disabled}
                  className={`w-full flex items-center gap-3 px-3 py-2 rounded text-xs transition duration-150 ${
                    isActive 
                      ? 'bg-blue-600 text-white font-medium shadow-md shadow-blue-500/20' 
                      : item.disabled 
                        ? 'opacity-40 cursor-not-allowed text-slate-500' 
                        : 'text-slate-400 hover:bg-card hover:text-white'
                  }`}
                  title={item.name}
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  {!sidebarCollapsed && <span className="truncate">{item.name}</span>}
                </button>
              );
            })}
          </nav>
        </aside>

        {/* Main Workspace Content Area */}
        <main className="flex-1 bg-background overflow-y-auto relative p-6">
          {children}
        </main>
      </div>

      {/* Bottom Status Bar */}
      <footer className="h-6 border-t border-border bg-sidebar px-4 flex items-center justify-between text-[11px] text-slate-500 select-none">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5">
            <span className={`w-2.5 h-2.5 rounded-full ${
              dockerStatus === 'connected' ? 'bg-status-connected animate-pulse' : 'bg-status-disconnected'
            }`} />
            <span className="font-medium uppercase tracking-wider text-slate-400">
              {dockerStatus === 'connected' ? 'Docker Connected' : 'Docker Disconnected'}
            </span>
          </div>
          {lastRefreshedAt && (
            <span className="hidden sm:inline">
              Last Synced: {new Date(lastRefreshedAt).toLocaleTimeString()}
            </span>
          )}
        </div>
        <div className="flex items-center gap-3 font-mono">
          <span>Environment: development</span>
          <span>LF</span>
          <span>UTF-8</span>
        </div>
      </footer>
    </div>
  );
}
export default Shell;
