<template>
  <TheContent>
    <div class="p-4" data-test="specificationFrameworkDetail">
      <PrimeButton
        variant="text"
        icon="pi pi-arrow-left"
        label="BACK"
        data-test="specificationsBackButton"
        @click="goBackToOverview"
      />
      <h1 class="mb-2" data-test="specificationFrameworkName">{{ framework?.name ?? frameworkId }}</h1>
      <p v-if="framework" class="mb-4" data-test="specificationFrameworkDefinition">
        {{ framework.businessDefinition }}
      </p>

      <div class="flex flex-column lg:flex-row gap-4">
        <div class="flex-1" style="min-width: 0">
          <SpecificationFrameworkTree
            :framework-id="frameworkId"
            :selected-path="selectedPath"
            @select-path="onSelectPath"
          />
        </div>
        <div class="flex-1" style="min-width: 0" data-test="specificationDetailColumn">
          <SpecificationDataPointDetail
            v-if="selectedPath && dataPointTypeId"
            :data-point-type-id="dataPointTypeId"
            :framework-id="frameworkId"
            :path="selectedPath"
          />
          <p v-else-if="selectedPath && framework" class="text-red-500" data-test="specificationFieldNotFound">
            The selected field was not found in this framework.
          </p>
          <p v-else-if="!selectedPath" data-test="specificationSelectHint">
            Select a data point to see its documentation.
          </p>
        </div>
      </div>
    </div>
  </TheContent>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import PrimeButton from 'primevue/button';
import TheContent from '@/components/generics/TheContent.vue';
import SpecificationDataPointDetail from '@/components/resources/specifications/SpecificationDataPointDetail.vue';
import SpecificationFrameworkTree from '@/components/resources/specifications/SpecificationFrameworkTree.vue';
import { useGetSpecificationFrameworkByIdQuery } from '@/api-queries/specification-service/framework/useGetSpecificationFrameworkByIdQuery';
import { getDataPointTypeIdAtPath } from '@/utils/specifications/SpecificationDetailUtils';
import { parseFrameworkSchema } from '@/utils/specifications/SpecificationTreeUtils';

const route = useRoute();
const router = useRouter();

const frameworkId = computed(() => String(route.params.frameworkId));
const selectedPath = computed(() => (typeof route.query.field === 'string' ? route.query.field : undefined));

const { data: framework } = useGetSpecificationFrameworkByIdQuery({ frameworkId });

const dataPointTypeId = computed(() => {
  if (!framework.value || !selectedPath.value) return undefined;
  try {
    return getDataPointTypeIdAtPath(parseFrameworkSchema(framework.value.schema), selectedPath.value);
  } catch {
    return undefined;
  }
});

/**
 * Stores the selected field in the URL so that the selection can be linked.
 */
function onSelectPath(path: string | undefined): void {
  void router.push({
    name: 'Specifications Framework Detail',
    params: { frameworkId: frameworkId.value },
    query: path ? { field: path } : {},
  });
}

/**
 * Navigates back to the overview of all framework specifications.
 */
function goBackToOverview(): void {
  void router.push({ name: 'Specifications Overview' });
}
</script>
