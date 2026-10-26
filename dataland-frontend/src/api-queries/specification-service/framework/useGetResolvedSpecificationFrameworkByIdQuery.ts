import { computed, toValue, type MaybeRefOrGetter } from 'vue';
import { useQuery, type UseQueryOptions, type UseQueryReturnType } from '@tanstack/vue-query';
import { useApiClient } from '@/utils/useApiClient';
import { specificationFrameworkKeys } from '@/api-queries/specification-service/framework/specificationFrameworkKeys';
import { type DataPointBaseTypeResolvedSchema } from '@clients/specificationservice';

/**
 * Vue Query hook that fetches the resolved schema of a framework (GET /frameworks/{id}/resolved-schema).
 * The query is disabled while `frameworkId` is empty.
 *
 * @param params - Endpoint parameters.
 * @param params.frameworkId - Id of the framework.
 * @param options - Additional TanStack query options. A passed `enabled` replaces the default.
 * @returns Vue Query result containing the {@link DataPointBaseTypeResolvedSchema}.
 */
export function useGetResolvedSpecificationFrameworkByIdQuery(
  params: { frameworkId: MaybeRefOrGetter<string | undefined> },
  options: Omit<UseQueryOptions<DataPointBaseTypeResolvedSchema, Error>, 'queryKey' | 'queryFn'> = {}
): UseQueryReturnType<DataPointBaseTypeResolvedSchema, Error> {
  const apiClientProvider = useApiClient();

  return useQuery<DataPointBaseTypeResolvedSchema, Error>({
    queryKey: computed(() => specificationFrameworkKeys.resolvedById(toValue(params.frameworkId))),
    queryFn: async () => {
      const frameworkId = toValue(params.frameworkId);
      if (!frameworkId) throw new Error('frameworkId is undefined');
      const response =
        await apiClientProvider.apiClients.specificationController.getResolvedFrameworkSpecification(frameworkId);
      return response.data;
    },
    enabled: computed(() => !!toValue(params.frameworkId)),
    ...options,
  });
}
