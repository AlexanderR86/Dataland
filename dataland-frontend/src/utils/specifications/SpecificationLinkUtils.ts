import type { SimpleFrameworkSpecification } from '@clients/specificationservice';

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
