<template>
  <section class="mt-4" data-test="specificationBaseTypeDetail">
    <h3 class="mb-2">Base type</h3>

    <div v-if="isPending" data-test="specificationBaseTypeLoading">
      <p class="font-medium">Loading...</p>
      <DatalandProgressSpinner />
    </div>

    <div v-else-if="isError" data-test="specificationBaseTypeError">
      <p class="font-medium text-red-500">{{ error?.message || 'The base type could not be loaded.' }}</p>
      <PrimeButton label="RETRY" icon="pi pi-refresh" data-test="specificationBaseTypeRetryButton" @click="refetch()" />
    </div>

    <template v-else-if="baseType">
      <p class="font-semibold mb-1" data-test="specificationBaseTypeName">{{ baseType.name }}</p>
      <p class="text-sm mb-2">ID: {{ baseType.dataPointBaseType.id }}</p>
      <p class="mb-2" style="white-space: pre-line">{{ baseType.businessDefinition }}</p>
      <p class="mb-3">
        Validated by: <code data-test="specificationBaseTypeValidatedBy">{{ baseType.validatedBy }}</code>
      </p>

      <h4 class="mb-1">Schema</h4>
      <div v-if="isSchemaPending" data-test="specificationSchemaLoading">
        <p class="font-medium">Loading...</p>
        <DatalandProgressSpinner />
      </div>
      <div v-else-if="isSchemaError" data-test="specificationSchemaError">
        <p class="font-medium text-red-500">The schema could not be loaded.</p>
        <PrimeButton
          label="RETRY"
          icon="pi pi-refresh"
          data-test="specificationSchemaRetryButton"
          @click="refetchSchema()"
        />
      </div>
      <pre
        v-else-if="schema !== undefined"
        class="overflow-auto p-2 surface-100 border-round"
        data-test="specificationSchema"
        >{{ formatJson(schema) }}</pre>
      <p v-else data-test="specificationSchemaMissing">No schema is available for this field.</p>

      <h4 class="mb-1 mt-3">Example</h4>
      <pre class="overflow-auto p-2 surface-100 border-round" data-test="specificationExample">{{
        formatJson(baseType.example)
      }}</pre>
    </template>
  </section>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import PrimeButton from 'primevue/button';
import DatalandProgressSpinner from '@/components/general/DatalandProgressSpinner.vue';
import { useGetSpecificationDataPointBaseTypeByIdQuery } from '@/api-queries/specification-service/data-point-base-type/useGetSpecificationDataPointBaseTypeByIdQuery';
import { useGetResolvedSpecificationFrameworkByIdQuery } from '@/api-queries/specification-service/framework/useGetResolvedSpecificationFrameworkByIdQuery';
import { formatJson, getSchemaAtPath } from '@/utils/specifications/SpecificationDetailUtils';

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
