const gdalGisOps = require('../index');
const gdal = require('gdal');

const getFeatures = data => gdal.open(data).layers.get(0);
const lines = getFeatures('./src/tests/data/clip/base_lines.shp');
const point = getFeatures('./src/tests/data/clip/base_points.shp');
const polygons = getFeatures('./src/tests/data/clip/base_polygons.shp');
const clipPolygons = getFeatures('./src/tests/data/clip/cut_polygons.shp');

describe('gdalMultiToSingle', () => {
  it('should output the correct number of features', () => {
    const clippedLines = gdalGisOps.clip(
      clipPolygons,
      lines,
      '/vsimem/clippedlines.shp',
      'ESRI Shapefile',
    );
    expect(getFeatures(clippedLines).features.count()).toBe(9);

    const clippedPoints = gdalGisOps.clip(
      clipPolygons,
      point,
      '/vsimem/clippedpoints.shp',
      'ESRI Shapefile',
    );
    expect(getFeatures(clippedPoints).features.count()).toBe(16);

    const clippedPolygons = gdalGisOps.clip(
      clipPolygons,
      polygons,
      '/vsimem/clippedpolygons.shp',
      'ESRI Shapefile',
    );
    expect(getFeatures(clippedPolygons).features.count()).toBe(82);
  });

  it(`should fail if the input geometry isn't a polygon|multipolygons`, () => {
    expect(() =>
      gdalGisOps.clip(point, lines, '/vsimem/clippedpolygons.shp', 'ESRI Shapefile'),
    ).toThrowError();
  });
});
