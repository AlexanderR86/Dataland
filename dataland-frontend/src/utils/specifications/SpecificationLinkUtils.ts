import type { SimpleFrameworkSpecification } from '@clients/specificationservice';
import {
  isDataPointReference,
  isSchemaObject,
  parseFrameworkSchema,
} from '@/utils/specifications/SpecificationTreeUtils';

export interface SpecificationFieldLinks {
  frameworkId: string;
  pathsByType: Map<string, string[]>;
}

/** Builds a type-to-path index; malformed schemas yield no links. */
export function buildSpecificationFieldPaths(schema: string): Map<string, string[]> {
  const paths = new Map<string, string[]>();
  try {
    collectSpecificationFieldPaths(parseFrameworkSchema(schema), '', paths);
  } catch {
    return new Map();
  }
  return paths;
}

/** Collects actual schema paths without deriving them from display labels. */
function collectSpecificationFieldPaths(node: unknown, path: string, paths: Map<string, string[]>): void {
  if (!isSchemaObject(node)) return;
  if (isDataPointReference(node)) {
    const id = node.id as string;
    paths.set(id, [...(paths.get(id) ?? []), path]);
    return;
  }
  for (const [key, child] of Object.entries(node)) {
    collectSpecificationFieldPaths(child, path ? `${path}.${key}` : key, paths);
  }
}

/** Resolves only an exact explicit path or a unique occurrence of a data point type. */
export function getSpecificationFieldPath(
  pathsByType: Map<string, string[]>,
  dataPointTypeId: string | undefined,
  fieldPath?: string
): string | undefined {
  if (!dataPointTypeId) return undefined;
  const paths = pathsByType.get(dataPointTypeId) ?? [];
  if (fieldPath) return paths.includes(fieldPath) ? fieldPath : undefined;
  return paths.length === 1 ? paths[0] : undefined;
}

/**
 * Resolves a dataset framework to an available specification without substituting a different framework version.
 * @param dataType the framework identifier of the dataset
 * @param frameworks the framework specifications returned by the service
 * @returns the matching specification id, or undefined if no specification is available
 */
export function getSpecificationFrameworkId(
  dataType: string,
  frameworks: SimpleFrameworkSpecification[] | undefined
): string | undefined {
  return frameworks?.find((framework) => framework.framework.id === dataType)?.framework.id;
}
