import { create } from 'zustand';

interface StackUIState {
  activeTab: 'stacks' | 'history';
  selectedStackName: string | null;
  activeOperationId: string | null;
  isDeployModalOpen: boolean;
  isScaleModalOpen: boolean;
  scaleServiceId: string | null;
  scaleServiceName: string | null;
  scaleCurrentReplicas: number;

  setActiveTab: (tab: 'stacks' | 'history') => void;
  setSelectedStackName: (name: string | null) => void;
  setActiveOperationId: (id: string | null) => void;
  setDeployModalOpen: (open: boolean) => void;
  setScaleModalOpen: (open: boolean) => void;
  setScaleDetails: (details: { id: string | null; name: string | null; current: number }) => void;
}

export const useStackStore = create<StackUIState>((set) => ({
  activeTab: 'stacks',
  selectedStackName: null,
  activeOperationId: null,
  isDeployModalOpen: false,
  isScaleModalOpen: false,
  scaleServiceId: null,
  scaleServiceName: null,
  scaleCurrentReplicas: 1,

  setActiveTab: (activeTab) => set({ activeTab }),
  setSelectedStackName: (selectedStackName) => set({ selectedStackName }),
  setActiveOperationId: (activeOperationId) => set({ activeOperationId }),
  setDeployModalOpen: (isDeployModalOpen) => set({ isDeployModalOpen }),
  setScaleModalOpen: (isScaleModalOpen) => set({ isScaleModalOpen }),
  setScaleDetails: (details) => set({
    scaleServiceId: details.id,
    scaleServiceName: details.name,
    scaleCurrentReplicas: details.current,
  }),
}));

export default useStackStore;
