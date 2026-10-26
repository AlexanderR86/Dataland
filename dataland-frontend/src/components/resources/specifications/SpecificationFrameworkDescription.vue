<template>
  <span v-if="isPending" data-test="specificationDescriptionLoading">Loading...</span>
  <span v-else-if="isError" class="text-red-500" data-test="specificationDescriptionError">
    Description could not be loaded.
  </span>
  <span v-else data-test="specificationDescription">{{ data?.businessDefinition }}</span>
</template>

<script setup lang="ts">
import { useGetSpecificationFrameworkByIdQuery } from '@/api-queries/specification-service/framework/useGetSpecificationFrameworkByIdQuery';

const props = defineProps<{
  frameworkId: string;
}>();

const { data, isPending, isError } = useGetSpecificationFrameworkByIdQuery({ frameworkId: () => props.frameworkId });
</script>
