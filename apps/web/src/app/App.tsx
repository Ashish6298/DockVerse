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
import { Plugins } from '../features/plugins/pages/Plugins';
import { SwarmDashboard } from '../features/swarm/pages/SwarmDashboard';
import { ResourcesDashboard } from '../features/resources/pages/ResourcesDashboard';
import { StacksDashboard } from '../features/stacks/pages/StacksDashboard';
import { BackupDashboard } from '../features/backups/pages/BackupDashboard';
import { SecurityDashboard } from '../features/security/pages/SecurityDashboard';
import { EventDashboard } from '../features/events/pages/EventDashboard';
import { PolicyDashboard } from '../features/policies/pages/PolicyDashboard';
import { HostDashboard } from '../features/hosts/pages/HostDashboard';
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
    await queryClient.invalidateQueries({ queryKey: ['plugins'] });
    await queryClient.invalidateQueries({ queryKey: ['swarmStatus'] });
    await queryClient.invalidateQueries({ queryKey: ['swarmInspect'] });
    await queryClient.invalidateQueries({ queryKey: ['swarmTokens'] });
    await queryClient.invalidateQueries({ queryKey: ['swarmNodes'] });
    await queryClient.invalidateQueries({ queryKey: ['swarmServices'] });
    await queryClient.invalidateQueries({ queryKey: ['swarmTasks'] });
    await queryClient.invalidateQueries({ queryKey: ['swarmHealth'] });
    await queryClient.invalidateQueries({ queryKey: ['swarmOperations'] });
    await queryClient.invalidateQueries({ queryKey: ['resourcesDashboard'] });
    await queryClient.invalidateQueries({ queryKey: ['secrets'] });
    await queryClient.invalidateQueries({ queryKey: ['configs'] });
    await queryClient.invalidateQueries({ queryKey: ['resourceOperations'] });
    await queryClient.invalidateQueries({ queryKey: ['stacksDashboard'] });
    await queryClient.invalidateQueries({ queryKey: ['stacks'] });
    await queryClient.invalidateQueries({ queryKey: ['stackOperations'] });
    await queryClient.invalidateQueries({ queryKey: ['backupsDashboard'] });
    await queryClient.invalidateQueries({ queryKey: ['backups'] });
    await queryClient.invalidateQueries({ queryKey: ['backupSchedules'] });
    await queryClient.invalidateQueries({ queryKey: ['backupOperations'] });
    await queryClient.invalidateQueries({ queryKey: ['securityDashboard'] });
    await queryClient.invalidateQueries({ queryKey: ['securityFindings'] });
    await queryClient.invalidateQueries({ queryKey: ['securitySchedules'] });
    await queryClient.invalidateQueries({ queryKey: ['securityOperations'] });
    await queryClient.invalidateQueries({ queryKey: ['eventsDashboard'] });
    await queryClient.invalidateQueries({ queryKey: ['eventsList'] });
    await queryClient.invalidateQueries({ queryKey: ['eventSchedules'] });
    await queryClient.invalidateQueries({ queryKey: ['eventOperations'] });
    await queryClient.invalidateQueries({ queryKey: ['policiesDashboard'] });
    await queryClient.invalidateQueries({ queryKey: ['policiesList'] });
    await queryClient.invalidateQueries({ queryKey: ['policyFindings'] });
    await queryClient.invalidateQueries({ queryKey: ['policySchedules'] });
    await queryClient.invalidateQueries({ queryKey: ['policyOperations'] });
    await queryClient.invalidateQueries({ queryKey: ['hostsDashboard'] });
    await queryClient.invalidateQueries({ queryKey: ['hostsList'] });
    await queryClient.invalidateQueries({ queryKey: ['hostOperations'] });
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
      case 'plugins':
        return <Plugins />;
      case 'swarm':
        return <SwarmDashboard />;
      case 'resources':
        return <ResourcesDashboard />;
      case 'stacks':
        return <StacksDashboard />;
      case 'backups':
        return <BackupDashboard />;
      case 'security':
        return <SecurityDashboard />;
      case 'events':
        return <EventDashboard />;
      case 'policies':
        return <PolicyDashboard />;
      case 'hosts':
        return <HostDashboard />;
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
