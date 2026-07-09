import { create } from 'zustand';

interface SwarmUIState {
  activeTab: 'dashboard' | 'nodes' | 'services' | 'history';
  selectedNodeId: string | null;
  selectedServiceId: string | null;
  activeOperationId: string | null;
  isInitModalOpen: boolean;
  isJoinModalOpen: boolean;
  isRotateModalOpen: boolean;
  isUpdateModalOpen: boolean;
  isLeaveModalOpen: boolean;

  setActiveTab: (tab: 'dashboard' | 'nodes' | 'services' | 'history') => void;
  setSelectedNodeId: (id: string | null) => void;
  setSelectedServiceId: (id: string | null) => void;
  setActiveOperationId: (id: string | null) => void;
  setInitModalOpen: (open: boolean) => void;
  setJoinModalOpen: (open: boolean) => void;
  setRotateModalOpen: (open: boolean) => void;
  setUpdateModalOpen: (open: boolean) => void;
  setLeaveModalOpen: (open: boolean) => void;
}

export const useSwarmStore = create<SwarmUIState>((set) => ({
  activeTab: 'dashboard',
  selectedNodeId: null,
  selectedServiceId: null,
  activeOperationId: null,
  isInitModalOpen: false,
  isJoinModalOpen: false,
  isRotateModalOpen: false,
  isUpdateModalOpen: false,
  isLeaveModalOpen: false,

  setActiveTab: (activeTab) => set({ activeTab }),
  setSelectedNodeId: (selectedNodeId) => set({ selectedNodeId }),
  setSelectedServiceId: (selectedServiceId) => set({ selectedServiceId }),
  setActiveOperationId: (activeOperationId) => set({ activeOperationId }),
  setInitModalOpen: (isInitModalOpen) => set({ isInitModalOpen }),
  setJoinModalOpen: (isJoinModalOpen) => set({ isJoinModalOpen }),
  setRotateModalOpen: (isRotateModalOpen) => set({ isRotateModalOpen }),
  setUpdateModalOpen: (isUpdateModalOpen) => set({ isUpdateModalOpen }),
  setLeaveModalOpen: (isLeaveModalOpen) => set({ isLeaveModalOpen }),
}));

export default useSwarmStore;
