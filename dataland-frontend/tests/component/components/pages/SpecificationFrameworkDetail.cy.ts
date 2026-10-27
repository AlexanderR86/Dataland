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
