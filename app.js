const gdalGisOps = require('./src/index.js');
const gdal = require('gdal');

const getLayer = dataset => gdal.open(dataset).layers.get(0);

console.log(
  gdalGisOps.erase(
    getLayer('src/tests/data/erase/talhao_temp.shp'),
    getLayer('src/tests/data/erase/soils.shp'),
    '/home/majortom/data.shp',
    'ESRI Shapefile',
    'MULTIPART',
  ),
);
// const data = getLayer('src/tests/data/dissolve/dissolved.shp');

// console.log(gdalGisOps.dissolve(data, '/home/majortom/data.shp', 'ESRI Shapefile'));

// const dissolve = (
//     dataInput,
//     outputName = `dissolve_${uuid().replace(/-/g, '')}.shp`,
//     outputFormat = 'ESRI Shapefile',
//     fields = dataInput.fields.getNames(),
//   )
