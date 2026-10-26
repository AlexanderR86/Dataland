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
      <h1 class="mb-2">Framework {{ frameworkId }}</h1>
      <p>Placeholder: the schema of this framework will be shown here.</p>
    </div>
  </TheContent>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import PrimeButton from 'primevue/button';
import TheContent from '@/components/generics/TheContent.vue';

const route = useRoute();
const router = useRouter();

const frameworkId = computed(() => String(route.params.frameworkId));

/**
 * Navigates back to the overview of all framework specifications.
 */
function goBackToOverview(): void {
  void router.push({ name: 'Specifications Overview' });
}
</script>
