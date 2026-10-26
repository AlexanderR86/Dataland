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
      <SpecificationFrameworkTree :framework-id="frameworkId" />
    </div>
  </TheContent>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import PrimeButton from 'primevue/button';
import TheContent from '@/components/generics/TheContent.vue';
import SpecificationFrameworkTree from '@/components/resources/specifications/SpecificationFrameworkTree.vue';
import { useGetSpecificationFrameworkByIdQuery } from '@/api-queries/specification-service/framework/useGetSpecificationFrameworkByIdQuery';

const route = useRoute();
const router = useRouter();

const frameworkId = computed(() => String(route.params.frameworkId));
const { data: framework } = useGetSpecificationFrameworkByIdQuery({ frameworkId });

/**
 * Navigates back to the overview of all framework specifications.
 */
function goBackToOverview(): void {
  void router.push({ name: 'Specifications Overview' });
}
</script>
