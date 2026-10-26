import { computed, toValue, type MaybeRefOrGetter } from 'vue';
import { useQuery, type UseQueryOptions, type UseQueryReturnType } from '@tanstack/vue-query';
import { useApiClient } from '@/utils/useApiClient';
import { specificationFrameworkKeys } from '@/api-queries/specification-service/framework/specificationFrameworkKeys';
import { type FrameworkSpecification } from '@clients/specificationservice';

/**
 * Vue Query hook that fetches a framework specification (GET /frameworks/{id}).
 * The query is disabled while `frameworkId` is empty.
 *
 * @param params - Endpoint parameters.
 * @param params.frameworkId - Id of the framework.
 * @param options - Additional TanStack query options. A passed `enabled` replaces the default.
 * @returns Vue Query result containing the {@link FrameworkSpecification}.
 */
export function useGetSpecificationFrameworkByIdQuery(
  params: { frameworkId: MaybeRefOrGetter<string | undefined> },
  options: Omit<UseQueryOptions<FrameworkSpecification, Error>, 'queryKey' | 'queryFn'> = {}
): UseQueryReturnType<FrameworkSpecification, Error> {
  const apiClientProvider = useApiClient();

  return useQuery<FrameworkSpecification, Error>({
    queryKey: computed(() => specificationFrameworkKeys.byId(toValue(params.frameworkId))),
    queryFn: async () => {
      const frameworkId = toValue(params.frameworkId);
      if (!frameworkId) throw new Error('frameworkId is undefined');
      const response =
        await apiClientProvider.apiClients.specificationController.getFrameworkSpecification(frameworkId);
      return response.data;
    },
    enabled: computed(() => !!toValue(params.frameworkId)),
    ...options,
  });
}
