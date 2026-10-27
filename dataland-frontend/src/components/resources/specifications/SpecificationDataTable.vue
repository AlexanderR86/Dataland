<template>
  <!-- @vue-generic {T} -->
  <MultiLayerDataTable
    :config="config"
    :data-and-meta-info="dataAndMetaInfo"
    :ariaLabel="ariaLabel"
    :in-review-mode="inReviewMode"
    :hide-empty-fields="hideEmptyFields"
    :specification-field-links="fieldLinks"
    @data-updated="emit('dataUpdated')"
  />
</template>

<script setup lang="ts" generic="T">
import MultiLayerDataTable from '@/components/resources/dataTable/MultiLayerDataTable.vue';
import type { MLDTConfig } from '@/components/resources/dataTable/MultiLayerDataTableConfiguration';
import type { DataAndMetaInformation } from '@/api-models/DataAndMetaInformation';
import { useSpecificationFieldLinks } from '@/utils/specifications/useSpecificationFieldLinks';

const props = defineProps<{
  frameworkIdentifier: string;
  config: MLDTConfig<T>;
  dataAndMetaInfo: Array<DataAndMetaInformation<T>>;
  ariaLabel: string;
  inReviewMode: boolean;
  hideEmptyFields: boolean;
}>();
const emit = defineEmits<{ dataUpdated: [] }>();
const fieldLinks = useSpecificationFieldLinks(() => props.frameworkIdentifier);
</script>
