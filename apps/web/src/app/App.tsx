import React, { useState } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Shell } from '../components/layout/Shell';
import { Dashboard } from '../pages/Dashboard';
import { Workspaces } from '../pages/Workspaces';
import { Containers } from '../pages/Containers';
import { Images } from '../pages/Images';
import { Networks } from '../pages/Networks';
import { Volumes } from '../features/volumes/pages/Volumes';
import { DockerfileStudio } from '../features/dockerfiles/pages/DockerfileStudio';
import { ComposeStudio } from '../features/compose/pages/ComposeStudio';
import { MonitoringDashboard } from '../features/monitoring/pages/MonitoringDashboard';
import { RegistryDashboard } from '../features/registry/pages/RegistryDashboard';
import { useUIStore } from '../store/uiStore';

const queryClient = new QueryClient();

export function App() {
  const [activeRoute, setActiveRoute] = useState('dashboard');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const theme = useUIStore((state) => state.theme);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    // Invalidate react query cache
    await queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    await queryClient.invalidateQueries({ queryKey: ['workspaces'] });
    await queryClient.invalidateQueries({ queryKey: ['containers'] });
    await queryClient.invalidateQueries({ queryKey: ['images'] });
    await queryClient.invalidateQueries({ queryKey: ['networks'] });
    await queryClient.invalidateQueries({ queryKey: ['volumes'] });
    await queryClient.invalidateQueries({ queryKey: ['dockerfileBuildHistory'] });
    await queryClient.invalidateQueries({ queryKey: ['composeHistory'] });
    await queryClient.invalidateQueries({ queryKey: ['monitoringSummary'] });
    await queryClient.invalidateQueries({ queryKey: ['registryProviders'] });
    setTimeout(() => {
      setIsRefreshing(false);
    }, 1000);
  };

  // Render content based on route
  const renderContent = () => {
    switch (activeRoute) {
      case 'dashboard':
        return <Dashboard onRefresh={handleRefresh} isRefreshing={isRefreshing} />;
      case 'workspaces':
        return <Workspaces />;
      case 'containers':
        return <Containers />;
      case 'images':
        return <Images />;
      case 'networks':
        return <Networks />;
      case 'volumes':
        return <Volumes />;
      case 'dockerfiles':
        return <DockerfileStudio />;
      case 'compose':
        return <ComposeStudio />;
      case 'monitoring':
        return <MonitoringDashboard />;
      case 'registry':
        return <RegistryDashboard />;
      default:
        return (
          <div className="flex flex-col items-center justify-center h-full text-slate-500">
            <h2 className="text-lg font-bold text-slate-400">Under Construction</h2>
            <p className="text-sm mt-1">The {activeRoute} module will be enabled in subsequent phases.</p>
          </div>
        );
    }
  };

  return (
    <QueryClientProvider client={queryClient}>
      <div className={theme === 'dark' ? 'dark' : ''}>
        <Shell 
          activeRoute={activeRoute} 
          onNavigate={setActiveRoute} 
          onRefresh={handleRefresh} 
          isRefreshing={isRefreshing}
        >
          {renderContent()}
        </Shell>
      </div>
    </QueryClientProvider>
  );
}

export default App;
