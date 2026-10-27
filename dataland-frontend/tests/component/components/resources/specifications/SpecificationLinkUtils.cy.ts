import { buildSpecificationFieldPaths, getSpecificationFieldPath } from '@/utils/specifications/SpecificationLinkUtils';

describe('Specification field path mapping', () => {
  const reference = { id: 'sharedType', ref: 'ref-shared' };

  it('Uses actual schema paths at different depths', () => {
    const paths = buildSpecificationFieldPaths(
      JSON.stringify({
        fiscalYearEnd: { id: 'topLevelType', ref: 'ref-top-level' },
        general: { fiscalYearEnd: reference },
        company: { structure: { reporting: { fiscalYearEnd: { id: 'deepType', ref: 'ref-deep' } } } },
      })
    );

    expect(getSpecificationFieldPath(paths, 'topLevelType')).to.equal('fiscalYearEnd');
    expect(getSpecificationFieldPath(paths, 'sharedType')).to.equal('general.fiscalYearEnd');
    expect(getSpecificationFieldPath(paths, 'deepType')).to.equal('company.structure.reporting.fiscalYearEnd');
  });

  it('Requires an exact explicit path for ambiguous types', () => {
    const paths = buildSpecificationFieldPaths(JSON.stringify({ a: { field: reference }, b: { field: reference } }));
    expect(getSpecificationFieldPath(paths, 'sharedType')).to.equal(undefined);
    expect(getSpecificationFieldPath(paths, 'sharedType', 'b.field')).to.equal('b.field');
    expect(getSpecificationFieldPath(paths, 'sharedType', 'missing.field')).to.equal(undefined);
    expect(getSpecificationFieldPath(paths, 'missingType')).to.equal(undefined);
    expect(getSpecificationFieldPath(paths, undefined)).to.equal(undefined);
  });

  it('Rejects an explicit path belonging to another type and does not fall back for a unique type', () => {
    const paths = buildSpecificationFieldPaths(
      JSON.stringify({
        otherTypePath: { id: 'otherType', ref: 'ref-other' },
        uniqueTypePath: { id: 'uniqueType', ref: 'ref-unique' },
      })
    );

    expect(getSpecificationFieldPath(paths, 'uniqueType', 'otherTypePath')).to.equal(undefined);
    expect(getSpecificationFieldPath(paths, 'uniqueType', 'incorrect.explicit.path')).to.equal(undefined);
    expect(getSpecificationFieldPath(paths, 'uniqueType')).to.equal('uniqueTypePath');
  });

  for (const schema of ['invalid json', 'null', '[]']) {
    it(`Ignores invalid schema ${schema}`, () => {
      expect(buildSpecificationFieldPaths(schema).size).to.equal(0);
    });
  }
});
