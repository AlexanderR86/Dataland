<template>
  <pre class="specification-json" :data-test="dataTest" tabindex="0">{{ formattedJson }}</pre>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { formatJson } from '@/utils/specifications/SpecificationDetailUtils';

const props = defineProps<{
  value: unknown;
  dataTest?: string;
}>();

const formattedJson = computed(() => formatJson(props.value));
</script>

<style scoped>
.specification-json {
  margin: 0;
  padding: var(--spacing-sm);
  max-height: 24rem;
  overflow: auto;
  text-align: left;
  white-space: pre;
  font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, 'Liberation Mono', monospace;
  font-size: var(--font-size-sm);
  line-height: 1.5;
  background: var(--p-surface-50, #f8f9fa);
  border: 1px solid var(--p-surface-200, #dee2e6);
  border-radius: 4px;
}
</style>
