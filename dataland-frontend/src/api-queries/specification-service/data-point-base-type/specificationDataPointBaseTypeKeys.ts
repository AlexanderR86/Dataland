export const specificationDataPointBaseTypeKeys = {
  all: ['specificationDataPointBaseType'] as const,
  byId: (dataPointBaseTypeId: string | undefined) =>
    [...specificationDataPointBaseTypeKeys.all, 'byId', dataPointBaseTypeId] as const,
};
