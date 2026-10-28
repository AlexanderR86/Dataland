<template>
  <RouterLink
    v-if="localPath"
    :to="{ name: 'Specifications Framework Detail', params: { frameworkId }, query: { field: localPath } }"
    target="_blank"
    rel="noopener"
    :title="localTitle"
    :data-test="`specificationRuleInputLink-${inputId}`"
  >
    {{ formatSchemaKey(localPath.split('.').at(-1) ?? inputId) }}
  </RouterLink>
  <template v-else-if="otherFrameworkIds.length > 0">
    <span class="flex flex-wrap gap-2" :data-test="`specificationRuleInputOtherFrameworks-${inputId}`">
      <SpecificationRuleInputFrameworkLink
        v-for="targetFrameworkId in otherFrameworkIds"
        :key="targetFrameworkId"
        :input-id="inputId"
        :target-framework-id="targetFrameworkId"
      />
    </span>
  </template>
  <template v-else>
    <code>{{ inputId }}</code>
    <span v-if="isUnused" class="specification-input-hint" :data-test="`specificationRuleInputUnknown-${inputId}`">
      (not used in any framework)
    </span>
  </template>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { RouterLink } from 'vue-router';
import SpecificationRuleInputFrameworkLink from '@/components/resources/specifications/SpecificationRuleInputFrameworkLink.vue';
import { formatSchemaKey } from '@/utils/specifications/SpecificationTreeUtils';
import { useGetSpecificationDataPointTypeByIdQuery } from '@/api-queries/specification-service/data-point-type/useGetSpecificationDataPointTypeByIdQuery';

const props = defineProps<{
  inputId: string;
  frameworkId: string;
  pathsByTypeId?: Map<string, string[]>;
}>();

const localPaths = computed(() => props.pathsByTypeId?.get(props.inputId) ?? []);
const localPath = computed(() => localPaths.value[0]);
const localTitle = computed(() =>
  localPaths.value.length > 1
    ? `${props.inputId} (also used at: ${localPaths.value.slice(1).join(', ')})`
    : props.inputId
);

const { data: inputType } = useGetSpecificationDataPointTypeByIdQuery(
  { dataPointTypeId: () => props.inputId },
  { enabled: computed(() => !!props.pathsByTypeId && !localPath.value) }
);

const otherFrameworkIds = computed(() =>
  (inputType.value?.usedBy ?? []).map((usedBy) => usedBy.id).filter((id) => id !== props.frameworkId)
);
const isUnused = computed(() => !!inputType.value && otherFrameworkIds.value.length === 0);
</script>

<style scoped>
.specification-input-hint {
  margin-left: var(--spacing-xs);
  font-size: var(--font-size-sm);
}
</style>
