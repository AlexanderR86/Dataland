<template>
  <div v-if="isPending" class="d-center-div text-center px-7 py-4" data-test="specificationTreeLoading">
    <p class="font-medium text-xl">Loading...</p>
    <DatalandProgressSpinner />
  </div>

  <div v-else-if="isError" class="d-center-div text-center px-7 py-4" data-test="specificationTreeError">
    <p class="font-medium text-xl text-red-500">
      {{ error?.message || 'The framework could not be loaded.' }}
    </p>
    <PrimeButton label="RETRY" icon="pi pi-refresh" data-test="specificationTreeRetryButton" @click="refetch()" />
  </div>

  <div v-else-if="schemaError" class="d-center-div text-center px-7 py-4" data-test="specificationTreeSchemaError">
    <p class="font-medium text-xl text-red-500">{{ schemaError }}</p>
  </div>

  <div v-else-if="nodes.length === 0" class="text-center px-7 py-4" data-test="specificationTreeEmpty">
    This framework has no fields.
  </div>

  <div v-else data-test="specificationTree">
    <div class="flex gap-2 mb-3">
      <PrimeButton
        variant="text"
        icon="pi pi-plus"
        label="EXPAND ALL"
        data-test="specificationTreeExpandAll"
        @click="expandAll"
      />
      <PrimeButton
        variant="text"
        icon="pi pi-minus"
        label="COLLAPSE ALL"
        data-test="specificationTreeCollapseAll"
        @click="collapseAll"
      />
    </div>
    <Tree
      v-model:expanded-keys="expandedKeys"
      :selection-keys="selectedKeys"
      :value="nodes"
      selection-mode="single"
      @node-select="onNodeSelect"
      @node-unselect="emit('select-path', undefined)"
    />
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import PrimeButton from 'primevue/button';
import Tree, { type TreeExpandedKeys } from 'primevue/tree';
import type { TreeNode } from 'primevue/treenode';
import DatalandProgressSpinner from '@/components/general/DatalandProgressSpinner.vue';
import { useGetSpecificationFrameworkByIdQuery } from '@/api-queries/specification-service/framework/useGetSpecificationFrameworkByIdQuery';
import {
  buildSpecificationTree,
  collectExpandableKeys,
  parseFrameworkSchema,
} from '@/utils/specifications/SpecificationTreeUtils';
import { getAncestorKeys } from '@/utils/specifications/SpecificationDetailUtils';

const props = defineProps<{
  frameworkId: string;
  selectedPath?: string;
}>();

const emit = defineEmits<{
  (event: 'select-path', path: string | undefined): void;
}>();

const { data, isPending, isError, error, refetch } = useGetSpecificationFrameworkByIdQuery({
  frameworkId: () => props.frameworkId,
});

const expandedKeys = ref<TreeExpandedKeys>({});
const selectedKeys = computed(() => (props.selectedPath ? { [props.selectedPath]: true } : {}));

watch(
  () => props.selectedPath,
  (path) => {
    if (path) {
      const ancestors = Object.fromEntries(getAncestorKeys(path).map((key) => [key, true]));
      expandedKeys.value = { ...expandedKeys.value, ...ancestors };
    }
  },
  { immediate: true }
);

const parsedTree = computed<{ nodes: TreeNode[]; errorMessage: string | null }>(() => {
  if (!data.value) return { nodes: [], errorMessage: null };
  try {
    return { nodes: buildSpecificationTree(parseFrameworkSchema(data.value.schema)), errorMessage: null };
  } catch (parseError) {
    const reason = parseError instanceof Error ? parseError.message : 'Unknown error';
    return { nodes: [], errorMessage: `The schema of this framework could not be read: ${reason}` };
  }
});
const nodes = computed(() => parsedTree.value.nodes);
const schemaError = computed(() => parsedTree.value.errorMessage);

/**
 * Expands all categories and subcategories of the tree.
 */
function expandAll(): void {
  expandedKeys.value = Object.fromEntries(collectExpandableKeys(nodes.value).map((key) => [key, true]));
}

/**
 * Collapses all categories and subcategories of the tree.
 */
function collapseAll(): void {
  expandedKeys.value = {};
}

/**
 * Emits the path of the selected leaf.
 */
function onNodeSelect(node: TreeNode): void {
  if (node.leaf) {
    emit('select-path', node.key);
  }
}
</script>
