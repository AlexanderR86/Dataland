<template>
  <RouterLink
    v-if="fieldPath && links"
    :to="{
      name: 'Specifications Framework Detail',
      params: { frameworkId: links.frameworkId },
      query: { field: fieldPath },
    }"
    target="_blank"
    rel="noopener noreferrer"
    :aria-label="`Open specification for ${label} (opens in a new tab)`"
    title="Open field specification in a new tab"
    class="ml-2"
    data-test="specificationFieldLink"
    @click.stop
  >
    <i class="pi pi-info-circle" aria-hidden="true" />
  </RouterLink>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { RouterLink } from 'vue-router';
import { getSpecificationFieldPath, type SpecificationFieldLinks } from '@/utils/specifications/SpecificationLinkUtils';

const props = defineProps<{
  links?: SpecificationFieldLinks;
  dataPointTypeId?: string;
  explicitFieldPath?: string;
  label: string;
}>();
const fieldPath = computed(() =>
  props.links
    ? getSpecificationFieldPath(props.links.pathsByType, props.dataPointTypeId, props.explicitFieldPath)
    : undefined
);
</script>
