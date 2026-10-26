import { computed, toValue, type MaybeRefOrGetter } from 'vue';
import { useQuery, type UseQueryOptions, type UseQueryReturnType } from '@tanstack/vue-query';
import { useApiClient } from '@/utils/useApiClient';
import { specificationDataPointBaseTypeKeys } from '@/api-queries/specification-service/data-point-base-type/specificationDataPointBaseTypeKeys';
import { type DataPointBaseTypeSpecification } from '@clients/specificationservice';

/**
 * Vue Query hook that fetches a data point base type (GET /data-point-base-types/{id}).
 * The query is disabled while `dataPointBaseTypeId` is empty.
 *
 * @param params - Endpoint parameters.
 * @param params.dataPointBaseTypeId - Id of the data point base type.
 * @param options - Additional TanStack query options. A passed `enabled` replaces the default.
 * @returns Vue Query result containing the {@link DataPointBaseTypeSpecification}.
 */
export function useGetSpecificationDataPointBaseTypeByIdQuery(
  params: { dataPointBaseTypeId: MaybeRefOrGetter<string | undefined> },
  options: Omit<UseQueryOptions<DataPointBaseTypeSpecification, Error>, 'queryKey' | 'queryFn'> = {}
): UseQueryReturnType<DataPointBaseTypeSpecification, Error> {
  const apiClientProvider = useApiClient();

  return useQuery<DataPointBaseTypeSpecification, Error>({
    queryKey: computed(() => specificationDataPointBaseTypeKeys.byId(toValue(params.dataPointBaseTypeId))),
    queryFn: async () => {
      const dataPointBaseTypeId = toValue(params.dataPointBaseTypeId);
      if (!dataPointBaseTypeId) throw new Error('dataPointBaseTypeId is undefined');
      const response =
        await apiClientProvider.apiClients.specificationController.getDataPointBaseType(dataPointBaseTypeId);
      return response.data;
    },
    enabled: computed(() => !!toValue(params.dataPointBaseTypeId)),
    ...options,
  });
}
