<template>
  <Card class="mt-4" data-test="specificationBaseTypeDetail">
    <template #title>Base type</template>
    <template #content>
      <div v-if="isPending" class="text-center" data-test="specificationBaseTypeLoading">
        <p class="font-medium">Loading...</p>
        <DatalandProgressSpinner />
      </div>

      <div v-else-if="isError" class="text-center" data-test="specificationBaseTypeError">
        <p class="font-medium text-red-500">{{ error?.message || 'The base type could not be loaded.' }}</p>
        <PrimeButton
          label="RETRY"
          icon="pi pi-refresh"
          data-test="specificationBaseTypeRetryButton"
          @click="refetch()"
        />
      </div>

      <template v-else-if="baseType">
        <p class="font-semibold text-lg mt-0 mb-3" data-test="specificationBaseTypeName">{{ baseType.name }}</p>

        <dl class="specification-facts">
          <dt>ID</dt>
          <dd>
            <code>{{ baseType.dataPointBaseType.id }}</code>
          </dd>
          <dt>Definition</dt>
          <dd style="white-space: pre-line">{{ baseType.businessDefinition }}</dd>
          <dt>Validated by</dt>
          <dd>
            <code data-test="specificationBaseTypeValidatedBy">{{ baseType.validatedBy }}</code>
          </dd>
        </dl>

        <Panel header="SCHEMA" toggleable collapsed class="mb-3" data-test="specificationSchemaPanel">
          <div v-if="isSchemaPending" class="text-center" data-test="specificationSchemaLoading">
            <p class="font-medium">Loading...</p>
            <DatalandProgressSpinner />
          </div>
          <div v-else-if="isSchemaError" class="text-center" data-test="specificationSchemaError">
            <p class="font-medium text-red-500">The schema could not be loaded.</p>
            <PrimeButton
              label="RETRY"
              icon="pi pi-refresh"
              data-test="specificationSchemaRetryButton"
              @click="refetchSchema()"
            />
          </div>
          <SpecificationJsonView v-else-if="schema !== undefined" :value="schema" data-test="specificationSchema" />
          <p v-else class="m-0" data-test="specificationSchemaMissing">No schema is available for this field.</p>
        </Panel>

        <Panel header="EXAMPLE" toggleable collapsed data-test="specificationExamplePanel">
          <SpecificationJsonView :value="baseType.example" data-test="specificationExample" />
        </Panel>
      </template>
    </template>
  </Card>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import Card from 'primevue/card';
import Panel from 'primevue/panel';
import PrimeButton from 'primevue/button';
import DatalandProgressSpinner from '@/components/general/DatalandProgressSpinner.vue';
import SpecificationJsonView from '@/components/resources/specifications/SpecificationJsonView.vue';
import { useGetSpecificationDataPointBaseTypeByIdQuery } from '@/api-queries/specification-service/data-point-base-type/useGetSpecificationDataPointBaseTypeByIdQuery';
import { useGetResolvedSpecificationFrameworkByIdQuery } from '@/api-queries/specification-service/framework/useGetResolvedSpecificationFrameworkByIdQuery';
import { getSchemaAtPath } from '@/utils/specifications/SpecificationDetailUtils';

const props = defineProps<{
  dataPointBaseTypeId: string;
  frameworkId: string;
  path: string;
}>();

const {
  data: baseType,
  isPending,
  isError,
  error,
  refetch,
} = useGetSpecificationDataPointBaseTypeByIdQuery({
  dataPointBaseTypeId: () => props.dataPointBaseTypeId,
});

const {
  data: resolvedFramework,
  isPending: isSchemaPending,
  isError: isSchemaError,
  refetch: refetchSchema,
} = useGetResolvedSpecificationFrameworkByIdQuery({ frameworkId: () => props.frameworkId });

const schema = computed(() =>
  resolvedFramework.value ? getSchemaAtPath(resolvedFramework.value.resolvedSchema, props.path) : undefined
);
</script>

<style scoped>
.specification-facts {
  display: grid;
  grid-template-columns: max-content 1fr;
  gap: var(--spacing-xs) var(--spacing-md);
  margin: 0 0 var(--spacing-md) 0;
  text-align: left;
}

.specification-facts dt {
  font-weight: var(--font-weight-semibold);
  text-transform: uppercase;
  font-size: var(--font-size-sm);
}

.specification-facts dd {
  margin: 0;
  overflow-wrap: anywhere;
}
</style>
