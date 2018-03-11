const gdalGisOps = require('../index');
const gdal = require('gdal');

const getFeatures = data => gdal.open(data).layers.get(0);
const multilines = getFeatures('./src/tests/data/multitosingle/multilines.geojson');
const multipolygons = getFeatures('./src/tests/data/multitosingle/multipolygons.geojson');
const multipoints = getFeatures('./src/tests/data/multitosingle/multipoints.geojson');
const linestrings = getFeatures('./src/tests/data/multitosingle/simplelines.shp');

describe('gdalMultiToSingle', () => {
  it('should output the correct single part numbers', () => {
    const simplepoints = gdalGisOps.multiToSingle(
      multipoints,
      '/vsimem/points.shp',
      'ESRI Shapefile',
    );
    expect(getFeatures(simplepoints).features.count()).toBe(7);

    const simplelines = gdalGisOps.multiToSingle(multilines, '/vsimem/lines.shp', 'ESRI Shapefile');
    expect(getFeatures(simplelines).features.count()).toBe(9);

    const simplepolygons = gdalGisOps.multiToSingle(
      multipolygons,
      '/vsimem/polygons.shp',
      'ESRI Shapefile',
    );
    expect(getFeatures(simplepolygons).features.count()).toBe(10);

    const simplelinestrings = gdalGisOps.multiToSingle(
      linestrings,
      '/vsimem/linestring.shp',
      'ESRI Shapefile',
    );
    expect(getFeatures(simplelinestrings).features.count()).toBe(9);
  });
});
