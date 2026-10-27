<template>
  <RouterLink
    v-if="frameworkId"
    :to="{ name: 'Specifications Framework Detail', params: { frameworkId } }"
    data-test="datasetSpecificationLink"
    @click.stop
  >
    {{ label }}
  </RouterLink>
  <span v-else data-test="datasetFrameworkName">{{ label }}</span>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { RouterLink } from 'vue-router';
import { useListSpecificationFrameworksQuery } from '@/api-queries/specification-service/framework/useListSpecificationFrameworksQuery';
import { getSpecificationFrameworkId } from '@/utils/specifications/SpecificationLinkUtils';

const props = defineProps<{
  dataType: string;
  label: string;
}>();

const { data: frameworks } = useListSpecificationFrameworksQuery();
const frameworkId = computed(() => getSpecificationFrameworkId(props.dataType, frameworks.value));
</script>
