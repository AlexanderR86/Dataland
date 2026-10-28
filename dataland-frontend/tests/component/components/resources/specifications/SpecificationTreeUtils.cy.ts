import {
  buildSpecificationTree,
  collectExpandableKeys,
  filterSpecificationTree,
  formatSchemaKey,
  formatSchemaPath,
  parseFrameworkSchema,
} from '@/utils/specifications/SpecificationTreeUtils';
import {
  buildDataPointTypeIdToPathsMap,
  getAncestorKeys,
  getDataPointTypeIdAtPath,
} from '@/utils/specifications/SpecificationDetailUtils';
import { mockFramework } from '@ct/testUtils/SpecificationMocks';

describe('Unit tests for the specification tree utils', () => {
  const schema = parseFrameworkSchema(mockFramework.schema);
  const tree = buildSpecificationTree(schema);

  it('Builds readable labels while keeping the raw path as key', () => {
    const general = tree[0];
    expect(general.label).to.equal('General');
    expect(general.selectable).to.equal(false);
    const leaf = general.children?.[0].children?.[0];
    expect(leaf?.label).to.equal('Fiscal Year Deviation');
    expect(leaf?.key).to.equal('general.general.fiscalYearDeviation');
    expect(leaf?.leaf).to.equal(true);
    expect(leaf?.data).to.deep.equal({
      dataPointTypeId: 'extendedEnumFiscalYearDeviation',
      aliasExport: 'FISCAL_YEAR_DEVIATION',
    });
  });

  it('Rejects schemas that are not JSON objects', () => {
    expect(() => parseFrameworkSchema('[]')).to.throw('not a JSON object');
    expect(() => parseFrameworkSchema('{broken')).to.throw();
  });

  it('Formats schema keys and paths', () => {
    expect(formatSchemaKey('fiscalYearDeviation')).to.equal('Fiscal Year Deviation');
    expect(formatSchemaPath('general.company')).to.equal('General › Company');
  });

  it('Collects the keys of all expandable nodes', () => {
    expect(collectExpandableKeys(tree)).to.deep.equal(['general', 'general.general', 'general.company']);
  });

  it('Returns the original nodes for a blank query', () => {
    expect(filterSpecificationTree(tree, '   ', 'name')).to.equal(tree);
  });

  it('Filters by name case-insensitively and keeps only matching branches', () => {
    const result = filterSpecificationTree(tree, 'FISCAL YEAR end', 'name');
    expect(collectExpandableKeys(result)).to.deep.equal(['general', 'general.general']);
    expect(result[0].children?.[0].children?.map((node) => node.key)).to.deep.equal(['general.general.fiscalYearEnd']);
  });

  it('Filters by raw schema key in name mode', () => {
    const result = filterSpecificationTree(tree, 'mainPcafSector', 'name');
    expect(result[0].children?.[0].key).to.equal('general.company');
  });

  it('Filters by data point type id only in id mode', () => {
    expect(filterSpecificationTree(tree, 'extendedEnumFiscalYearDeviation', 'name')).to.have.length(0);
    const result = filterSpecificationTree(tree, 'extendedenumfiscal', 'id');
    expect(result[0].children?.[0].children?.map((node) => node.key)).to.deep.equal([
      'general.general.fiscalYearDeviation',
    ]);
    expect(filterSpecificationTree(tree, 'FISCAL_YEAR_DEVIATION', 'id')).to.have.length(0);
  });

  it('Resolves data point type ids and ancestors by path', () => {
    expect(getDataPointTypeIdAtPath(schema, 'general.general.fiscalYearEnd')).to.equal('extendedDateFiscalYearEnd');
    expect(getDataPointTypeIdAtPath(schema, 'general.general')).to.equal(undefined);
    expect(getDataPointTypeIdAtPath(schema, 'does.not.exist')).to.equal(undefined);
    expect(getAncestorKeys('a.b.c')).to.deep.equal(['a', 'a.b']);
  });

  it('Maps data point type ids to all their paths in the schema', () => {
    const map = buildDataPointTypeIdToPathsMap({
      a: { b: { x: { id: 'typeX', ref: 'r' }, y: { id: 'typeY', ref: 'r' } } },
      c: { z: { id: 'typeX', ref: 'r' } },
    });
    expect(map.get('typeX')).to.deep.equal(['a.b.x', 'c.z']);
    expect(map.get('typeY')).to.deep.equal(['a.b.y']);
    expect(map.has('unknown')).to.equal(false);
  });

  it('Returns an empty map for an empty schema or non-object entries', () => {
    expect(buildDataPointTypeIdToPathsMap({}).size).to.equal(0);
    expect(buildDataPointTypeIdToPathsMap({ a: 'text', b: [1] }).size).to.equal(0);
  });
});
