const gdal = require('gdal');
const validateFuncs = require('../validateFuncs');

const getFeatures = data => gdal.open(data).layers.get(0);
const lines = getFeatures('./src/tests/data/clip/base_lines.shp');
const simplelinesWgs84 = getFeatures('./src/tests/data/wrongprojection/simplelines_wgs84.shp');
const simplelinesSirgas2000 = getFeatures(
  './src/tests/data/wrongprojection/simpleslines_sirgas2000.shp',
);

describe('validateFuncs', () => {
  it(`should failt if the input data isn't a layer`, () => {
    expect(() => validateFuncs(lines.features, lines.features)).toThrowError();
  });

  it(`should fail if the data aren't at the same projecton`, () => {
    expect(() => validateFuncs(simplelinesSirgas2000, simplelinesWgs84)).toThrowError();
  });
});
