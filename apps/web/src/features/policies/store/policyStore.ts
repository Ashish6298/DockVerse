import { create } from 'zustand';

interface PolicyUIState {
  activeTab: 'dashboard' | 'policies' | 'findings' | 'schedules' | 'history';
  selectedPolicyId: string | null;
  selectedFindingId: string | null;
  activeOperationId: string | null;
  isCreateModalOpen: boolean;
  isScheduleModalOpen: boolean;

  setActiveTab: (tab: 'dashboard' | 'policies' | 'findings' | 'schedules' | 'history') => void;
  setSelectedPolicyId: (id: string | null) => void;
  setSelectedFindingId: (id: string | null) => void;
  setActiveOperationId: (id: string | null) => void;
  setCreateModalOpen: (open: boolean) => void;
  setScheduleModalOpen: (open: boolean) => void;
}

export const usePolicyStore = create<PolicyUIState>((set) => ({
  activeTab: 'dashboard',
  selectedPolicyId: null,
  selectedFindingId: null,
  activeOperationId: null,
  isCreateModalOpen: false,
  isScheduleModalOpen: false,

  setActiveTab: (activeTab) => set({ activeTab }),
  setSelectedPolicyId: (selectedPolicyId) => set({ selectedPolicyId }),
  setSelectedFindingId: (selectedFindingId) => set({ selectedFindingId }),
  setActiveOperationId: (activeOperationId) => set({ activeOperationId }),
  setCreateModalOpen: (isCreateModalOpen) => set({ isCreateModalOpen }),
  setScheduleModalOpen: (isScheduleModalOpen) => set({ isScheduleModalOpen }),
}));

export default usePolicyStore;
