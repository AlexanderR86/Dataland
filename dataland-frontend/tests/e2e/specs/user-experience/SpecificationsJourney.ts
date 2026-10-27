import { describeIf } from '@e2e/support/TestUtility';

describeIf(
  'As a user, I want to browse the framework specifications from the header tab down to a data point',
  {
    executionEnvironments: ['developmentLocal', 'ci', 'developmentCd'],
  },
  () => {
    it('opens the specifications tab, selects a framework, searches a field and shows its documentation', () => {
      cy.ensureLoggedInAsReader();
      cy.visitAndCheckAppMount('/datasets');

      cy.get('[data-pc-name="tablist"]').contains('SPECIFICATIONS').click();
      cy.url().should('include', '/framework-specifications');
      cy.get('[data-pc-name="tab"][data-p-active="true"]').contains('SPECIFICATIONS').should('exist');

      cy.get('[data-test="specificationsFrameworkTable"]').contains('PCAF').click();
      cy.url().should('match', /\/framework-specifications\/pcaf$/);
      cy.get('[data-test="specificationFrameworkName"]').should('contain.text', 'PCAF');

      cy.get('[data-test="specificationTreeSearch"]').type('fiscal year deviation');
      cy.get('[data-test="specificationTree"]').contains('Fiscal Year Deviation').click();

      cy.url().should('include', 'field=general.general.fiscalYearDeviation');
      cy.get('[data-test="specificationDataPointName"]').should('have.text', 'Fiscal Year Deviation');
      cy.get('[data-test="specificationDataPointCard"]').should('contain.text', 'extendedEnumFiscalYearDeviation');
      cy.get('[data-test="specificationDataPointFrameworks"]').should('contain.text', 'PCAF');
      cy.get('[data-test="specificationBaseTypeDetail"]').should('be.visible');
    });

    it('finds a field by its data point type id and keeps the selection when the page is reloaded', () => {
      cy.ensureLoggedInAsReader();
      cy.visitAndCheckAppMount('/framework-specifications/pcaf');

      cy.get('[data-test="specificationTreeSearchMode"]').contains('ID').click();
      cy.get('[data-test="specificationTreeSearch"]').type('extendedEnumFiscalYearDeviation');
      cy.get('[data-test="specificationTree"]').contains('Fiscal Year Deviation').click();
      cy.get('[data-test="specificationDataPointName"]').should('have.text', 'Fiscal Year Deviation');

      cy.reload();
      cy.get('[data-test="specificationDataPointName"]').should('have.text', 'Fiscal Year Deviation');
    });
  }
);
