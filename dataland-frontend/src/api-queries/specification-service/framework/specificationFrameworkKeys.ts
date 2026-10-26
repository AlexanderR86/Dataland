export const specificationFrameworkKeys = {
  all: ['specificationFramework'] as const,
  list: () => [...specificationFrameworkKeys.all, 'list'] as const,
  byId: (frameworkId: string | undefined) => [...specificationFrameworkKeys.all, 'byId', frameworkId] as const,
  resolvedById: (frameworkId: string | undefined) =>
    [...specificationFrameworkKeys.all, 'resolvedById', frameworkId] as const,
};
