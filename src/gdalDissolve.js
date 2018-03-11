const _ = require('lodash');
const gdalMultiToSingle = require('./gdalMultiToSingle');
const gdal = require('gdal');
const path = require('path');

const getLayer = shapefile => gdal.open(shapefile, 'r+', 'ESRI Shapefile').layers.get(0);

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

module.exports = (dataInput, outputName, outputFormat, fields) => {
  if (!(fields instanceof Array)) throw new Error('The fields must be passed as an Array');

  const dataInputSingle = getLayer(
    gdalMultiToSingle(dataInput, '/vsimem/datasetDissolve.shp', 'ESRI Shapefile'),
  );

  const fieldsData = [];
  let feature = dataInputSingle.features.first();
  while (feature) {
    const fieldsValues = {};
    for (const field of fields) {
      fieldsValues[field] = feature.fields.get(field);
    }
    fieldsData.push(fieldsValues);
    feature = dataInputSingle.features.next();
  }
  const fieldsDataUnique = _.uniq(fieldsData.map(value => JSON.stringify(value)));

  for (const fieldDataUnique of fieldsDataUnique) {
    const fieldsJSON = JSON.parse(fieldDataUnique);
    let query = '';
    for (const key of Object.keys(fieldsJSON)) {
      if (typeof fieldsJSON[key] === 'number') {
        query += `${key} = ${fieldsJSON[key]} AND `;
      } else {
        query += `${key} = '${fieldsJSON[key]}' AND `;
      }
    }

    dataInputSingle.setAttributeFilter(query.slice(0, -5));
    const fids = dataInputSingle.features.map(value => value.fid);
    const geoms = [];

    feature = dataInputSingle.features.first();
    while (feature) {
      geoms.push(feature.getGeometry());
      feature = dataInputSingle.features.next();
    }

    const mergedGeoms = geoms.reduce((prev, next) => prev.union(next), geoms[0]);
    const featureDissolved = dataInputSingle.features.get(fids[0]);
    featureDissolved.setGeometry(mergedGeoms);
    dataInputSingle.features.set(fids[0], featureDissolved);

    fids.slice(1).forEach(value => dataInputSingle.features.remove(value));
  }
  dataInputSingle.setAttributeFilter(null);

  const geomType = dataInputSingle.features.first().getGeometry().name;
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

  return exportLayer(dataInputSingle, outputName, outputFormat, typeCode);
};
