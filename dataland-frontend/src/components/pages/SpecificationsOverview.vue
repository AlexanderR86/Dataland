<template>
  <TheContent>
    <div class="p-4" data-test="specificationsOverview">
      <h1 class="mb-2">Specifications</h1>

      <div v-if="isPending" class="d-center-div text-center px-7 py-4" data-test="specificationsLoading">
        <p class="font-medium text-xl">Loading...</p>
        <DatalandProgressSpinner />
      </div>

      <div v-else-if="isError" class="d-center-div text-center px-7 py-4" data-test="specificationsError">
        <p class="font-medium text-xl text-red-500">
          {{ error?.message || 'The frameworks could not be loaded.' }}
        </p>
        <PrimeButton label="RETRY" icon="pi pi-refresh" data-test="specificationsRetryButton" @click="refetch()" />
      </div>

      <DataTable
        v-else
        :value="frameworks"
        :row-hover="true"
        style="cursor: pointer"
        data-test="specificationsFrameworkTable"
        @row-click="onRowClick"
      >
        <Column header="NAME" field="name">
          <template #body="{ data: framework }">
            <RouterLink
              :to="getDetailLocation(framework)"
              :data-test="`specificationFrameworkLink-${framework.framework.id}`"
              @click.stop
            >
              {{ framework.name }}
            </RouterLink>
          </template>
        </Column>
        <Column header="DESCRIPTION">
          <template #body="{ data: framework }">
            <SpecificationFrameworkDescription :framework-id="framework.framework.id" />
          </template>
        </Column>
        <template #empty>
          <div style="text-align: center; font-weight: var(--font-weight-bold)">No frameworks found.</div>
        </template>
      </DataTable>
    </div>
  </TheContent>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { RouterLink, useRouter, type RouteLocationRaw } from 'vue-router';
import PrimeButton from 'primevue/button';
import Column from 'primevue/column';
import DataTable, { type DataTableRowClickEvent } from 'primevue/datatable';
import TheContent from '@/components/generics/TheContent.vue';
import DatalandProgressSpinner from '@/components/general/DatalandProgressSpinner.vue';
import SpecificationFrameworkDescription from '@/components/resources/specifications/SpecificationFrameworkDescription.vue';
import { useListSpecificationFrameworksQuery } from '@/api-queries/specification-service/framework/useListSpecificationFrameworksQuery';
import { type SimpleFrameworkSpecification } from '@clients/specificationservice';

const router = useRouter();

const { data, isPending, isError, error, refetch } = useListSpecificationFrameworksQuery();
const frameworks = computed(() => data.value ?? []);

/**
 * Builds the named route location of the detail page of a framework specification.
 */
function getDetailLocation(framework: SimpleFrameworkSpecification): RouteLocationRaw {
  return { name: 'Specifications Framework Detail', params: { frameworkId: framework.framework.id } };
}

/**
 * Opens the detail page of the clicked framework specification.
 */
function onRowClick(event: DataTableRowClickEvent): void {
  void router.push(getDetailLocation(event.data as SimpleFrameworkSpecification));
}
</script>
