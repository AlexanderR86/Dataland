import { computed, toValue, type MaybeRefOrGetter } from 'vue';
import { useQuery, type UseQueryOptions, type UseQueryReturnType } from '@tanstack/vue-query';
import { useApiClient } from '@/utils/useApiClient';
import { specificationDataPointTypeKeys } from '@/api-queries/specification-service/data-point-type/specificationDataPointTypeKeys';
import { type DataPointTypeSpecification } from '@clients/specificationservice';

/**
 * Vue Query hook that fetches a data point type specification (GET /data-point-types/{id}).
 * The query is disabled while `dataPointTypeId` is empty.
 *
 * @param params - Endpoint parameters.
 * @param params.dataPointTypeId - Id of the data point type.
 * @param options - Additional TanStack query options. A passed `enabled` replaces the default.
 * @returns Vue Query result containing the {@link DataPointTypeSpecification}.
 */
export function useGetSpecificationDataPointTypeByIdQuery(
  params: { dataPointTypeId: MaybeRefOrGetter<string | undefined> },
  options: Omit<UseQueryOptions<DataPointTypeSpecification, Error>, 'queryKey' | 'queryFn'> = {}
): UseQueryReturnType<DataPointTypeSpecification, Error> {
  const apiClientProvider = useApiClient();

  return useQuery<DataPointTypeSpecification, Error>({
    queryKey: computed(() => specificationDataPointTypeKeys.byId(toValue(params.dataPointTypeId))),
    queryFn: async () => {
      const dataPointTypeId = toValue(params.dataPointTypeId);
      if (!dataPointTypeId) throw new Error('dataPointTypeId is undefined');
      const response =
        await apiClientProvider.apiClients.specificationController.getDataPointTypeSpecification(dataPointTypeId);
      return response.data;
    },
    enabled: computed(() => !!toValue(params.dataPointTypeId)),
    ...options,
  });
}
