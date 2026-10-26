export const specificationDataPointTypeKeys = {
  all: ['specificationDataPointType'] as const,
  byId: (dataPointTypeId: string | undefined) =>
    [...specificationDataPointTypeKeys.all, 'byId', dataPointTypeId] as const,
};
