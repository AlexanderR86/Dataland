<template>
  <RouterLink
    :to="{
      name: 'Specifications Framework Detail',
      params: { frameworkId: targetFrameworkId },
      query: path ? { field: path } : {},
    }"
    target="_blank"
    rel="noopener"
    :title="inputId"
    :data-test="`specificationRuleInputFrameworkLink-${inputId}-${targetFrameworkId}`"
  >
    {{ label }}
    <Tag :value="frameworkName" severity="secondary" />
  </RouterLink>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { RouterLink } from 'vue-router';
import Tag from 'primevue/tag';
import { buildDataPointTypeIdToPathsMap } from '@/utils/specifications/SpecificationDetailUtils';
import { formatSchemaKey, parseFrameworkSchema } from '@/utils/specifications/SpecificationTreeUtils';
import { useGetSpecificationFrameworkByIdQuery } from '@/api-queries/specification-service/framework/useGetSpecificationFrameworkByIdQuery';
import { useListSpecificationFrameworksQuery } from '@/api-queries/specification-service/framework/useListSpecificationFrameworksQuery';

const props = defineProps<{
  inputId: string;
  targetFrameworkId: string;
}>();

const { data: framework } = useGetSpecificationFrameworkByIdQuery({ frameworkId: () => props.targetFrameworkId });
const { data: frameworks } = useListSpecificationFrameworksQuery();

const path = computed(() => {
  if (!framework.value) return undefined;
  try {
    return buildDataPointTypeIdToPathsMap(parseFrameworkSchema(framework.value.schema)).get(props.inputId)?.[0];
  } catch {
    return undefined;
  }
});
const label = computed(() => formatSchemaKey(path.value?.split('.').at(-1) ?? props.inputId));
const frameworkName = computed(
  () =>
    frameworks.value?.find((entry) => entry.framework.id === props.targetFrameworkId)?.name ?? props.targetFrameworkId
);
</script>
