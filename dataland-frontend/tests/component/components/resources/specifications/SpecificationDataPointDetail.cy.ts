import SpecificationDataPointDetail from '@/components/resources/specifications/SpecificationDataPointDetail.vue';
import { minimalKeycloakMock } from '@ct/testUtils/Keycloak';
import {
  FISCAL_YEAR_DEVIATION_PATH,
  FISCAL_YEAR_DEVIATION_TYPE_ID,
  FISCAL_YEAR_END_PATH,
  FISCAL_YEAR_END_TYPE_ID,
  FRAMEWORK_ID,
  interceptSpecificationService,
  mockBaseType,
  mockFiscalYearDeviationType,
  mockFramework,
  MAIN_PCAF_SECTOR_TYPE_ID,
  mockSecondFrameworkOnlyType,
  SECOND_FRAMEWORK_ID,
  SECOND_FRAMEWORK_ONLY_TYPE_ID,
  UNKNOWN_RULE_INPUT_ID,
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
    cy.get('[data-test="specificationCalculationRule-0"]').should('contain.text', 'SUM');
    cy.get('[data-test="specificationCalculationRule-1"]')
      .should('contain.text', 'AVERAGE')
      .and('contain.text', 'Main Pcaf Sector');
    cy.get('[data-test="specificationCalculationRules"]').should('contain.text', 'Rule 1');
    cy.get('[data-test="specificationCalculationRules"]').should('contain.text', 'Rule 2');
  });

  it('Links rule inputs to their fields in the framework and marks unused inputs', () => {
    mountDetail(FISCAL_YEAR_DEVIATION_TYPE_ID, FISCAL_YEAR_DEVIATION_PATH);
    cy.get(`[data-test="specificationRuleInputLink-${FISCAL_YEAR_END_TYPE_ID}"]`)
      .should('have.text', 'Fiscal Year End')
      .and('have.attr', 'title', FISCAL_YEAR_END_TYPE_ID)
      .and('have.attr', 'target', '_blank')
      .and('have.attr', 'href')
      .and('include', `/framework-specifications/${FRAMEWORK_ID}`)
      .and('include', `field=${FISCAL_YEAR_END_PATH}`);
    cy.get(`[data-test="specificationRuleInputLink-${MAIN_PCAF_SECTOR_TYPE_ID}"]`).should(
      'have.text',
      'Main Pcaf Sector'
    );
    cy.get(`[data-test="specificationRuleInputLink-${UNKNOWN_RULE_INPUT_ID}"]`).should('not.exist');
    cy.get(`[data-test="specificationRuleInputUnknown-${UNKNOWN_RULE_INPUT_ID}"]`).should(
      'contain.text',
      'not used in any framework'
    );
  });

  it('Links rule inputs that only exist in another framework to that framework in a new tab', () => {
    mountDetail(FISCAL_YEAR_DEVIATION_TYPE_ID, FISCAL_YEAR_DEVIATION_PATH);
    cy.get(`[data-test="specificationRuleInputFrameworkLink-${SECOND_FRAMEWORK_ONLY_TYPE_ID}-${SECOND_FRAMEWORK_ID}"]`)
      .should('contain.text', 'Main Pcaf Sector')
      .and('contain.text', 'SFDR')
      .and('have.attr', 'target', '_blank')
      .and('have.attr', 'href')
      .and('include', `/framework-specifications/${SECOND_FRAMEWORK_ID}`)
      .and('include', 'field=general.company.mainPcafSector');
    cy.get(`[data-test="specificationRuleInputLink-${SECOND_FRAMEWORK_ONLY_TYPE_ID}"]`).should('not.exist');
  });

  it('Shows one link per framework if an input is used by several other frameworks', () => {
    cy.intercept('GET', `**/specifications/data-point-types/${SECOND_FRAMEWORK_ONLY_TYPE_ID}`, {
      ...mockSecondFrameworkOnlyType,
      usedBy: [
        { id: SECOND_FRAMEWORK_ID, ref: 'ref-sfdr' },
        { id: 'otherFramework', ref: 'ref-other' },
      ],
    });
    cy.intercept('GET', '**/specifications/frameworks/otherFramework', { statusCode: 500, body: {} });
    mountDetail(FISCAL_YEAR_DEVIATION_TYPE_ID, FISCAL_YEAR_DEVIATION_PATH);
    cy.get(`[data-test="specificationRuleInputOtherFrameworks-${SECOND_FRAMEWORK_ONLY_TYPE_ID}"] a`).should(
      'have.length',
      2
    );
  });

  it('Keeps the input as plain text if the data point type of an input cannot be loaded', () => {
    cy.intercept('GET', `**/specifications/data-point-types/${SECOND_FRAMEWORK_ONLY_TYPE_ID}`, {
      statusCode: 500,
      body: {},
    });
    mountDetail(FISCAL_YEAR_DEVIATION_TYPE_ID, FISCAL_YEAR_DEVIATION_PATH);
    cy.get('[data-test="specificationCalculationRule-1"]').should('contain.text', SECOND_FRAMEWORK_ONLY_TYPE_ID);
    cy.get(`[data-test="specificationRuleInputOtherFrameworks-${SECOND_FRAMEWORK_ONLY_TYPE_ID}"]`).should('not.exist');
  });

  it('Shows rule inputs as plain text if the framework cannot be loaded', () => {
    cy.intercept('GET', `**/specifications/frameworks/${FRAMEWORK_ID}`, { statusCode: 500, body: {} });
    mountDetail(FISCAL_YEAR_DEVIATION_TYPE_ID, FISCAL_YEAR_DEVIATION_PATH);
    cy.get('[data-test="specificationCalculationRule-0"]').should('contain.text', FISCAL_YEAR_END_TYPE_ID);
    cy.get(`[data-test="specificationRuleInputLink-${FISCAL_YEAR_END_TYPE_ID}"]`).should('not.exist');
    cy.get(`[data-test="specificationRuleInputUnknown-${UNKNOWN_RULE_INPUT_ID}"]`).should('not.exist');
  });

  it('Shows no not-in-framework hint while the framework is still loading', () => {
    let releaseFramework: () => void = () => {};
    cy.intercept('GET', `**/specifications/frameworks/${FRAMEWORK_ID}`, (request) => {
      return new Promise<void>((resolve) => {
        releaseFramework = (): void => {
          request.reply(mockFramework);
          resolve();
        };
      });
    }).as('heldFramework');
    mountDetail(FISCAL_YEAR_DEVIATION_TYPE_ID, FISCAL_YEAR_DEVIATION_PATH);
    cy.get('[data-test="specificationCalculationRule-0"]').should('contain.text', UNKNOWN_RULE_INPUT_ID);
    cy.get(`[data-test="specificationRuleInputUnknown-${UNKNOWN_RULE_INPUT_ID}"]`).should('not.exist');
    cy.then(() => releaseFramework());
    cy.get(`[data-test="specificationRuleInputUnknown-${UNKNOWN_RULE_INPUT_ID}"]`).should('be.visible');
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

  it('Keeps the data point documentation visible while the resolved schema fails and recovers on retry', () => {
    let allowSchemaResponse = false;
    let schemaRequestCount = 0;
    let failedSchemaRequestCount = 0;
    cy.intercept('GET', `**/specifications/frameworks/${FRAMEWORK_ID}/resolved-schema`, (request) => {
      schemaRequestCount += 1;
      if (!allowSchemaResponse) {
        request.reply({ statusCode: 500, body: {} });
        return;
      }

      request.reply({
        framework: { id: FRAMEWORK_ID, ref: 'ref-pcaf' },
        name: 'PCAF',
        businessDefinition: 'The Partnership for Carbon Accounting Financials framework.',
        resolvedSchema: { general: { general: { fiscalYearDeviation: { type: 'string' } } } },
      });
    }).as('resolvedSchemaRetry');

    mountDetail(FISCAL_YEAR_DEVIATION_TYPE_ID, FISCAL_YEAR_DEVIATION_PATH);
    cy.get('[data-test="specificationDataPointName"]').should('have.text', 'Fiscal Year Deviation');
    cy.get('[data-test="specificationBaseTypeName"]').should('be.visible');
    cy.get('[data-test="specificationSchemaPanel"] button').click();
    cy.get('[data-test="specificationSchemaError"]')
      .should('be.visible')
      .and('contain.text', 'The schema could not be loaded.');
    cy.get('[data-test="specificationSchemaRetryButton"]').should('be.visible');
    cy.get('[data-test="specificationDataPointName"]').should('be.visible');
    cy.then(() => {
      failedSchemaRequestCount = schemaRequestCount;
    });

    cy.then(() => {
      allowSchemaResponse = true;
    });
    cy.get('[data-test="specificationSchemaRetryButton"]').click();
    cy.get('[data-test="specificationSchema"]').should('contain.text', 'string');
    cy.wrap(null).should(() => {
      expect(schemaRequestCount).to.be.greaterThan(failedSchemaRequestCount);
    });
    cy.get('[data-test="specificationDataPointName"]').should('have.text', 'Fiscal Year Deviation');
  });

  it('Shows the missing-schema hint when the requested field path is absent', () => {
    cy.intercept('GET', `**/specifications/frameworks/${FRAMEWORK_ID}/resolved-schema`, {
      framework: { id: FRAMEWORK_ID, ref: 'ref-pcaf' },
      name: 'PCAF',
      businessDefinition: 'The Partnership for Carbon Accounting Financials framework.',
      resolvedSchema: { general: { general: {} } },
    }).as('resolvedSchemaWithoutField');

    mountDetail(FISCAL_YEAR_DEVIATION_TYPE_ID, FISCAL_YEAR_DEVIATION_PATH);
    cy.get('[data-test="specificationBaseTypeName"]').should('be.visible');
    cy.get('[data-test="specificationSchemaPanel"] button').click();
    cy.get('[data-test="specificationSchemaMissing"]')
      .should('be.visible')
      .and('have.text', 'No schema is available for this field.');
    cy.get('[data-test="specificationDataPointName"]').should('have.text', 'Fiscal Year Deviation');
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

  it('Keeps the data point documentation visible and recovers from a base type error after retry', () => {
    let allowBaseTypeResponse = false;
    let baseTypeRequestCount = 0;
    let failedBaseTypeRequestCount = 0;
    cy.intercept('GET', '**/specifications/data-point-base-types/baseEnum', (request) => {
      baseTypeRequestCount += 1;
      if (allowBaseTypeResponse) {
        request.reply(mockBaseType);
      } else {
        request.reply({ statusCode: 500, body: {} });
      }
    }).as('baseTypeRetry');

    mountDetail(FISCAL_YEAR_DEVIATION_TYPE_ID, FISCAL_YEAR_DEVIATION_PATH);
    cy.get('[data-test="specificationBaseTypeError"]').should('be.visible');
    cy.get('[data-test="specificationBaseTypeRetryButton"]').should('be.visible');
    cy.get('[data-test="specificationDataPointName"]').should('have.text', 'Fiscal Year Deviation');
    cy.then(() => {
      failedBaseTypeRequestCount = baseTypeRequestCount;
    });

    cy.then(() => {
      allowBaseTypeResponse = true;
    });
    cy.get('[data-test="specificationBaseTypeRetryButton"]').click();
    cy.get('[data-test="specificationBaseTypeName"]').should('have.text', 'Base Enum Name');
    cy.wrap(null).should(() => {
      expect(baseTypeRequestCount).to.be.greaterThan(failedBaseTypeRequestCount);
    });
    cy.get('[data-test="specificationDataPointName"]').should('have.text', 'Fiscal Year Deviation');
  });

  it('Loads the base type only after the data point type response is released', () => {
    let dataPointTypeRequestStarted = false;
    let dataPointTypeResponseReleased = false;
    let baseTypeRequestedBeforeDataPointTypeResponse = false;
    let baseTypeRequestUrl = '';
    let releaseDataPointType: () => void = () => {};
    let releaseBaseType: () => void = () => {};

    cy.intercept('GET', `**/specifications/data-point-types/${FISCAL_YEAR_DEVIATION_TYPE_ID}`, (request) => {
      dataPointTypeRequestStarted = true;
      return new Promise<void>((resolve) => {
        releaseDataPointType = (): void => {
          dataPointTypeResponseReleased = true;
          request.reply(mockFiscalYearDeviationType);
          resolve();
        };
      });
    }).as('heldDataPointType');

    cy.intercept('GET', '**/specifications/data-point-base-types/*', (request) => {
      baseTypeRequestUrl = request.url;
      baseTypeRequestedBeforeDataPointTypeResponse = !dataPointTypeResponseReleased;
      return new Promise<void>((resolve) => {
        releaseBaseType = (): void => {
          request.reply(mockBaseType);
          resolve();
        };
      });
    }).as('heldBaseType');

    mountDetail(FISCAL_YEAR_DEVIATION_TYPE_ID, FISCAL_YEAR_DEVIATION_PATH);
    cy.get('[data-test="specificationDataPointLoading"]').should('be.visible');
    cy.get('[data-test="specificationBaseTypeLoading"]').should('not.exist');
    cy.wrap(null).should(() => {
      expect(dataPointTypeRequestStarted).to.equal(true);
    });
    cy.wrap(null).should(() => {
      expect(baseTypeRequestUrl).to.equal('');
    });

    cy.then(() => releaseDataPointType());
    cy.get('[data-test="specificationDataPointName"]').should('have.text', 'Fiscal Year Deviation');
    cy.get('[data-test="specificationBaseTypeLoading"]').should('be.visible');
    cy.wrap(null).should(() => {
      expect(baseTypeRequestUrl).to.include('/specifications/data-point-base-types/baseEnum');
      expect(baseTypeRequestedBeforeDataPointTypeResponse).to.equal(false);
    });

    cy.then(() => releaseBaseType());
    cy.get('[data-test="specificationBaseTypeName"]').should('have.text', 'Base Enum Name');
    cy.get('[data-test="specificationBaseTypeValidatedBy"]').should('contain.text', 'SomeValidator');
    cy.get('[data-test="specificationSchemaPanel"] button').click();
    cy.get('[data-test="specificationSchema"]').should('contain.text', 'string');
    cy.get('[data-test="specificationExamplePanel"] button').click();
    cy.get('[data-test="specificationExample"]').should('contain.text', 'Yes');
  });
});
