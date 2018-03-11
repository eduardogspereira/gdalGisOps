const gdal = require('gdal');
const path = require('path');
const validateFuncs = require('./validateFuncs');
const gdalMultiToSingle = require('./gdalMultiToSingle');
const gdalDissolve = require('./gdalDissolve');

const exportLayer = (datasetErase, outputName, outputFormat, typeCode) => {
  const srid = datasetErase.srs;
  const layerName = path.basename(outputName).substring(0, outputName.lastIndexOf('.'));
  const outputFile = gdal.open(outputName, 'w', outputFormat);
  const outputLayer = outputFile.layers.create(layerName, srid, typeCode);
  for (const columnName of datasetErase.fields.getNames()) {
    outputLayer.fields.add(datasetErase.fields.get(columnName));
  }

  let clippedFeature = datasetErase.features.first();
  while (clippedFeature) {
    const outputFeature = new gdal.Feature(outputLayer);
    outputFeature.setGeometry(clippedFeature.getGeometry());
    for (const columnName of datasetErase.fields.getNames()) {
      outputFeature.fields.set(columnName, clippedFeature.fields.get(columnName));
    }
    outputLayer.features.add(outputFeature);
    clippedFeature = datasetErase.features.next();
  }
  outputLayer.flush();
  outputFile.close();

  return outputName;
};

const getLayer = shapefile => gdal.open(shapefile, 'r+', 'ESRI Shapefile').layers.get(0);

module.exports = (datasetErase, datasetBase, outputName, outputFormat, parts) => {
  validateFuncs(datasetErase, datasetBase);

  const allowEraseType = ['polygon', 'multipolygon'];
  const eraseGeomType = datasetErase.features
    .first()
    .getGeometry()
    .name.toLowerCase();
  if (!allowEraseType.includes(eraseGeomType)) {
    throw new Error('Erase feature must be Polygon or MultiPolygon.');
  }

  const geomType = datasetBase.features.first().getGeometry().name;
  let typeCode;

  switch (geomType.toLowerCase()) {
    case 'multipolygon':
    case 'polygon': {
      typeCode = 3;
      break;
    }
    case 'point':
    case 'multipoint':
      typeCode = 1;
      break;
    case 'linestring':
    case 'multilinestring':
      typeCode = 2;
      break;
    default:
      throw new Error('Invalid geometry type.');
  }

  const datasetEraseSingle = getLayer(
    gdalMultiToSingle(datasetErase, '/vsimem/datasetCut.shp', 'ESRI Shapefile'),
  );
  const datasetBaseSingle = getLayer(
    gdalMultiToSingle(datasetBase, '/vsimem/datasetClip.shp', 'ESRI Shapefile'),
  );

  let eraseFeature = datasetEraseSingle.features.first();
  while (eraseFeature) {
    let baseFeature = datasetBaseSingle.features.first();
    while (baseFeature) {
      const erasedFeature = datasetBaseSingle.features.get(Number(baseFeature.fid));
      erasedFeature.setGeometry(baseFeature.getGeometry().difference(eraseFeature.getGeometry()));
      datasetBaseSingle.features.set(Number(baseFeature.fid), erasedFeature);
      datasetBaseSingle.flush();
      baseFeature = datasetBaseSingle.features.next();
    }
    eraseFeature = datasetEraseSingle.features.next();
  }

  if (parts.toLowerCase() === 'singlepart') {
    return exportLayer(
      getLayer(gdalMultiToSingle(datasetBaseSingle, '/vsimem/datasetFinal.shp', 'ESRI Shapefile')),
      outputName,
      outputFormat,
      typeCode,
    );
  }
  return exportLayer(
    getLayer(
      gdalDissolve(
        datasetBaseSingle,
        '/vsimem/datasetFinal.shp',
        'ESRI Shapefile',
        datasetBaseSingle.fields.getNames(),
      ),
    ),
    outputName,
    outputFormat,
    typeCode,
  );
};
