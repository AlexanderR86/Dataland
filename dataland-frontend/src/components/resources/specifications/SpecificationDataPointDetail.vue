<template>
  <div data-test="specificationDataPointDetail">
    <div v-if="isPending" class="d-center-div text-center px-7 py-4" data-test="specificationDataPointLoading">
      <p class="font-medium text-xl">Loading...</p>
      <DatalandProgressSpinner />
    </div>

    <div v-else-if="isError" class="d-center-div text-center px-7 py-4" data-test="specificationDataPointError">
      <p class="font-medium text-xl text-red-500">{{ error?.message || 'The data point could not be loaded.' }}</p>
      <PrimeButton
        label="RETRY"
        icon="pi pi-refresh"
        data-test="specificationDataPointRetryButton"
        @click="refetch()"
      />
    </div>

    <template v-else-if="dataPointType">
      <h2 class="mb-1" data-test="specificationDataPointName">{{ dataPointType.name }}</h2>
      <p class="text-sm mb-3">ID: {{ dataPointType.dataPointType.id }}</p>

      <h3 class="mb-1">Definition</h3>
      <p class="mb-3" style="white-space: pre-line" data-test="specificationDataPointDefinition">
        {{ dataPointType.businessDefinition }}
      </p>

      <h3 class="mb-1">Frameworks</h3>
      <ul v-if="dataPointType.usedBy.length > 0" class="mt-0 mb-3" data-test="specificationDataPointFrameworks">
        <li v-for="usedByFramework in dataPointType.usedBy" :key="usedByFramework.id">
          <RouterLink :to="{ name: 'Specifications Framework Detail', params: { frameworkId: usedByFramework.id } }">
            {{ getFrameworkLabel(usedByFramework.id) }}
          </RouterLink>
        </li>
      </ul>
      <p v-else class="mb-3">None</p>

      <h3 class="mb-1">Constraints</h3>
      <ul v-if="constraints.length > 0" class="mt-0 mb-3" data-test="specificationDataPointConstraints">
        <li v-for="constraint in constraints" :key="constraint">
          <code>{{ constraint }}</code>
        </li>
      </ul>
      <p v-else class="mb-3">None</p>

      <h3 class="mb-1">Calculation rules</h3>
      <ul v-if="dataPointType.calculationRules.length > 0" class="mt-0 mb-3" data-test="specificationDataPointRules">
        <li v-for="(rule, index) in dataPointType.calculationRules" :key="index">
          {{ rule.calculationMethod }} (inputs: {{ rule.inputs.join(', ') }})
        </li>
      </ul>
      <p v-else class="mb-3">None</p>

      <SpecificationBaseTypeDetail
        :data-point-base-type-id="dataPointType.dataPointBaseType.id"
        :framework-id="frameworkId"
        :path="path"
      />
    </template>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { RouterLink } from 'vue-router';
import PrimeButton from 'primevue/button';
import DatalandProgressSpinner from '@/components/general/DatalandProgressSpinner.vue';
import SpecificationBaseTypeDetail from '@/components/resources/specifications/SpecificationBaseTypeDetail.vue';
import { useGetSpecificationDataPointTypeByIdQuery } from '@/api-queries/specification-service/data-point-type/useGetSpecificationDataPointTypeByIdQuery';
import { useListSpecificationFrameworksQuery } from '@/api-queries/specification-service/framework/useListSpecificationFrameworksQuery';

const props = defineProps<{
  dataPointTypeId: string;
  frameworkId: string;
  path: string;
}>();

const {
  data: dataPointType,
  isPending,
  isError,
  error,
  refetch,
} = useGetSpecificationDataPointTypeByIdQuery({ dataPointTypeId: () => props.dataPointTypeId });

const { data: frameworks } = useListSpecificationFrameworksQuery();

const frameworkNamesById = computed(
  () => new Map((frameworks.value ?? []).map((framework) => [framework.framework.id, framework.name]))
);
const constraints = computed(() => dataPointType.value?.constraints ?? []);

/**
 * Resolves the display name of a framework and falls back to its id if the name is not available.
 */
function getFrameworkLabel(frameworkId: string): string {
  return frameworkNamesById.value.get(frameworkId) ?? frameworkId;
}
</script>
