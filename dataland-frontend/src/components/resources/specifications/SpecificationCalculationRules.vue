<template>
  <Panel header="Rules" toggleable data-test="specificationCalculationRules">
    <div
      v-for="(rule, index) in rules"
      :key="index"
      :class="{ 'mt-3': index > 0 }"
      :data-test="`specificationCalculationRule-${index}`"
    >
      <div class="flex align-items-center gap-2 mb-2">
        <span v-if="rules.length > 1" class="font-semibold">Rule {{ index + 1 }}</span>
        <Tag :value="rule.calculationMethod" severity="secondary" />
      </div>
      <p class="specification-inputs-label">Inputs</p>
      <ul v-if="rule.inputs.length > 0" class="specification-inputs">
        <li v-for="input in rule.inputs" :key="input">
          <code>{{ input }}</code>
        </li>
      </ul>
      <p v-else class="m-0">None</p>
    </div>
  </Panel>
</template>

<script setup lang="ts">
import Panel from 'primevue/panel';
import Tag from 'primevue/tag';
import { type CalculationRule } from '@clients/specificationservice';

defineProps<{
  rules: CalculationRule[];
}>();
</script>

<style scoped>
.specification-inputs-label {
  margin: 0 0 var(--spacing-xxs) 0;
  font-weight: var(--font-weight-semibold);
  font-size: var(--font-size-sm);
  text-transform: uppercase;
}

.specification-inputs {
  margin: 0;
  padding-left: var(--spacing-lg);
  text-align: left;
}

.specification-inputs li {
  overflow-wrap: anywhere;
}
</style>
