import type { TreeNode } from 'primevue/treenode';
import { convertCamelCaseToSentenceCase } from '@/utils/StringFormatter';

export interface SpecificationLeafData {
  dataPointTypeId: string;
  aliasExport: string | null;
}

export type SchemaObject = { [key: string]: unknown };

/**
 * Parses the schema string of a framework specification into an object.
 * @param schema the schema as JSON string
 * @returns the parsed schema object
 * @throws {Error} if the schema is not valid JSON or not a JSON object
 */
export function parseFrameworkSchema(schema: string): SchemaObject {
  const parsed: unknown = JSON.parse(schema);
  if (!isSchemaObject(parsed)) {
    throw new Error('The framework schema is not a JSON object.');
  }
  return parsed;
}

/**
 * Converts the nested schema of a framework specification into PrimeVue tree nodes.
 * Categories and subcategories become selectable=false nodes, data points become leaf nodes.
 * @param schema the parsed schema object
 * @returns the root nodes of the tree
 */
export function buildSpecificationTree(schema: SchemaObject): TreeNode[] {
  return buildNodes(schema, '');
}

/**
 * Collects the keys of all nodes that have children.
 * @param nodes the tree nodes to traverse
 * @returns the keys of all expandable nodes
 */
export function collectExpandableKeys(nodes: TreeNode[]): string[] {
  return nodes.flatMap((node) =>
    node.children && node.children.length > 0 ? [node.key as string, ...collectExpandableKeys(node.children)] : []
  );
}

export type SpecificationSearchMode = 'name' | 'id';

/**
 * Checks whether a leaf node matches a search query.
 * In name mode the readable label and the raw schema key are searched, in id mode the data point type id.
 */
function leafMatches(node: TreeNode, query: string, mode: SpecificationSearchMode): boolean {
  if (mode === 'id') {
    const leafData = node.data as SpecificationLeafData | undefined;
    return (leafData?.dataPointTypeId ?? '').toLowerCase().includes(query);
  }
  const rawKey =
    String(node.key ?? '')
      .split('.')
      .at(-1) ?? '';
  return (node.label ?? '').toLowerCase().includes(query) || rawKey.toLowerCase().includes(query);
}

/**
 * Filters the specification tree. A leaf is kept if it matches, a category is kept if any descendant matches.
 * @param nodes the tree nodes to filter
 * @param query the search text, matched case-insensitively
 * @param mode whether to search by name or by data point type id
 * @returns a filtered copy of the tree, or the original nodes if the query is blank
 */
export function filterSpecificationTree(nodes: TreeNode[], query: string, mode: SpecificationSearchMode): TreeNode[] {
  const normalizedQuery = query.trim().toLowerCase();
  if (!normalizedQuery) return nodes;
  return nodes.flatMap((node) => {
    if (node.children) {
      const children = filterSpecificationTree(node.children, normalizedQuery, mode);
      return children.length > 0 ? [{ ...node, children }] : [];
    }
    return leafMatches(node, normalizedQuery, mode) ? [node] : [];
  });
}

/**
 * Converts a camelCase schema key into a readable name, e.g. "fiscalYearDeviation" becomes "Fiscal Year Deviation".
 * @param key the schema key
 * @returns the readable name
 */
export function formatSchemaKey(key: string): string {
  return convertCamelCaseToSentenceCase(key);
}

/**
 * Converts a dot-separated schema path into readable names joined by a separator.
 * @param path the dot-separated path
 * @param separator the separator between the names
 * @returns the readable path
 */
export function formatSchemaPath(path: string, separator = ' › '): string {
  return path.split('.').map(formatSchemaKey).join(separator);
}

/**
 * Checks if a value is a plain JSON object.
 */
export function isSchemaObject(value: unknown): value is SchemaObject {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/**
 * Checks if a schema node is a data point reference, i.e. a leaf of the schema.
 */
export function isDataPointReference(value: SchemaObject): boolean {
  return typeof value.id === 'string' && typeof value.ref === 'string';
}

/**
 * Recursively builds the tree nodes for the entries of a schema object.
 */
function buildNodes(schema: SchemaObject, parentPath: string): TreeNode[] {
  const nodes: TreeNode[] = [];
  for (const [key, value] of Object.entries(schema)) {
    if (!isSchemaObject(value)) continue;
    const path = parentPath ? `${parentPath}.${key}` : key;
    if (isDataPointReference(value)) {
      const data: SpecificationLeafData = {
        dataPointTypeId: value.id as string,
        aliasExport: typeof value.aliasExport === 'string' ? value.aliasExport : null,
      };
      nodes.push({ key: path, label: formatSchemaKey(key), leaf: true, selectable: true, data });
    } else {
      nodes.push({ key: path, label: formatSchemaKey(key), selectable: false, children: buildNodes(value, path) });
    }
  }
  return nodes;
}
