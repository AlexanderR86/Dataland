<template>
  <div class="text-left" data-test="specificationDataPointDetail">
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
      <Card data-test="specificationDataPointCard">
        <template #subtitle>
          <span v-if="breadcrumb" data-test="specificationDataPointBreadcrumb">{{ breadcrumb }}</span>
        </template>
        <template #title>
          <span data-test="specificationDataPointName">{{ fieldName }}</span>
        </template>
        <template #content>
          <dl class="specification-facts">
            <dt>ID</dt>
            <dd>
              <code>{{ dataPointType.dataPointType.id }}</code>
            </dd>

            <dt>Data point type</dt>
            <dd data-test="specificationDataPointTypeName">{{ dataPointType.name }}</dd>

            <dt>Definition</dt>
            <dd style="white-space: pre-line" data-test="specificationDataPointDefinition">
              {{ dataPointType.businessDefinition }}
            </dd>

            <dt>Frameworks</dt>
            <dd>
              <div
                v-if="dataPointType.usedBy.length > 0"
                class="flex flex-wrap gap-2"
                data-test="specificationDataPointFrameworks"
              >
                <RouterLink
                  v-for="usedByFramework in dataPointType.usedBy"
                  :key="usedByFramework.id"
                  :to="{ name: 'Specifications Framework Detail', params: { frameworkId: usedByFramework.id } }"
                  style="text-decoration: none"
                >
                  <Tag :value="getFrameworkLabel(usedByFramework.id)" severity="secondary" />
                </RouterLink>
              </div>
              <span v-else>None</span>
            </dd>

            <dt>Constraints</dt>
            <dd>
              <div
                v-if="constraints.length > 0"
                class="flex flex-wrap gap-2"
                data-test="specificationDataPointConstraints"
              >
                <Tag v-for="constraint in constraints" :key="constraint" :value="constraint" severity="secondary" />
              </div>
              <span v-else>None</span>
            </dd>

            <dt>Calculation rules</dt>
            <dd>
              <SpecificationCalculationRules
                v-if="dataPointType.calculationRules.length > 0"
                :rules="dataPointType.calculationRules"
              />
              <span v-else data-test="specificationNoCalculationRules">None</span>
            </dd>
          </dl>
        </template>
      </Card>

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
import Card from 'primevue/card';
import PrimeButton from 'primevue/button';
import Tag from 'primevue/tag';
import DatalandProgressSpinner from '@/components/general/DatalandProgressSpinner.vue';
import SpecificationCalculationRules from '@/components/resources/specifications/SpecificationCalculationRules.vue';
import SpecificationBaseTypeDetail from '@/components/resources/specifications/SpecificationBaseTypeDetail.vue';
import { formatSchemaKey, formatSchemaPath } from '@/utils/specifications/SpecificationTreeUtils';
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
const breadcrumb = computed(() => formatSchemaPath(props.path.split('.').slice(0, -1).join('.')));
const fieldName = computed(() => formatSchemaKey(props.path.split('.').at(-1) ?? props.path));

/**
 * Resolves the display name of a framework and falls back to its id if the name is not available.
 */
function getFrameworkLabel(frameworkId: string): string {
  return frameworkNamesById.value.get(frameworkId) ?? frameworkId;
}
</script>

<style scoped>
.specification-facts {
  display: grid;
  grid-template-columns: max-content 1fr;
  gap: var(--spacing-xs) var(--spacing-md);
  margin: 0;
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
