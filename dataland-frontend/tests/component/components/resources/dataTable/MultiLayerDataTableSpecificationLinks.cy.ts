import SpecificationDataTable from '@/components/resources/specifications/SpecificationDataTable.vue';
import { type MLDTConfig } from '@/components/resources/dataTable/MultiLayerDataTableConfiguration';
import { MLDTDisplayComponentName } from '@/components/resources/dataTable/MultiLayerDataTableCellDisplayer';
import { type DataAndMetaInformation } from '@/api-models/DataAndMetaInformation';
import { DataTypeEnum } from '@clients/backend';
import { getMountingFunction } from '@ct/testUtils/Mount';
import { minimalKeycloakMock } from '@ct/testUtils/Keycloak';
import { defineComponent, h, ref, type Ref, type VNode } from 'vue';
import { createMemoryHistory, createRouter, type Router } from 'vue-router';
import {
  interceptSpecificationService,
  mockFramework,
  FISCAL_YEAR_DEVIATION_TYPE_ID,
  FISCAL_YEAR_DEVIATION_PATH,
} from '@ct/testUtils/SpecificationMocks';

const config: MLDTConfig<object> = [
  {
    type: 'section',
    label: 'General section',
    expandOnPageLoad: true,
    shouldDisplay: () => true,
    children: ['Fiscal Year Deviation', 'Undocumented field'].map((label, index) => ({
      type: 'cell',
      label,
      explanation: 'Existing explanation',
      dataPointTypeId: index === 0 ? FISCAL_YEAR_DEVIATION_TYPE_ID : 'unknownType',
      shouldDisplay: () => true,
      valueGetter: () => ({
        displayComponentName: MLDTDisplayComponentName.StringDisplayComponent,
        displayValue: 'Dataset value',
      }),
    })),
  },
];
const datasets: Array<DataAndMetaInformation<object>> = [
  {
    data: {},
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

/** Mounts the real recursive table with optional specification data. */
function mountTable(frameworkIdentifier: Ref<string> = ref('pcaf')): Router {
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
          config,
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

describe('Specification links in dataset fields', () => {
  beforeEach(() => interceptSpecificationService());

  it('Links matched fields in a new tab without navigating the dataset and preserves section controls', () => {
    const router = mountTable();
    cy.get('[data-test="specificationFieldLink"]')
      .should('have.length', 1)
      .and('have.attr', 'href', `/framework-specifications/pcaf?field=${FISCAL_YEAR_DEVIATION_PATH}`)
      .and('have.attr', 'target', '_blank')
      .and('have.attr', 'rel', 'noopener noreferrer')
      .and('have.attr', 'aria-label', 'Open specification for Fiscal Year Deviation (opens in a new tab)')
      .then(($link) => {
        $link.on('click', (event) => event.preventDefault());
      })
      .click();
    cy.wrap(router).its('currentRoute.value.fullPath').should('equal', '/');
    cy.contains('tr', 'Undocumented field').find('[data-test="specificationFieldLink"]').should('not.exist');
    cy.contains('tr', 'Fiscal Year Deviation').should('contain.text', 'Dataset value');
    cy.get('[data-section-label="General section"]').click();
    cy.get('[data-test="specificationFieldLink"]').should('not.be.visible');
    cy.get('[data-section-label="General section"]').click();
    cy.get('[data-test="specificationFieldLink"]').should('be.visible');
  });

  it('Keeps the dataset usable while the schema is loading', () => {
    let requestStarted = false;
    let releaseResponse: () => void = () => {};
    cy.intercept('GET', '**/specifications/frameworks/pcaf', (request) => {
      requestStarted = true;
      return new Promise<void>((resolve) => {
        releaseResponse = (): void => {
          request.reply(mockFramework);
          resolve();
        };
      });
    });
    mountTable();
    cy.contains('tr', 'Fiscal Year Deviation').should('contain.text', 'Dataset value');
    cy.get('[data-test="specificationFieldLink"]').should('not.exist');
    cy.wrap(null).should(() => expect(requestStarted).to.equal(true));
    cy.then(() => releaseResponse());
    cy.get('[data-test="specificationFieldLink"]').should('be.visible');
  });

  it('Does not choose an arbitrary field when a type occurs twice in the schema', () => {
    const reference = { id: FISCAL_YEAR_DEVIATION_TYPE_ID, ref: 'ref-shared' };
    cy.intercept('GET', '**/specifications/frameworks/pcaf', {
      ...mockFramework,
      schema: JSON.stringify({ general: { first: reference, second: reference } }),
    }).as('ambiguousSchema');
    mountTable();
    cy.wait('@ambiguousSchema');
    cy.get('[data-test="specificationFieldLink"]').should('not.exist');
    cy.contains('tr', 'Fiscal Year Deviation').should('contain.text', 'Dataset value');
  });

  for (const response of [
    { statusCode: 500, body: {} },
    { statusCode: 200, body: { ...mockFramework, schema: 'invalid' } },
  ]) {
    it(`Displays dataset values without links for schema ${response.statusCode === 500 ? 'failure' : 'invalid JSON'}`, () => {
      cy.intercept('GET', '**/specifications/frameworks/pcaf', response).as('schema');
      mountTable();
      cy.wait('@schema');
      cy.contains('tr', 'Fiscal Year Deviation').should('contain.text', 'Dataset value');
      cy.get('[data-test="specificationFieldLink"]').should('not.exist');
    });
  }

  it('Removes old links when the framework changes and does not request undocumented schemas', () => {
    const schemaRequest = cy.spy().as('undocumentedSchema');
    cy.intercept('GET', '**/specifications/frameworks/lksg', () => schemaRequest());
    const frameworkIdentifier = ref('pcaf');
    mountTable(frameworkIdentifier);
    cy.get('[data-test="specificationFieldLink"]').should('be.visible');
    cy.then(() => {
      frameworkIdentifier.value = 'lksg';
    });
    cy.get('[data-test="specificationFieldLink"]').should('not.exist');
    cy.contains('tr', 'Fiscal Year Deviation').should('contain.text', 'Dataset value');
    cy.get('@undocumentedSchema').should('not.have.been.called');
  });
});
