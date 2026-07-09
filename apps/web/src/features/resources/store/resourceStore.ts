import { create } from 'zustand';

interface ResourceUIState {
  activeTab: 'secrets' | 'configs' | 'history';
  selectedSecretId: string | null;
  selectedConfigId: string | null;
  activeOperationId: string | null;
  isCreateSecretModalOpen: boolean;
  isCreateConfigModalOpen: boolean;

  setActiveTab: (tab: 'secrets' | 'configs' | 'history') => void;
  setSelectedSecretId: (id: string | null) => void;
  setSelectedConfigId: (id: string | null) => void;
  setActiveOperationId: (id: string | null) => void;
  setCreateSecretModalOpen: (open: boolean) => void;
  setCreateConfigModalOpen: (open: boolean) => void;
}

export const useResourceStore = create<ResourceUIState>((set) => ({
  activeTab: 'secrets',
  selectedSecretId: null,
  selectedConfigId: null,
  activeOperationId: null,
  isCreateSecretModalOpen: false,
  isCreateConfigModalOpen: false,

  setActiveTab: (activeTab) => set({ activeTab }),
  setSelectedSecretId: (selectedSecretId) => set({ selectedSecretId, selectedConfigId: null }),
  setSelectedConfigId: (selectedConfigId) => set({ selectedConfigId, selectedSecretId: null }),
  setActiveOperationId: (activeOperationId) => set({ activeOperationId }),
  setCreateSecretModalOpen: (isCreateSecretModalOpen) => set({ isCreateSecretModalOpen }),
  setCreateConfigModalOpen: (isCreateConfigModalOpen) => set({ isCreateConfigModalOpen }),
}));

export default useResourceStore;
