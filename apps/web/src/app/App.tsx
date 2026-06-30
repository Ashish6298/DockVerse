import React, { useState } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Shell } from '../components/layout/Shell';
import { Dashboard } from '../pages/Dashboard';
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
    setTimeout(() => {
      setIsRefreshing(false);
    }, 1000);
  };

  // Render content based on route
  const renderContent = () => {
    switch (activeRoute) {
      case 'dashboard':
        return <Dashboard onRefresh={handleRefresh} isRefreshing={isRefreshing} />;
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
