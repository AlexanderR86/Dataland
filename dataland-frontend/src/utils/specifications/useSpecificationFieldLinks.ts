import { computed, toValue, type ComputedRef, type MaybeRefOrGetter } from 'vue';
import { useListSpecificationFrameworksQuery } from '@/api-queries/specification-service/framework/useListSpecificationFrameworksQuery';
import { useGetSpecificationFrameworkByIdQuery } from '@/api-queries/specification-service/framework/useGetSpecificationFrameworkByIdQuery';
import {
  buildSpecificationFieldPaths,
  getSpecificationFrameworkId,
  type SpecificationFieldLinks,
} from '@/utils/specifications/SpecificationLinkUtils';

/** Loads one framework schema and prepares optional documentation links for a dataset table. */
export function useSpecificationFieldLinks(
  dataType: MaybeRefOrGetter<string>
): ComputedRef<SpecificationFieldLinks | undefined> {
  const { data: frameworks } = useListSpecificationFrameworksQuery();
  const frameworkId = computed(() => getSpecificationFrameworkId(toValue(dataType), frameworks.value));
  const { data: framework } = useGetSpecificationFrameworkByIdQuery({ frameworkId });
  return computed(() => {
    if (!frameworkId.value || framework.value?.framework.id !== frameworkId.value) return undefined;
    return {
      frameworkId: frameworkId.value,
      pathsByType: buildSpecificationFieldPaths(framework.value.schema),
    };
  });
}
