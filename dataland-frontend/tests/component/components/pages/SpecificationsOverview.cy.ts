import SpecificationsOverview from '@/components/pages/SpecificationsOverview.vue';
import { getMountingFunction } from '@ct/testUtils/Mount';
import { minimalKeycloakMock } from '@ct/testUtils/Keycloak';
import { createMemoryHistory, createRouter } from 'vue-router';
import { routes } from '@/router';
import { FRAMEWORK_ID, interceptSpecificationService, mockFrameworkList } from '@ct/testUtils/SpecificationMocks';

describe('Component tests for the specifications overview page', () => {
  beforeEach(() => {
    interceptSpecificationService();
  });

  it('Lists all frameworks with name and description', () => {
    cy.mountWithPlugins(SpecificationsOverview, { keycloak: minimalKeycloakMock({}) });
    cy.get('[data-test="specificationsFrameworkTable"]').should('contain.text', 'PCAF').and('contain.text', 'SFDR');
    cy.get(`[data-test="specificationFrameworkLink-${FRAMEWORK_ID}"]`).should('contain.text', 'PCAF');
    cy.get('[data-test="specificationDescription"]').first().should('contain.text', 'Carbon Accounting');
  });

  it('Navigates to the detail route when a row is clicked', () => {
    const router = createRouter({ routes, history: createMemoryHistory() });
    getMountingFunction({ keycloak: minimalKeycloakMock({}), router })(SpecificationsOverview, {});
    cy.get('[data-test="specificationsFrameworkTable"]').contains('td', 'PCAF').click();
    cy.wrap(router)
      .its('currentRoute.value')
      .should((route) => {
        expect(route.name).to.equal('Specifications Framework Detail');
        expect(route.params.frameworkId).to.equal(FRAMEWORK_ID);
      });
  });

  it('Shows the empty state if there are no frameworks', () => {
    cy.intercept('GET', '**/specifications/frameworks', []);
    cy.mountWithPlugins(SpecificationsOverview, { keycloak: minimalKeycloakMock({}) });
    cy.get('[data-test="specificationsFrameworkTable"]').should('contain.text', 'No frameworks found.');
  });

  it('Shows an error and reloads the list after clicking retry', () => {
    cy.intercept('GET', '**/specifications/frameworks', { statusCode: 500, body: {} });
    cy.mountWithPlugins(SpecificationsOverview, { keycloak: minimalKeycloakMock({}) });
    cy.get('[data-test="specificationsError"]').should('be.visible');
    cy.intercept('GET', '**/specifications/frameworks', mockFrameworkList);
    cy.get('[data-test="specificationsRetryButton"]').click();
    cy.get('[data-test="specificationsFrameworkTable"]').should('contain.text', 'PCAF');
  });

  it('Shows a loading state while the list is requested', () => {
    cy.intercept('GET', '**/specifications/frameworks', { delay: 1000, body: mockFrameworkList });
    cy.mountWithPlugins(SpecificationsOverview, { keycloak: minimalKeycloakMock({}) });
    cy.get('[data-test="specificationsLoading"]').should('be.visible');
  });
});
