import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  fetchPlugins,
  fetchPluginDetails,
  installPlugin,
  enablePlugin,
  disablePlugin,
  configurePlugin,
  upgradePlugin,
  removePlugin,
  fetchPluginOperation
} from '../api/pluginApi';
import type { PluginListItem, PluginDetails } from '@dockverse/types';

export function usePlugins() {
  const queryClient = useQueryClient();

  const pluginsQuery = useQuery<PluginListItem[]>({
    queryKey: ['plugins'],
    queryFn: fetchPlugins,
    refetchInterval: 10000, // Poll plugins list every 10 seconds
  });

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['plugins'] });
    queryClient.invalidateQueries({ queryKey: ['dashboard'] });
  };

  const installMutation = useMutation({
    mutationFn: installPlugin,
  });

  const enableMutation = useMutation({
    mutationFn: enablePlugin,
    onSuccess: invalidate,
  });

  const disableMutation = useMutation({
    mutationFn: (variables: { id: string; force?: boolean }) => disablePlugin(variables.id, variables.force),
    onSuccess: invalidate,
  });

  const configureMutation = useMutation({
    mutationFn: (variables: { id: string; env: Record<string, string> }) => configurePlugin(variables.id, { env: variables.env }),
    onSuccess: invalidate,
  });

  const upgradeMutation = useMutation({
    mutationFn: (variables: { id: string; remoteName: string; grantPrivileges: boolean }) => 
      upgradePlugin(variables.id, { remoteName: variables.remoteName, grantPrivileges: variables.grantPrivileges }),
  });

  const removeMutation = useMutation({
    mutationFn: (variables: { id: string; force?: boolean }) => removePlugin(variables.id, variables.force),
    onSuccess: invalidate,
  });

  return {
    plugins: pluginsQuery.data || [],
    isLoading: pluginsQuery.isLoading,
    isError: pluginsQuery.isError,
    error: pluginsQuery.error,
    refetch: pluginsQuery.refetch,
    isFetching: pluginsQuery.isFetching,

    installPlugin: installMutation.mutateAsync,
    isInstalling: installMutation.isPending,

    enablePlugin: enableMutation.mutateAsync,
    isEnabledPending: enableMutation.isPending,

    disablePlugin: disableMutation.mutateAsync,
    isDisablePending: disableMutation.isPending,

    configurePlugin: configureMutation.mutateAsync,
    isConfiguring: configureMutation.isPending,

    upgradePlugin: upgradeMutation.mutateAsync,
    isUpgrading: upgradeMutation.isPending,

    removePlugin: removeMutation.mutateAsync,
    isRemoving: removeMutation.isPending,
  };
}

export function usePluginDetails(id: string) {
  return useQuery<PluginDetails>({
    queryKey: ['plugins', id],
    queryFn: () => fetchPluginDetails(id),
    enabled: !!id,
    refetchInterval: 5000, // Poll details every 5 seconds if modal is open
  });
}

export function usePluginOperation(operationId: string) {
  return useQuery({
    queryKey: ['pluginOperation', operationId],
    queryFn: () => fetchPluginOperation(operationId),
    enabled: !!operationId,
    refetchInterval: (query) => {
      const data = query.state.data;
      if (data && (data.status === 'success' || data.status === 'failed')) {
        return false;
      }
      return 2000; // Poll task output logs every 2 seconds
    },
  });
}
