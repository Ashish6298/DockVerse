import { create } from 'zustand';

interface HostUIState {
  activeTab: 'dashboard' | 'hosts' | 'history';
  selectedHostId: string | null;
  activeOperationId: string | null;
  isCreateModalOpen: boolean;

  setActiveTab: (tab: 'dashboard' | 'hosts' | 'history') => void;
  setSelectedHostId: (id: string | null) => void;
  setActiveOperationId: (id: string | null) => void;
  setCreateModalOpen: (open: boolean) => void;
}

export const useHostStore = create<HostUIState>((set) => ({
  activeTab: 'dashboard',
  selectedHostId: null,
  activeOperationId: null,
  isCreateModalOpen: false,

  setActiveTab: (activeTab) => set({ activeTab }),
  setSelectedHostId: (selectedHostId) => set({ selectedHostId }),
  setActiveOperationId: (activeOperationId) => set({ activeOperationId }),
  setCreateModalOpen: (isCreateModalOpen) => set({ isCreateModalOpen }),
}));

export default useHostStore;
