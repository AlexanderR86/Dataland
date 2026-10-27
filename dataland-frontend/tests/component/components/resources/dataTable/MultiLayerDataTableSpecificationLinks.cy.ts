import SpecificationDataTable from '@/components/resources/specifications/SpecificationDataTable.vue';
import MultiLayerDataTableFrameworkPanel from '@/components/resources/frameworkDataSearch/frameworkPanel/MultiLayerDataTableFrameworkPanel.vue';
import { type MLDTConfig } from '@/components/resources/dataTable/MultiLayerDataTableConfiguration';
import {
  MLDTDisplayComponentName,
  type AvailableMLDTDisplayObjectTypes,
} from '@/components/resources/dataTable/MultiLayerDataTableCellDisplayer';
import { type DataAndMetaInformation } from '@/api-models/DataAndMetaInformation';
import { DataTypeEnum, type PcafData } from '@clients/backend';
import { getMountingFunction } from '@ct/testUtils/Mount';
import { minimalKeycloakMock } from '@ct/testUtils/Keycloak';
import { pcafViewConfiguration } from '@/frameworks/pcaf/ViewConfig';
import { sfdrViewConfiguration } from '@/frameworks/sfdr/ViewConfig';
import { defineComponent, h, ref, type Component, type Ref, type VNode } from 'vue';
import { createMemoryHistory, createRouter, type Router } from 'vue-router';
import {
  FISCAL_YEAR_DEVIATION_PATH,
  FISCAL_YEAR_DEVIATION_TYPE_ID,
  FRAMEWORK_ID,
  SECOND_FRAMEWORK_FISCAL_YEAR_END_PATH,
  SECOND_FRAMEWORK_ID,
  interceptSpecificationService,
  mockFramework,
  mockFrameworkList,
  mockSecondFramework,
} from '@ct/testUtils/SpecificationMocks';

const datasets: Array<DataAndMetaInformation<object>> = [
  {
    data: {
      general: {
        general: {
          fiscalYearDeviation: { value: 'Deviation' },
          fiscalYearEnd: { value: '2025-12-31' },
        },
        company: { fiscalYearEnd: { value: '2025-12-31' } },
      },
    },
    metaInfo: {
      dataId: 'data-id',
      companyId: 'company-id',
      dataType: DataTypeEnum.Pcaf,
      reportingPeriod: '2025',
      uploadTime: 0,
      currentlyActive: true,
      qaStatus: 'Accepted',
      ref: 'ref-data',
    },
  },
];

const duplicateTypeConfig: MLDTConfig<object> = [
  {
    type: 'section',
    label: 'Repeated fields',
    expandOnPageLoad: true,
    shouldDisplay: () => true,
    children: [
      {
        type: 'cell',
        label: 'Chosen occurrence',
        fieldPath: 'general.general.fiscalYearDeviation',
        dataPointTypeId: FISCAL_YEAR_DEVIATION_TYPE_ID,
        shouldDisplay: (): boolean => true,
        valueGetter: () => ({
          displayComponentName: MLDTDisplayComponentName.StringDisplayComponent,
          displayValue: 'Chosen dataset value',
        }),
      },
      {
        type: 'cell',
        label: 'Incorrect explicit path',
        fieldPath: 'general.general.notFiscalYearDeviation',
        dataPointTypeId: FISCAL_YEAR_DEVIATION_TYPE_ID,
        shouldDisplay: () => true,
        valueGetter: () => ({
          displayComponentName: MLDTDisplayComponentName.StringDisplayComponent,
          displayValue: 'Other dataset value',
        }),
      },
      {
        type: 'cell',
        label: 'Second occurrence',
        dataPointTypeId: FISCAL_YEAR_DEVIATION_TYPE_ID,
        shouldDisplay: () => true,
        valueGetter: () => ({
          displayComponentName: MLDTDisplayComponentName.StringDisplayComponent,
          displayValue: 'Second dataset value',
        }),
      },
    ],
  },
];

/** Mounts the real recursive table with the supplied framework config and dataset. */
function mountTable(
  frameworkIdentifier: Ref<string> = ref(FRAMEWORK_ID),
  config: MLDTConfig<PcafData> | MLDTConfig<object> = pcafViewConfiguration
): Router {
  const router = createRouter({
    history: createMemoryHistory(),
    routes: [
      { path: '/', component: defineComponent({ template: '<div />' }) },
      {
        path: '/framework-specifications/:frameworkId',
        name: 'Specifications Framework Detail',
        component: defineComponent({ template: '<div />' }),
      },
    ],
  });
  const host = defineComponent({
    setup() {
      return (): VNode =>
        h(SpecificationDataTable<object>, {
          frameworkIdentifier: frameworkIdentifier.value,
          config:
            frameworkIdentifier.value === SECOND_FRAMEWORK_ID && config === pcafViewConfiguration
              ? (sfdrViewConfiguration as MLDTConfig<object>)
              : (config as MLDTConfig<object>),
          dataAndMetaInfo: datasets,
          ariaLabel: 'Test dataset',
          inReviewMode: false,
          hideEmptyFields: false,
        });
    },
  });
  getMountingFunction({ keycloak: minimalKeycloakMock({}), router })(host);
  return router;
}

/** Mounts the real framework panel, including its embedded specification-aware table wrapper. */
function mountFrameworkPanel(): void {
  cy.intercept('GET', '**/api/data/pcaf/companies/company-id*', datasets).as('dataset');
  const frameworkPanelHost = defineComponent({
    setup() {
      return (): VNode =>
        h(MultiLayerDataTableFrameworkPanel as Component, {
          companyId: 'company-id',
          frameworkIdentifier: DataTypeEnum.Pcaf,
          displayConfiguration: pcafViewConfiguration,
          inReviewMode: false,
        });
    },
  });
  getMountingFunction({ keycloak: minimalKeycloakMock({}) })(frameworkPanelHost);
}

describe('Specification links in dataset fields', () => {
  beforeEach(() => interceptSpecificationService());

  it('uses the real PCAF view config and shows the exact field link, icon, and dataset values in the framework panel', () => {
    mountFrameworkPanel();
    cy.wait('@dataset');
    cy.get('[data-test="specificationFieldLink"]')
      .should('have.length', 3)
      .first()
      .should('have.attr', 'href', `/framework-specifications/${FRAMEWORK_ID}?field=${FISCAL_YEAR_DEVIATION_PATH}`)
      .and('have.attr', 'target', '_blank')
      .and('have.attr', 'rel', 'noopener noreferrer')
      .find('i')
      .should('have.class', 'pi-info-circle');
    cy.get('[data-cell-label="Fiscal Year Deviation"]').should('contain.text', 'Deviation');
    cy.get('[data-cell-label="Fiscal Year End"]').should('contain.text', '2025-12-31');
    cy.contains('tr', 'Company exchange status').find('[data-test="specificationFieldLink"]').should('not.exist');
  });

  it('links matched fields in a new tab without navigating the dataset and preserves section controls', () => {
    const router = mountTable();
    cy.get('[data-test="specificationFieldLink"]')
      .should('have.length', 3)
      .first()
      .should('have.attr', 'href', `/framework-specifications/${FRAMEWORK_ID}?field=${FISCAL_YEAR_DEVIATION_PATH}`)
      .and('have.attr', 'target', '_blank')
      .and('have.attr', 'rel', 'noopener noreferrer')
      .and('have.attr', 'aria-label', 'Open specification for Fiscal Year Deviation (opens in a new tab)')
      .then(($link) => {
        $link.on('click', (event) => event.preventDefault());
      })
      .click();
    cy.wrap(router).its('currentRoute.value.fullPath').should('equal', '/');
    cy.contains('tr', 'Fiscal Year Deviation').should('contain.text', 'Deviation');
    cy.get('[data-section-label="General"]').first().click();
    cy.get('[data-test="specificationFieldLink"]').should('not.be.visible');
    cy.get('[data-section-label="General"]').first().click();
    cy.get('[data-test="specificationFieldLink"]').should('be.visible');
  });

  it('keeps the dataset usable while the schema is loading', () => {
    let requestStarted = false;
    let releaseResponse: () => void = () => {};
    cy.intercept('GET', `**/specifications/frameworks/${FRAMEWORK_ID}`, (request) => {
      requestStarted = true;
      return new Promise<void>((resolve) => {
        releaseResponse = (): void => {
          request.reply(mockFramework);
          resolve();
        };
      });
    });
    mountTable();
    cy.get('[data-cell-label="Fiscal Year Deviation"]').should('contain.text', 'Deviation');
    cy.get('[data-test="specificationFieldLink"]').should('not.exist');
    cy.wrap(null).should(() => expect(requestStarted).to.equal(true));
    cy.then(() => releaseResponse());
    cy.get('[data-test="specificationFieldLink"]').should('be.visible');
  });

  it('uses an explicit path to resolve a repeated type ID and rejects an incorrect explicit path', () => {
    cy.intercept('GET', `**/specifications/frameworks/${FRAMEWORK_ID}`, {
      ...mockFramework,
      schema: JSON.stringify({
        general: {
          general: {
            fiscalYearDeviation: { id: FISCAL_YEAR_DEVIATION_TYPE_ID, ref: 'ref-deviation' },
            notFiscalYearDeviation: { id: 'another-type', ref: 'ref-other' },
            anotherOccurrence: { id: FISCAL_YEAR_DEVIATION_TYPE_ID, ref: 'ref-deviation' },
          },
        },
      }),
    }).as('repeatedTypeSchema');
    mountTable(ref(FRAMEWORK_ID), duplicateTypeConfig);
    cy.wait('@repeatedTypeSchema');
    cy.contains('tr', 'Chosen occurrence')
      .find('[data-test="specificationFieldLink"]')
      .should(
        'have.attr',
        'href',
        `/framework-specifications/${FRAMEWORK_ID}?field=general.general.fiscalYearDeviation`
      );
    cy.contains('tr', 'Incorrect explicit path').find('[data-test="specificationFieldLink"]').should('not.exist');
    cy.contains('tr', 'Second occurrence').find('[data-test="specificationFieldLink"]').should('not.exist');
    cy.contains('tr', 'Chosen occurrence').should('contain.text', 'Chosen dataset value');
  });

  it('switches between documented frameworks without restoring a late PCAF response', () => {
    cy.intercept('GET', '**/specifications/frameworks', mockFrameworkList).as('frameworkList');
    const pcafRequest = cy.stub().as('pcafSchemaRequest');
    cy.intercept('GET', `**/specifications/frameworks/${FRAMEWORK_ID}`, (request) => {
      pcafRequest();
      request.reply({ delay: 1500, body: mockFramework });
    }).as('pcafSchema');
    cy.intercept('GET', `**/specifications/frameworks/${SECOND_FRAMEWORK_ID}`, {
      delay: 300,
      body: mockSecondFramework,
    }).as('sfdrSchema');
    const frameworkIdentifier = ref(FRAMEWORK_ID);
    mountTable(frameworkIdentifier);
    cy.wait('@frameworkList');
    cy.get('@pcafSchemaRequest').should('have.been.calledOnce');
    cy.then(() => {
      frameworkIdentifier.value = SECOND_FRAMEWORK_ID;
    });
    cy.get('[data-test="specificationFieldLink"]').should('not.exist');
    cy.get('[data-cell-label="Fiscal Year Deviation"]').should('contain.text', 'Deviation');
    cy.wait('@sfdrSchema');
    cy.contains('tr', 'Fiscal Year End')
      .find('[data-test="specificationFieldLink"]')
      .should(
        'have.attr',
        'href',
        `/framework-specifications/${SECOND_FRAMEWORK_ID}?field=${SECOND_FRAMEWORK_FISCAL_YEAR_END_PATH}`
      );
    cy.wait('@pcafSchema');
    cy.contains('tr', 'Fiscal Year End')
      .find('[data-test="specificationFieldLink"]')
      .should(
        'have.attr',
        'href',
        `/framework-specifications/${SECOND_FRAMEWORK_ID}?field=${SECOND_FRAMEWORK_FISCAL_YEAR_END_PATH}`
      );
    cy.get('[data-cell-label="Fiscal Year End"]').should('contain.text', '2025-12-31');
  });

  it('does not make a schema request for an undocumented framework or show a field icon', () => {
    const undocumentedSchemaRequest = cy.stub().as('undocumentedSchema');
    cy.intercept('GET', '**/specifications/frameworks/lksg', (request) => {
      undocumentedSchemaRequest(request);
      request.reply({ statusCode: 404, body: {} });
    });
    const frameworkIdentifier = ref(FRAMEWORK_ID);
    mountTable(frameworkIdentifier);
    cy.get('[data-test="specificationFieldLink"]').should('have.length', 3);
    cy.then(() => {
      frameworkIdentifier.value = 'lksg';
    });
    cy.get('[data-test="specificationFieldLink"]').should('not.exist');
    cy.get('[data-cell-label="Fiscal Year Deviation"]').should('contain.text', 'Deviation');
    cy.get('@undocumentedSchema').should('not.have.been.called');
  });

  for (const listResponse of [
    { title: 'empty', statusCode: 200, body: [] },
    { title: 'failed', statusCode: 500, body: {} },
  ]) {
    it(`keeps the table usable without links when the framework list is ${listResponse.title}`, () => {
      cy.intercept('GET', '**/specifications/frameworks', {
        statusCode: listResponse.statusCode,
        body: listResponse.body,
      }).as('frameworkList');
      const schemaRequest = cy.stub().as('schemaRequest');
      cy.intercept('GET', `**/specifications/frameworks/${FRAMEWORK_ID}`, (request) => {
        schemaRequest(request);
        request.reply(mockFramework);
      });
      mountTable();
      cy.wait('@frameworkList');
      cy.get('[data-cell-label="Fiscal Year Deviation"]').should('contain.text', 'Deviation');
      cy.get('[data-section-label="General"]').first().click();
      cy.get('[data-cell-label="Fiscal Year Deviation"]').should('not.be.visible');
      cy.get('[data-section-label="General"]').first().click();
      cy.get('[data-cell-label="Fiscal Year Deviation"]').should('be.visible');
      cy.get('[data-test="specificationFieldLink"]').should('not.exist');
      cy.get('@schemaRequest').should('not.have.been.called');
    });
  }

  it('loads the matching schema and link after a delayed framework list is released', () => {
    let releaseFrameworkList: () => void = () => {};
    cy.intercept('GET', '**/specifications/frameworks', (request) => {
      return new Promise<void>((resolve) => {
        releaseFrameworkList = (): void => {
          request.reply(mockFrameworkList);
          resolve();
        };
      });
    }).as('delayedFrameworkList');
    const schemaRequest = cy.stub().as('matchingSchemaRequest');
    cy.intercept('GET', `**/specifications/frameworks/${FRAMEWORK_ID}`, (request) => {
      schemaRequest(request);
      request.reply(mockFramework);
    }).as('matchingSchema');
    mountTable();
    cy.get('[data-cell-label="Fiscal Year Deviation"]').should('contain.text', 'Deviation');
    cy.get('[data-section-label="General"]').first().click();
    cy.get('[data-cell-label="Fiscal Year Deviation"]').should('not.be.visible');
    cy.get('[data-section-label="General"]').first().click();
    cy.get('[data-test="specificationFieldLink"]').should('not.exist');
    cy.get('@matchingSchemaRequest').should('not.have.been.called');
    cy.wrap(null).should(() => expect(releaseFrameworkList).to.be.a('function'));
    cy.then(() => releaseFrameworkList());
    cy.wait('@matchingSchema');
    cy.get('@matchingSchemaRequest').should('have.been.calledOnce');
    cy.get('[data-test="specificationFieldLink"]')
      .first()
      .should('have.attr', 'href', `/framework-specifications/${FRAMEWORK_ID}?field=${FISCAL_YEAR_DEVIATION_PATH}`);
  });

  it('does not select an arbitrary field when a type is repeated and has no explicit path', () => {
    const reference = { id: FISCAL_YEAR_DEVIATION_TYPE_ID, ref: 'ref-shared' };
    cy.intercept('GET', `**/specifications/frameworks/${FRAMEWORK_ID}`, {
      ...mockFramework,
      schema: JSON.stringify({ general: { first: reference, second: reference } }),
    }).as('ambiguousSchema');
    mountTable(ref(FRAMEWORK_ID), [
      {
        type: 'cell',
        label: 'Ambiguous field',
        dataPointTypeId: FISCAL_YEAR_DEVIATION_TYPE_ID,
        shouldDisplay: (): boolean => true,
        valueGetter: (): AvailableMLDTDisplayObjectTypes => ({
          displayComponentName: MLDTDisplayComponentName.StringDisplayComponent,
          displayValue: 'Dataset value',
        }),
      },
    ]);
    cy.wait('@ambiguousSchema');
    cy.get('[data-test="specificationFieldLink"]').should('not.exist');
    cy.get('[data-cell-label="Ambiguous field"]').should('contain.text', 'Dataset value');
  });

  for (const response of [
    { title: 'failure', statusCode: 500, body: {} },
    { title: 'invalid JSON', statusCode: 200, body: { ...mockFramework, schema: 'invalid' } },
  ]) {
    it(`displays dataset values without links for a schema ${response.title}`, () => {
      cy.intercept('GET', `**/specifications/frameworks/${FRAMEWORK_ID}`, response).as('schema');
      mountTable();
      cy.wait('@schema');
      cy.get('[data-cell-label="Fiscal Year Deviation"]').should('contain.text', 'Deviation');
      cy.get('[data-test="specificationFieldLink"]').should('not.exist');
    });
  }
});
