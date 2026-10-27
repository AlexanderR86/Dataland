<template>
  <TheContent>
    <div class="p-4 text-left" data-test="specificationFrameworkDetail">
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

      <div class="specification-columns">
        <div class="specification-tree-column">
          <SpecificationFrameworkTree
            :framework-id="frameworkId"
            :selected-path="selectedPath"
            @select-path="onSelectPath"
          />
        </div>
        <div ref="detailColumn" class="specification-detail-column" data-test="specificationDetailColumn">
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
import { computed, nextTick, ref } from 'vue';
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

const detailColumn = ref<HTMLElement | null>(null);
const NARROW_VIEWPORT_QUERY = '(max-width: 991px)';

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
async function onSelectPath(path: string | undefined): Promise<void> {
  const navigationFailure = await router.push({
    name: 'Specifications Framework Detail',
    params: { frameworkId: frameworkId.value },
    query: path ? { field: path } : {},
  });
  if (!navigationFailure && path && window.matchMedia(NARROW_VIEWPORT_QUERY).matches) {
    await nextTick();
    detailColumn.value?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
}

/**
 * Navigates back to the overview of all framework specifications.
 */
function goBackToOverview(): void {
  void router.push({ name: 'Specifications Overview' });
}
</script>

<style scoped>
.specification-columns {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-lg);
}

.specification-tree-column {
  min-width: 0;
  max-height: 40vh;
  overflow: auto;
}

.specification-detail-column {
  min-width: 0;
  scroll-margin-top: var(--spacing-md);
}

@media (min-width: 992px) {
  .specification-columns {
    flex-direction: row;
  }

  .specification-tree-column {
    flex: 2 1 0;
    max-height: 75vh;
  }

  .specification-detail-column {
    flex: 3 1 0;
    position: sticky;
    top: var(--spacing-md);
    align-self: flex-start;
    max-height: 90vh;
    overflow: auto;
  }
}
</style>
