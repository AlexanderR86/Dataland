import {
  type DataPointBaseTypeSpecification,
  type DataPointTypeSpecification,
  type FrameworkSpecification,
  type SimpleFrameworkSpecification,
} from '@clients/specificationservice';

export const FRAMEWORK_ID = 'pcaf';
export const FISCAL_YEAR_DEVIATION_PATH = 'general.general.fiscalYearDeviation';
export const FISCAL_YEAR_DEVIATION_TYPE_ID = 'extendedEnumFiscalYearDeviation';
export const FISCAL_YEAR_END_PATH = 'general.general.fiscalYearEnd';
export const FISCAL_YEAR_END_TYPE_ID = 'extendedDateFiscalYearEnd';
export const MAIN_PCAF_SECTOR_PATH = 'general.company.mainPcafSector';

export const mockFrameworkList: SimpleFrameworkSpecification[] = [
  { framework: { id: FRAMEWORK_ID, ref: 'ref-pcaf' }, name: 'PCAF' },
  { framework: { id: 'sfdr', ref: 'ref-sfdr' }, name: 'SFDR' },
];

const mockSchema = {
  general: {
    general: {
      fiscalYearDeviation: {
        id: FISCAL_YEAR_DEVIATION_TYPE_ID,
        ref: 'ref-deviation',
        aliasExport: 'FISCAL_YEAR_DEVIATION',
      },
      fiscalYearEnd: { id: FISCAL_YEAR_END_TYPE_ID, ref: 'ref-end' },
    },
    company: {
      mainPcafSector: { id: 'extendedEnumMainPcafSector', ref: 'ref-sector' },
    },
  },
};

export const mockFramework: FrameworkSpecification = {
  framework: { id: FRAMEWORK_ID, ref: 'ref-pcaf' },
  name: 'PCAF',
  businessDefinition: 'The Partnership for Carbon Accounting Financials framework.',
  schema: JSON.stringify(mockSchema),
};

export const mockFiscalYearDeviationType: DataPointTypeSpecification = {
  dataPointType: { id: FISCAL_YEAR_DEVIATION_TYPE_ID, ref: 'ref-deviation' },
  name: 'Fiscal Year Deviation Type Name',
  businessDefinition: 'Does the fiscal year deviate from the calendar year?',
  dataPointBaseType: { id: 'baseEnum', ref: 'ref-base' },
  usedBy: [{ id: FRAMEWORK_ID, ref: 'ref-pcaf' }],
  constraints: ['required'],
  calculationRules: [
    { calculationMethod: 'SUM', inputs: ['inputA', 'inputB'] },
    { calculationMethod: 'AVERAGE', inputs: ['inputC'] },
  ],
};

export const mockTypeWithoutRules: DataPointTypeSpecification = {
  ...mockFiscalYearDeviationType,
  dataPointType: { id: FISCAL_YEAR_END_TYPE_ID, ref: 'ref-end' },
  name: 'Fiscal Year End Type Name',
  constraints: null,
  calculationRules: [],
};

export const mockBaseType: DataPointBaseTypeSpecification = {
  dataPointBaseType: { id: 'baseEnum', ref: 'ref-base' },
  name: 'Base Enum Name',
  businessDefinition: 'A base type for enums.',
  validatedBy: 'org.dataland.SomeValidator',
  example: { value: 'Yes' },
  usedBy: [],
};

/**
 * Registers intercepts for all specification service endpoints used by the specification pages.
 */
export function interceptSpecificationService(): void {
  cy.intercept('GET', '**/specifications/frameworks', mockFrameworkList).as('getFrameworks');
  cy.intercept('GET', `**/specifications/frameworks/${FRAMEWORK_ID}`, mockFramework).as('getFramework');
  cy.intercept('GET', `**/specifications/frameworks/${FRAMEWORK_ID}/resolved-schema`, {
    framework: { id: FRAMEWORK_ID, ref: 'ref-pcaf' },
    name: 'PCAF',
    businessDefinition: 'The Partnership for Carbon Accounting Financials framework.',
    resolvedSchema: { general: { general: { fiscalYearDeviation: { type: 'string' } } } },
  }).as('getResolvedSchema');
  cy.intercept(
    'GET',
    `**/specifications/data-point-types/${FISCAL_YEAR_DEVIATION_TYPE_ID}`,
    mockFiscalYearDeviationType
  ).as('getDataPointType');
  cy.intercept('GET', `**/specifications/data-point-types/${FISCAL_YEAR_END_TYPE_ID}`, mockTypeWithoutRules).as(
    'getDataPointTypeWithoutRules'
  );
  cy.intercept('GET', '**/specifications/data-point-base-types/baseEnum', mockBaseType).as('getBaseType');
}
