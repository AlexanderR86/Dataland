import SpecificationFrameworkTree from '@/components/resources/specifications/SpecificationFrameworkTree.vue';
import { defineComponent, h, ref, type VNode } from 'vue';
import { minimalKeycloakMock } from '@ct/testUtils/Keycloak';
import {
  FISCAL_YEAR_DEVIATION_PATH,
  FRAMEWORK_ID,
  interceptSpecificationService,
  mockFramework,
} from '@ct/testUtils/SpecificationMocks';

describe('Component tests for the specification framework tree', () => {
  /**
   * Mounts the tree for the mocked framework
   * @param onSelectPath spy that receives the emitted select-path events
   */
  function mountTree(onSelectPath = cy.spy().as('selectPathSpy')): void {
    //@ts-ignore
    cy.mountWithPlugins(SpecificationFrameworkTree, {
      keycloak: minimalKeycloakMock({}),
      props: { frameworkId: FRAMEWORK_ID, 'onSelect-path': onSelectPath },
    });
  }

  beforeEach(() => {
    interceptSpecificationService();
  });

  it('Shows readable names for categories and fields after expanding all', () => {
    mountTree();
    cy.get('[data-test="specificationTreeExpandAll"]').click();
    cy.get('[data-test="specificationTree"]').should('contain.text', 'Fiscal Year Deviation');
    cy.get('[data-test="specificationTree"]').should('contain.text', 'Main Pcaf Sector');
    cy.get('[data-test="specificationTree"]').should('not.contain.text', 'fiscalYearDeviation');
  });

  it('Emits the raw path when a field is clicked but not when a category is clicked', () => {
    mountTree();
    cy.get('[data-test="specificationTreeExpandAll"]').click();
    cy.get('[data-test="specificationTree"]').contains('Company').click();
    cy.get('@selectPathSpy').should('not.have.been.called');
    cy.get('[data-test="specificationTree"]').contains('Fiscal Year Deviation').click();
    cy.get('@selectPathSpy').should('have.been.calledWith', FISCAL_YEAR_DEVIATION_PATH);
  });

  it('Filters by name in name mode, including the raw key, and expands matching branches', () => {
    mountTree();
    cy.get('[data-test="specificationTreeSearch"]').type('fiscal year dev');
    cy.get('[data-test="specificationTree"]').should('contain.text', 'Fiscal Year Deviation');
    cy.get('[data-test="specificationTree"]').should('not.contain.text', 'Main Pcaf Sector');
    cy.get('[data-test="specificationTreeSearch"]').clear().type('mainPcafSector');
    cy.get('[data-test="specificationTree"]').should('contain.text', 'Main Pcaf Sector');
    cy.get('[data-test="specificationTree"]').should('not.contain.text', 'Fiscal Year Deviation');
  });

  it('Does not match the type id in name mode but does in id mode', () => {
    mountTree();
    cy.get('[data-test="specificationTreeSearch"]').type('extendedEnumFiscal');
    cy.get('[data-test="specificationTreeNoMatches"]').should('be.visible');

    cy.get('[data-test="specificationTreeSearchMode"]').contains('ID').click();
    cy.get('[data-test="specificationTreeSearch"]').should('have.attr', 'placeholder', 'Search by ID');
    cy.get('[data-test="specificationTree"]').should('contain.text', 'Fiscal Year Deviation');
    cy.get('[data-test="specificationTree"]').should('not.contain.text', 'Fiscal Year End');
  });

  it('Does not search the alias or the readable name in id mode', () => {
    mountTree();
    cy.get('[data-test="specificationTreeSearchMode"]').contains('ID').click();
    cy.get('[data-test="specificationTreeSearch"]').type('FISCAL_YEAR_DEVIATION');
    cy.get('[data-test="specificationTreeNoMatches"]').should('be.visible');
    cy.get('[data-test="specificationTreeSearch"]').clear().type('Fiscal Year');
    cy.get('[data-test="specificationTreeNoMatches"]').should('be.visible');
  });

  it('Shows all fields again when the search is cleared', () => {
    mountTree();
    cy.get('[data-test="specificationTreeSearch"]').type('nothing-matches-this');
    cy.get('[data-test="specificationTreeNoMatches"]').should('be.visible');
    cy.get('[data-test="specificationTreeSearch"]').clear();
    cy.get('[data-test="specificationTreeNoMatches"]').should('not.exist');
    cy.get('[data-test="specificationTree"]').should('contain.text', 'General');
  });

  it('Shows an error with retry if the framework cannot be loaded', () => {
    cy.intercept('GET', `**/specifications/frameworks/${FRAMEWORK_ID}`, { statusCode: 500, body: {} }).as('failed');
    mountTree();
    cy.get('[data-test="specificationTreeError"]').should('be.visible');
    cy.intercept('GET', `**/specifications/frameworks/${FRAMEWORK_ID}`, mockFramework);
    cy.get('[data-test="specificationTreeRetryButton"]').click();
    cy.get('[data-test="specificationTree"]').should('be.visible');
  });

  it('Resets the search and expanded branches when switching frameworks', () => {
    const frameworkId = ref(FRAMEWORK_ID);
    cy.intercept('GET', '**/specifications/frameworks/sfdr', {
      ...mockFramework,
      framework: { id: 'sfdr', ref: 'ref-sfdr' },
      schema: JSON.stringify({ environment: { emissions: { id: 'emissions', ref: 'ref-emissions' } } }),
    });
    const host = defineComponent({
      render(): VNode {
        return h(SpecificationFrameworkTree, { frameworkId: frameworkId.value });
      },
    });
    cy.mountWithPlugins(host, { keycloak: minimalKeycloakMock({}) });
    cy.get('[data-test="specificationTreeSearchMode"]').contains('ID').click();
    cy.get('[data-test="specificationTreeSearch"]').type('extendedEnumFiscal');
    cy.get('[data-test="specificationTree"]').should('contain.text', 'Fiscal Year Deviation');
    cy.then(() => {
      frameworkId.value = 'sfdr';
    });
    cy.get('[data-test="specificationTreeSearch"]')
      .should('have.value', '')
      .and('have.attr', 'placeholder', 'Search by name');
    cy.get('[data-test="specificationTree"]').should('contain.text', 'Environment');
    cy.get('[data-test="specificationTreeNoMatches"]').should('not.exist');
    cy.get('[data-test="specificationTree"]').should('not.contain.text', 'Emissions');
    cy.get('[data-test="specificationTreeSearch"]').type('emissions');
    cy.get('[data-test="specificationTree"]').should('contain.text', 'Emissions');
  });

  it('Shows a hint if the schema is not valid JSON', () => {
    cy.intercept('GET', `**/specifications/frameworks/${FRAMEWORK_ID}`, { ...mockFramework, schema: '{not json' });
    mountTree();
    cy.get('[data-test="specificationTreeSchemaError"]').should('contain.text', 'could not be read');
  });

  it('Shows a hint if the framework has no fields', () => {
    cy.intercept('GET', `**/specifications/frameworks/${FRAMEWORK_ID}`, { ...mockFramework, schema: '{}' });
    mountTree();
    cy.get('[data-test="specificationTreeEmpty"]').should('be.visible');
  });
});
