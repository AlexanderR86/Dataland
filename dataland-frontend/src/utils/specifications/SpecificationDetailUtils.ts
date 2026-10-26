import { isDataPointReference, isSchemaObject } from '@/utils/specifications/SpecificationTreeUtils';

/**
 * Walks a dot-separated path through a nested schema object.
 * @param schema the nested schema object
 * @param path the dot-separated path, e.g. "general.company.mainPcafSector"
 * @returns the value at the path or undefined if the path does not exist
 */
export function getSchemaAtPath(schema: object, path: string): unknown {
  let current: unknown = schema;
  for (const segment of path.split('.')) {
    if (!isSchemaObject(current) || !(segment in current)) {
      return undefined;
    }
    current = current[segment];
  }
  return current;
}

/**
 * Reads the id of the data point type at a path of a parsed framework schema.
 * @param schema the parsed framework schema
 * @param path the dot-separated path of a leaf
 * @returns the data point type id or undefined if the path does not point to a data point
 */
export function getDataPointTypeIdAtPath(schema: object, path: string): string | undefined {
  const node = getSchemaAtPath(schema, path);
  return isSchemaObject(node) && isDataPointReference(node) ? (node.id as string) : undefined;
}

/**
 * Lists the keys of all ancestors of a path, e.g. "a.b.c" yields ["a", "a.b"].
 * @param path the dot-separated path
 * @returns the keys of the ancestors, from the root downwards
 */
export function getAncestorKeys(path: string): string[] {
  const segments = path.split('.');
  return segments.slice(0, -1).map((_, index) => segments.slice(0, index + 1).join('.'));
}

/**
 * Formats a value as indented JSON for display.
 * @param value the value to format
 * @returns the formatted JSON string
 */
export function formatJson(value: unknown): string {
  return JSON.stringify(value, null, 2);
}
