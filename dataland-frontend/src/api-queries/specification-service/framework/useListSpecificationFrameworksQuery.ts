import { computed } from 'vue';
import { useQuery, type UseQueryOptions, type UseQueryReturnType } from '@tanstack/vue-query';
import { useApiClient } from '@/utils/useApiClient';
import { specificationFrameworkKeys } from '@/api-queries/specification-service/framework/specificationFrameworkKeys';
import { type SimpleFrameworkSpecification } from '@clients/specificationservice';

/**
 * Vue Query hook that lists all framework specifications (GET /frameworks).
 *
 * @param options - Additional TanStack query options. A passed `enabled` replaces the default.
 * @returns Vue Query result containing the list of {@link SimpleFrameworkSpecification}.
 */
export function useListSpecificationFrameworksQuery(
  options: Omit<UseQueryOptions<SimpleFrameworkSpecification[], Error>, 'queryKey' | 'queryFn'> = {}
): UseQueryReturnType<SimpleFrameworkSpecification[], Error> {
  const apiClientProvider = useApiClient();

  return useQuery<SimpleFrameworkSpecification[], Error>({
    queryKey: computed(() => specificationFrameworkKeys.list()),
    queryFn: async () => {
      const response = await apiClientProvider.apiClients.specificationController.listFrameworkSpecifications();
      return response.data;
    },
    ...options,
  });
}
