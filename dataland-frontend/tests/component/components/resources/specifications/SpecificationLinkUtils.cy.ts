import { buildSpecificationFieldPaths, getSpecificationFieldPath } from '@/utils/specifications/SpecificationLinkUtils';

describe('Specification field path mapping', () => {
  const reference = { id: 'sharedType', ref: 'ref-shared' };

  it('Uses actual schema paths at different depths', () => {
    const paths = buildSpecificationFieldPaths(JSON.stringify({ general: { fiscalYearEnd: reference } }));
    expect(getSpecificationFieldPath(paths, 'sharedType')).to.equal('general.fiscalYearEnd');
  });

  it('Requires an exact explicit path for ambiguous types', () => {
    const paths = buildSpecificationFieldPaths(JSON.stringify({ a: { field: reference }, b: { field: reference } }));
    expect(getSpecificationFieldPath(paths, 'sharedType')).to.equal(undefined);
    expect(getSpecificationFieldPath(paths, 'sharedType', 'b.field')).to.equal('b.field');
    expect(getSpecificationFieldPath(paths, 'sharedType', 'missing.field')).to.equal(undefined);
    expect(getSpecificationFieldPath(paths, 'missingType')).to.equal(undefined);
    expect(getSpecificationFieldPath(paths, undefined)).to.equal(undefined);
  });

  for (const schema of ['invalid json', 'null', '[]']) {
    it(`Ignores invalid schema ${schema}`, () => {
      expect(buildSpecificationFieldPaths(schema).size).to.equal(0);
    });
  }
});
