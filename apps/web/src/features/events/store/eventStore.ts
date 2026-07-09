import { create } from 'zustand';

interface EventUIState {
  activeTab: 'events' | 'schedules' | 'history';
  selectedEventId: string | null;
  activeOperationId: string | null;
  isScheduleModalOpen: boolean;

  setActiveTab: (tab: 'events' | 'schedules' | 'history') => void;
  setSelectedEventId: (id: string | null) => void;
  setActiveOperationId: (id: string | null) => void;
  setScheduleModalOpen: (open: boolean) => void;
}

export const useEventStore = create<EventUIState>((set) => ({
  activeTab: 'events',
  selectedEventId: null,
  activeOperationId: null,
  isScheduleModalOpen: false,

  setActiveTab: (activeTab) => set({ activeTab }),
  setSelectedEventId: (selectedEventId) => set({ selectedEventId }),
  setActiveOperationId: (activeOperationId) => set({ activeOperationId }),
  setScheduleModalOpen: (isScheduleModalOpen) => set({ isScheduleModalOpen }),
}));

export default useEventStore;
