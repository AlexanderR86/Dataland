import SpecificationDataPointDetail from '@/components/resources/specifications/SpecificationDataPointDetail.vue';
import { minimalKeycloakMock } from '@ct/testUtils/Keycloak';
import {
  FISCAL_YEAR_DEVIATION_PATH,
  FISCAL_YEAR_DEVIATION_TYPE_ID,
  FISCAL_YEAR_END_PATH,
  FISCAL_YEAR_END_TYPE_ID,
  FRAMEWORK_ID,
  interceptSpecificationService,
  mockFiscalYearDeviationType,
} from '@ct/testUtils/SpecificationMocks';

describe('Component tests for the specification data point detail', () => {
  /**
   * Mounts the detail view
   * @param dataPointTypeId id of the data point type
   * @param path dot-separated path of the field in the schema
   */
  function mountDetail(dataPointTypeId: string, path: string): void {
    //@ts-ignore
    cy.mountWithPlugins(SpecificationDataPointDetail, {
      keycloak: minimalKeycloakMock({}),
      props: { dataPointTypeId, frameworkId: FRAMEWORK_ID, path },
    });
  }

  beforeEach(() => {
    interceptSpecificationService();
  });

  it('Shows the readable field name, breadcrumb, type name, definition, constraints and framework', () => {
    mountDetail(FISCAL_YEAR_DEVIATION_TYPE_ID, FISCAL_YEAR_DEVIATION_PATH);
    cy.get('[data-test="specificationDataPointName"]').should('have.text', 'Fiscal Year Deviation');
    cy.get('[data-test="specificationDataPointBreadcrumb"]').should('have.text', 'General › General');
    cy.get('[data-test="specificationDataPointTypeName"]').should('have.text', 'Fiscal Year Deviation Type Name');
    cy.get('[data-test="specificationDataPointDefinition"]').should('contain.text', 'calendar year');
    cy.get('[data-test="specificationDataPointConstraints"]').should('contain.text', 'required');
    cy.get('[data-test="specificationDataPointFrameworks"]').should('contain.text', 'PCAF');
    cy.get('[data-test="specificationDataPointCard"]').should('contain.text', FISCAL_YEAR_DEVIATION_TYPE_ID);
  });

  it('Shows the calculation rules panel inside the card with all rules', () => {
    mountDetail(FISCAL_YEAR_DEVIATION_TYPE_ID, FISCAL_YEAR_DEVIATION_PATH);
    cy.get('[data-test="specificationDataPointCard"]')
      .find('[data-test="specificationCalculationRules"]')
      .should('be.visible');
    cy.get('[data-test="specificationCalculationRule-0"]').should('contain.text', 'SUM').and('contain.text', 'inputA');
    cy.get('[data-test="specificationCalculationRule-1"]')
      .should('contain.text', 'AVERAGE')
      .and('contain.text', 'inputC');
    cy.get('[data-test="specificationCalculationRules"]').should('contain.text', 'Rule 1');
    cy.get('[data-test="specificationCalculationRules"]').should('contain.text', 'Rule 2');
  });

  it('Shows None for constraints and calculation rules if there are none', () => {
    mountDetail(FISCAL_YEAR_END_TYPE_ID, FISCAL_YEAR_END_PATH);
    cy.get('[data-test="specificationDataPointName"]').should('have.text', 'Fiscal Year End');
    cy.get('[data-test="specificationNoCalculationRules"]').should('have.text', 'None');
    cy.get('[data-test="specificationCalculationRules"]').should('not.exist');
    cy.get('[data-test="specificationDataPointConstraints"]').should('not.exist');
  });

  it('Loads the base type only after the data point type and shows base type, schema and example', () => {
    mountDetail(FISCAL_YEAR_DEVIATION_TYPE_ID, FISCAL_YEAR_DEVIATION_PATH);
    cy.wait('@getDataPointType');
    cy.wait('@getBaseType');
    cy.get('[data-test="specificationBaseTypeName"]').should('have.text', 'Base Enum Name');
    cy.get('[data-test="specificationBaseTypeValidatedBy"]').should('contain.text', 'SomeValidator');
    cy.get('[data-test="specificationSchemaPanel"] button').click();
    cy.get('[data-test="specificationSchema"]').should('contain.text', 'string');
    cy.get('[data-test="specificationExamplePanel"] button').click();
    cy.get('[data-test="specificationExample"]').should('contain.text', 'Yes');
  });

  it('Does not request the base type if the data point type cannot be loaded', () => {
    cy.intercept('GET', `**/specifications/data-point-types/${FISCAL_YEAR_DEVIATION_TYPE_ID}`, {
      statusCode: 500,
      body: {},
    }).as('failedType');
    cy.intercept('GET', '**/specifications/data-point-base-types/*', cy.spy().as('baseTypeSpy'));
    mountDetail(FISCAL_YEAR_DEVIATION_TYPE_ID, FISCAL_YEAR_DEVIATION_PATH);
    cy.get('[data-test="specificationDataPointError"]').should('be.visible');
    cy.get('@baseTypeSpy').should('not.have.been.called');
  });

  it('Reloads the data point type after clicking retry', () => {
    cy.intercept('GET', `**/specifications/data-point-types/${FISCAL_YEAR_DEVIATION_TYPE_ID}`, {
      statusCode: 500,
      body: {},
    });
    mountDetail(FISCAL_YEAR_DEVIATION_TYPE_ID, FISCAL_YEAR_DEVIATION_PATH);
    cy.get('[data-test="specificationDataPointError"]').should('be.visible');
    cy.intercept(
      'GET',
      `**/specifications/data-point-types/${FISCAL_YEAR_DEVIATION_TYPE_ID}`,
      mockFiscalYearDeviationType
    );
    cy.get('[data-test="specificationDataPointRetryButton"]').click();
    cy.get('[data-test="specificationDataPointName"]').should('have.text', 'Fiscal Year Deviation');
  });

  it('Shows an error with retry if the base type cannot be loaded', () => {
    cy.intercept('GET', '**/specifications/data-point-base-types/baseEnum', { statusCode: 500, body: {} });
    mountDetail(FISCAL_YEAR_DEVIATION_TYPE_ID, FISCAL_YEAR_DEVIATION_PATH);
    cy.get('[data-test="specificationBaseTypeError"]').should('be.visible');
    cy.get('[data-test="specificationDataPointName"]').should('be.visible');
  });
});
