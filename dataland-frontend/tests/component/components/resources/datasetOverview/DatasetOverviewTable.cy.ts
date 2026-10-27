import DatasetOverviewTable from '@/components/resources/datasetOverview/DatasetOverviewTable.vue';
import { type DatasetTableInfo, ExtendedQaStatus } from '@/components/resources/datasetOverview/DatasetTableInfo';
import { KEYCLOAK_ROLE_UPLOADER, KEYCLOAK_ROLE_USER } from '@/utils/KeycloakRoles';
import { humanizeStringOrNumber } from '@/utils/StringFormatter';
import { DataTypeEnum } from '@clients/backend';
import { minimalKeycloakMock } from '@ct/testUtils/Keycloak';
import router from '@/router';
import { createMemoryHistory, createRouter, type Router } from 'vue-router';
import { getMountingFunction } from '@ct/testUtils/Mount';
import { mockDatasetFrameworkList } from '@ct/testUtils/SpecificationMocks';
import { defineComponent } from 'vue';

/**
 * Mounts the DatasetOverviewTable with all dataset table entries passed to it
 * @param mockDatasetTableInfos The DatasetTableInfo-objects that shall be used to write some entries into the table
 * @param testRouter optional isolated router for testing specification navigation
 */
function prepareSimpleDatasetOverviewTable(mockDatasetTableInfos: DatasetTableInfo[], testRouter?: Router): void {
  const keycloakMock = minimalKeycloakMock({
    userId: 'Mock-User-Id',
    roles: [KEYCLOAK_ROLE_USER, KEYCLOAK_ROLE_UPLOADER],
  });
  getMountingFunction({ keycloak: keycloakMock, router: testRouter })(DatasetOverviewTable, {
    props: { datasetTableInfos: mockDatasetTableInfos },
  });
}

describe('Component test for DatasetOverviewTable', () => {
  beforeEach(() => {
    cy.intercept('GET', '**/specifications/frameworks', mockDatasetFrameworkList).as('getFrameworks');
  });

  const nameOfCompanyAlpha = 'Imaginary-Corporate';
  const dataTypeOfDatasetForAlpha = DataTypeEnum.Lksg;
  const datasetTableInfoMockForAlpha = createDatasetTableInfoMock(nameOfCompanyAlpha, dataTypeOfDatasetForAlpha);

  const nameOfCompanyBeta = 'Dream-Insurance';
  const dataTypeOfDatasetForBeta = DataTypeEnum.EutaxonomyFinancials;
  const datasetTableInfoMockForBeta = createDatasetTableInfoMock(nameOfCompanyBeta, dataTypeOfDatasetForBeta);

  it('Links each taxonomy version to its own specification and leaves undocumented frameworks as text', () => {
    const updatedTaxonomy = createDatasetTableInfoMock('Updated-Taxonomy', DataTypeEnum.EutaxonomyFinancials202673);
    prepareSimpleDatasetOverviewTable([datasetTableInfoMockForAlpha, datasetTableInfoMockForBeta, updatedTaxonomy]);
    cy.wait('@getFrameworks');
    cy.contains('tbody tr', nameOfCompanyBeta)
      .find('[data-test="datasetSpecificationLink"]')
      .should('have.attr', 'href', '/framework-specifications/eutaxonomy-financials')
      .and('have.text', humanizeStringOrNumber(dataTypeOfDatasetForBeta));
    cy.contains('tbody tr', 'Updated-Taxonomy')
      .find('[data-test="datasetSpecificationLink"]')
      .should('have.attr', 'href', '/framework-specifications/eutaxonomy-financials-2026-73');
    cy.contains('tbody tr', nameOfCompanyAlpha).find('[data-test="datasetSpecificationLink"]').should('not.exist');
    cy.contains('tbody tr', nameOfCompanyAlpha)
      .find('[data-test="datasetFrameworkName"]')
      .should('have.text', humanizeStringOrNumber(dataTypeOfDatasetForAlpha));
  });

  it('Opens only the specification when its link is clicked and preserves dataset row and VIEW navigation', () => {
    const testRouter = createRouter({
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
    const datasetNavigation = cy.stub(router, 'push').as('datasetNavigation').resolves();
    prepareSimpleDatasetOverviewTable([datasetTableInfoMockForBeta], testRouter);
    cy.get('[data-test="datasetSpecificationLink"]').click();
    cy.wrap(testRouter)
      .its('currentRoute.value.fullPath')
      .should('equal', '/framework-specifications/eutaxonomy-financials');
    cy.get('@datasetNavigation').should('not.have.been.called');

    const datasetPath = `/companies/${datasetTableInfoMockForBeta.companyId}/frameworks/${dataTypeOfDatasetForBeta}/${datasetTableInfoMockForBeta.dataId}`;
    cy.contains('tbody td', nameOfCompanyBeta).click();
    cy.get('@datasetNavigation').should('have.been.calledOnceWith', datasetPath);
    cy.then(() => datasetNavigation.resetHistory());
    cy.get('[data-test="view-dataset-button"]').click();
    cy.get('@datasetNavigation').should('have.been.calledWith', datasetPath);
  });

  it('Adds the link after loading specifications while keeping the dataset accessible during loading', () => {
    let releaseResponse: () => void = () => {};
    cy.intercept('GET', '**/specifications/frameworks', (request) => {
      return new Promise<void>((resolve) => {
        releaseResponse = (): void => {
          request.reply(mockDatasetFrameworkList);
          resolve();
        };
      });
    }).as('delayedFrameworks');
    cy.stub(router, 'push').as('datasetNavigation').resolves();
    prepareSimpleDatasetOverviewTable([datasetTableInfoMockForBeta]);
    cy.get('[data-test="datasetFrameworkName"]').should('have.text', humanizeStringOrNumber(dataTypeOfDatasetForBeta));
    cy.get('[data-test="datasetSpecificationLink"]').should('not.exist');
    cy.get('[data-test="view-dataset-button"]').click();
    cy.get('@datasetNavigation').should('have.been.called');
    cy.then(() => releaseResponse());
    cy.wait('@delayedFrameworks');
    cy.get('[data-test="datasetSpecificationLink"]').should('be.visible');
  });

  for (const response of [
    { statusCode: 200, body: [] },
    { statusCode: 500, body: {} },
  ]) {
    it(`Keeps dataset navigation available without links for specification response ${response.statusCode}`, () => {
      cy.intercept('GET', '**/specifications/frameworks', response).as('unavailableFrameworks');
      cy.stub(router, 'push').as('datasetNavigation').resolves();
      prepareSimpleDatasetOverviewTable([datasetTableInfoMockForBeta]);
      cy.wait('@unavailableFrameworks');
      cy.get('[data-test="datasetFrameworkName"]').should(
        'have.text',
        humanizeStringOrNumber(dataTypeOfDatasetForBeta)
      );
      cy.get('[data-test="datasetSpecificationLink"]').should('not.exist');
      cy.contains('tbody td', nameOfCompanyBeta).click();
      cy.get('@datasetNavigation').should('have.been.called');
    });
  }

  it('Does not substitute another taxonomy version when the exact specification is missing', () => {
    cy.intercept(
      'GET',
      '**/specifications/frameworks',
      mockDatasetFrameworkList.filter((framework) => framework.framework.id !== dataTypeOfDatasetForBeta)
    ).as('getAvailableFrameworks');
    prepareSimpleDatasetOverviewTable([datasetTableInfoMockForBeta]);
    cy.wait('@getAvailableFrameworks');
    cy.get('[data-test="datasetSpecificationLink"]').should('not.exist');
    cy.get('[data-test="datasetFrameworkName"]').should('have.text', humanizeStringOrNumber(dataTypeOfDatasetForBeta));
  });

  /**
   * Creates a DatasetTableInfo-object based on the inputs
   * @param companyName The company name that the DatasetTableInfo-object shall have
   * @param dataType The datatype that the DatasetTableInfo-object shall have
   * @returns the created DatasetTableInfo-object
   */
  function createDatasetTableInfoMock(companyName: string, dataType: DataTypeEnum): DatasetTableInfo {
    return {
      dataId: companyName + '-Mock-Data-Id',
      companyId: companyName + '-Mock-Company-Id',
      dataType: dataType,
      companyName: companyName,
      dataReportingPeriod: '2023',
      status: ExtendedQaStatus.Accepted,
      uploadTimeInMs: 1672527600000, // 1.1.2023 00:00:00:0000
    };
  }

  it('Check if the table rows look as expected', () => {
    prepareSimpleDatasetOverviewTable([datasetTableInfoMockForAlpha]);
    const expectedRowContents = [
      nameOfCompanyAlpha,
      humanizeStringOrNumber(dataTypeOfDatasetForAlpha),
      '2023',
      'Accepted',
    ];
    const routerPushMock = cy.stub();
    cy.stub(router, 'push').callsFake(routerPushMock);
    cy.get('tbody td').should((elements) => {
      expect(elements).to.have.lengthOf(6);
    });
    cy.get('tbody td').each((element, index) => {
      if (index < expectedRowContents.length) {
        expect(element.text()).to.equal(expectedRowContents[index]);
      } else if (index == 4) {
        expect(Date.parse(element.text()).toString()).not.to.equal(Number.NaN.toString());
      } else if (index == 5) {
        expect(element.text()).to.contain('VIEW');
      }
    });
    cy.get('[data-test="view-dataset-button"]').contains('VIEW').click();

    cy.then(() => {
      expect(routerPushMock).to.have.been.calledWith(
        `/companies/${nameOfCompanyAlpha}-Mock-Company-Id/frameworks/${dataTypeOfDatasetForAlpha}/${nameOfCompanyAlpha}-Mock-Data-Id`
      );
    });
  });

  it('Validates the layout of the table header', () => {
    prepareSimpleDatasetOverviewTable([]);
    const expectedHeaders = ['COMPANY', 'DATA FRAMEWORK', 'SUBMISSION DATE', 'REPORTING PERIOD', 'STATUS'];
    for (const value of expectedHeaders) {
      cy.get(`table th:contains(${value})`).should('exist');
    }
    cy.get('th').each((element) => {
      if (!expectedHeaders.includes(element.text())) {
        expect(element.html()).to.contain('<input');
      }
    });
  });

  it('Check if search filter works as expected', () => {
    const someSearchStringThatMatchesNoCompany = 'XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX123123123';
    prepareSimpleDatasetOverviewTable([datasetTableInfoMockForAlpha, datasetTableInfoMockForBeta]);
    cy.get('td').contains(nameOfCompanyAlpha).should('exist');
    cy.get('td').contains(nameOfCompanyBeta).should('exist');
    cy.get('input').type(nameOfCompanyAlpha.substring(3, 9));
    cy.get('td').contains(nameOfCompanyAlpha).should('exist');
    cy.get('td').contains(nameOfCompanyBeta).should('not.exist');
    cy.get('input').clear(); // empty input field
    cy.get('td').contains(nameOfCompanyAlpha).should('exist');
    cy.get('td').contains(nameOfCompanyBeta).should('exist');
    cy.get('input').type(nameOfCompanyBeta.substring(2, 9));
    cy.get('td').contains(nameOfCompanyAlpha).should('not.exist');
    cy.get('td').contains(nameOfCompanyBeta).should('exist');
    cy.get('input').type(someSearchStringThatMatchesNoCompany);
    cy.get('td').contains(nameOfCompanyAlpha).should('not.exist');
    cy.get('td').contains(nameOfCompanyBeta).should('not.exist');
    cy.get('input').clear();
    cy.get('input').type(nameOfCompanyAlpha.toLowerCase());
    cy.get('td').contains(nameOfCompanyAlpha).should('exist');
    cy.get('td').contains(nameOfCompanyBeta).should('not.exist');
    cy.get('input').clear();
    cy.get('input').type(nameOfCompanyBeta.toUpperCase());
    cy.get('td').contains(nameOfCompanyAlpha).should('not.exist');
    cy.get('td').contains(nameOfCompanyBeta).should('exist');
  });
});
