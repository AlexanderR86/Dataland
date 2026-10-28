import { describeIf } from '@e2e/support/TestUtility';
import { type FixtureData } from '@sharedUtils/Fixtures';
import { type PcafData } from '@clients/backend';
import { getAdminToken } from '@e2e/utils/Auth';
import { uploadCompanyAndFrameworkDataForPublicToolboxFramework } from '@e2e/utils/FrameworkUpload';
import { generateCompanyInformation } from '@e2e/fixtures/CompanyFixtures';
import PcafBaseFrameworkDefinition from '@/frameworks/pcaf/BaseFrameworkDefinition';

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

    describe('starting from an own dataset', () => {
      let pcafFixture: FixtureData<PcafData>;
      let companyName: string;
      let companyId: string;
      let dataId: string;

      before(() => {
        cy.fixture('CompanyInformationWithPcafData').then((jsonContent: Array<FixtureData<PcafData>>) => {
          pcafFixture = jsonContent[0]!;
        });
        cy.then(() => {
          const companyInformation = generateCompanyInformation();
          companyName = companyInformation.companyName;
          return getAdminToken().then((token: string) =>
            uploadCompanyAndFrameworkDataForPublicToolboxFramework(
              PcafBaseFrameworkDefinition,
              token,
              companyInformation,
              pcafFixture.t,
              pcafFixture.reportingPeriod
            ).then((uploadIds) => {
              companyId = uploadIds.companyId;
              dataId = uploadIds.dataId;
            })
          );
        });
      });

      beforeEach(() => {
        cy.ensureLoggedInAsAdmin();
      });

      it('opens the framework documentation from the data framework link without opening the dataset', () => {
        cy.visitAndCheckAppMount('/datasets');
        cy.contains('tr', companyName).find('[data-test="datasetSpecificationLink"]').click();
        cy.url().should('match', /\/framework-specifications\/pcaf$/);
        cy.get('[data-test="specificationFrameworkName"]').should('contain.text', 'PCAF');
        cy.url().should('not.include', '/companies/');
      });

      it('still opens the dataset from the row and links a field to its documentation', () => {
        cy.visitAndCheckAppMount('/datasets');
        cy.contains('tr', companyName).find('[data-test="view-dataset-button"]').click();
        cy.url().should('include', `/companies/${companyId}/frameworks/pcaf/${dataId}`);

        cy.contains('tr', 'Fiscal Year Deviation')
          .find('[data-test="specificationFieldLink"]')
          .should('have.attr', 'target', '_blank')
          .and('have.attr', 'rel', 'noopener noreferrer')
          .invoke('attr', 'href')
          .should('include', 'field=general.general.fiscalYearDeviation')
          .then((href) => {
            // Cypress cannot follow a new tab, so the link target is opened in the current tab.
            cy.visitAndCheckAppMount(href as string);
          });

        cy.url().should('match', /\/framework-specifications\/pcaf\?field=general\.general\.fiscalYearDeviation$/);
        cy.get('[data-test="specificationDataPointName"]').should('have.text', 'Fiscal Year Deviation');
        cy.get('[data-test="specificationDataPointCard"]').should('contain.text', 'extendedEnumFiscalYearDeviation');
      });
    });
  }
);
