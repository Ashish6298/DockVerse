import { create } from 'zustand';

interface BackupUIState {
  activeTab: 'backups' | 'schedules' | 'history';
  selectedBackupId: string | null;
  activeOperationId: string | null;
  isCreateBackupModalOpen: boolean;
  isCreateScheduleModalOpen: boolean;
  isRestoreWizardOpen: boolean;

  setActiveTab: (tab: 'backups' | 'schedules' | 'history') => void;
  setSelectedBackupId: (id: string | null) => void;
  setActiveOperationId: (id: string | null) => void;
  setCreateBackupModalOpen: (open: boolean) => void;
  setCreateScheduleModalOpen: (open: boolean) => void;
  setRestoreWizardOpen: (open: boolean) => void;
}

export const useBackupStore = create<BackupUIState>((set) => ({
  activeTab: 'backups',
  selectedBackupId: null,
  activeOperationId: null,
  isCreateBackupModalOpen: false,
  isCreateScheduleModalOpen: false,
  isRestoreWizardOpen: false,

  setActiveTab: (activeTab) => set({ activeTab }),
  setSelectedBackupId: (selectedBackupId) => set({ selectedBackupId }),
  setActiveOperationId: (activeOperationId) => set({ activeOperationId }),
  setCreateBackupModalOpen: (isCreateBackupModalOpen) => set({ isCreateBackupModalOpen }),
  setCreateScheduleModalOpen: (isCreateScheduleModalOpen) => set({ isCreateScheduleModalOpen }),
  setRestoreWizardOpen: (isRestoreWizardOpen) => set({ isRestoreWizardOpen }),
}));

export default useBackupStore;
