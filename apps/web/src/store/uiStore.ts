import { create } from 'zustand';
import type { DockerStatus } from '@dockverse/types';

interface UIState {
  sidebarCollapsed: boolean;
  theme: 'dark' | 'light';
  dockerStatus: DockerStatus;
  lastRefreshedAt: string | null;
  toggleSidebar: () => void;
  setSidebarCollapsed: (collapsed: boolean) => void;
  setTheme: (theme: 'dark' | 'light') => void;
  setDockerStatus: (status: DockerStatus) => void;
  triggerRefresh: () => void;
}

export const useUIStore = create<UIState>((set) => ({
  sidebarCollapsed: false,
  theme: 'dark',
  dockerStatus: 'disconnected',
  lastRefreshedAt: null,
  toggleSidebar: () => set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),
  setSidebarCollapsed: (collapsed) => set({ sidebarCollapsed: collapsed }),
  setTheme: (theme) => set({ theme }),
  setDockerStatus: (status) => set({ dockerStatus: status }),
  triggerRefresh: () => set({ lastRefreshedAt: new Date().toISOString() }),
}));
export default useUIStore;
