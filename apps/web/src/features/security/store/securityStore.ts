import { create } from 'zustand';

interface SecurityUIState {
  activeTab: 'dashboard' | 'findings' | 'schedules' | 'history';
  selectedFindingId: string | null;
  activeOperationId: string | null;
  isScanModalOpen: boolean;
  isScheduleModalOpen: boolean;

  setActiveTab: (tab: 'dashboard' | 'findings' | 'schedules' | 'history') => void;
  setSelectedFindingId: (id: string | null) => void;
  setActiveOperationId: (id: string | null) => void;
  setScanModalOpen: (open: boolean) => void;
  setScheduleModalOpen: (open: boolean) => void;
}

export const useSecurityStore = create<SecurityUIState>((set) => ({
  activeTab: 'dashboard',
  selectedFindingId: null,
  activeOperationId: null,
  isScanModalOpen: false,
  isScheduleModalOpen: false,

  setActiveTab: (activeTab) => set({ activeTab }),
  setSelectedFindingId: (selectedFindingId) => set({ selectedFindingId }),
  setActiveOperationId: (activeOperationId) => set({ activeOperationId }),
  setScanModalOpen: (isScanModalOpen) => set({ isScanModalOpen }),
  setScheduleModalOpen: (isScheduleModalOpen) => set({ isScheduleModalOpen }),
}));

export default useSecurityStore;
