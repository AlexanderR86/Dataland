import SpecificationFrameworkDetail from '@/components/pages/SpecificationFrameworkDetail.vue';
import { getMountingFunction } from '@ct/testUtils/Mount';
import { minimalKeycloakMock } from '@ct/testUtils/Keycloak';
import { createMemoryHistory, createRouter } from 'vue-router';
import {
  FISCAL_YEAR_DEVIATION_PATH,
  FRAMEWORK_ID,
  interceptSpecificationService,
} from '@ct/testUtils/SpecificationMocks';

describe('Component tests for the specification framework detail page', () => {
  for (const invalidPath of ['general.general.unknownField', 'general.general']) {
    it(`Shows a not-found hint for ${invalidPath} and allows selecting a valid field`, () => {
      interceptSpecificationService();
      const dataPointRequest = cy.spy().as('dataPointRequest');
      const baseTypeRequest = cy.spy().as('baseTypeRequest');
      cy.intercept({ method: 'GET', url: '**/specifications/data-point-types/*', middleware: true }, (request) => {
        dataPointRequest(request.url);
      });
      cy.intercept({ method: 'GET', url: '**/specifications/data-point-base-types/*', middleware: true }, (request) => {
        baseTypeRequest(request.url);
      });
      const router = createRouter({
        history: createMemoryHistory(),
        routes: [
          {
            path: '/framework-specifications/:frameworkId',
            name: 'Specifications Framework Detail',
            component: SpecificationFrameworkDetail,
          },
        ],
      });
      cy.then(() =>
        router.push({
          name: 'Specifications Framework Detail',
          params: { frameworkId: FRAMEWORK_ID },
          query: { field: invalidPath },
        })
      );
      cy.then(() => {
        getMountingFunction({ router, keycloak: minimalKeycloakMock({}) })(SpecificationFrameworkDetail, {});
      });

      cy.get('[data-test="specificationFieldNotFound"]')
        .should('be.visible')
        .and('contain.text', 'The selected field was not found in this framework.');
      cy.get('[data-test="specificationDataPointDetail"]').should('not.exist');
      cy.get('[data-test="specificationSelectHint"]').should('not.exist');
      cy.get('@dataPointRequest').should('not.have.been.called');
      cy.get('@baseTypeRequest').should('not.have.been.called');

      cy.get('[data-test="specificationTreeSearch"]').type('fiscal year deviation');
      cy.get('[data-test="specificationTree"]').contains('Fiscal Year Deviation').click();
      cy.wrap(router).its('currentRoute.value.query.field').should('equal', FISCAL_YEAR_DEVIATION_PATH);
      cy.get('[data-test="specificationFieldNotFound"]').should('not.exist');
      cy.get('[data-test="specificationDataPointName"]').should('have.text', 'Fiscal Year Deviation');
      cy.wait('@getBaseType');
      cy.get('[data-test="specificationBaseTypeName"]').should('have.text', 'Base Enum Name');
    });
  }

  it('Waits for navigation and the updated detail DOM before scrolling on narrow screens', () => {
    cy.viewport(600, 800);
    interceptSpecificationService();
    const router = createRouter({
      history: createMemoryHistory(),
      routes: [
        {
          path: '/framework-specifications/:frameworkId',
          name: 'Specifications Framework Detail',
          component: SpecificationFrameworkDetail,
        },
      ],
    });
    let finishNavigation: () => void = () => {};
    cy.then(() => router.push(`/framework-specifications/${FRAMEWORK_ID}`));
    cy.then(() => {
      router.beforeEach((to) => {
        if (to.query.field) {
          return new Promise<void>((resolve) => {
            finishNavigation = resolve;
          });
        }
      });
      getMountingFunction({ router, keycloak: minimalKeycloakMock({}) })(SpecificationFrameworkDetail, {});
    });
    cy.get('[data-test="specificationSelectHint"]').should('be.visible');
    cy.get('[data-test="specificationDetailColumn"]').then(($column) => {
      cy.stub($column[0], 'scrollIntoView')
        .callsFake(() => {
          expect(router.currentRoute.value.query.field).to.equal(FISCAL_YEAR_DEVIATION_PATH);
          expect($column.find('[data-test="specificationSelectHint"]')).to.have.length(0);
          expect($column.find('[data-test="specificationDataPointDetail"]')).to.have.length(1);
        })
        .as('scrollDetail');
    });
    cy.get('[data-test="specificationTreeSearch"]').type('fiscal year deviation');
    cy.get('[data-test="specificationTree"]').contains('Fiscal Year Deviation').click();
    cy.get('@scrollDetail').should('not.have.been.called');
    cy.then(() => finishNavigation());
    cy.get('@scrollDetail').should('have.been.calledOnceWith', { behavior: 'smooth', block: 'start' });
    cy.get('[data-test="specificationDataPointName"]').should('have.text', 'Fiscal Year Deviation');
  });
});
