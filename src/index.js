const uuid = require('uuid');
const gdalMultiToSingle = require('./gdalMultiToSingle');
const gdalClip = require('./gdalClip');
const gdalErase = require('./gdalErase');
const gdalDissolve = require('./gdalDissolve');

const multiToSingle = (
  inputData,
  outputName = `multitosingle_${uuid().replace(/-/g, '')}.shp`,
  outputFormat = 'ESRI Shapefile',
) => {
  try {
    return gdalMultiToSingle(inputData, outputName, outputFormat);
  } catch (error) {
    throw Error(error);
  }
};

const clip = (
  datasetClip,
  datasetBase,
  outputName = `clip_${uuid().replace(/-/g, '')}.shp`,
  outputFormat = 'ESRI Shapefile',
) => {
  try {
    return gdalClip(datasetClip, datasetBase, outputName, outputFormat);
  } catch (error) {
    throw Error(error);
  }
};

const erase = (
  datasetErase,
  datasetBase,
  outputName = `erase_${uuid().replace(/-/g, '')}.shp`,
  outputFormat = 'ESRI Shapefile',
  parts = 'singlepart',
) => {
  try {
    return gdalErase(datasetErase, datasetBase, outputName, outputFormat, parts);
  } catch (error) {
    throw Error(error);
  }
};

const dissolve = (
  dataInput,
  outputName = `dissolve_${uuid().replace(/-/g, '')}.shp`,
  outputFormat = 'ESRI Shapefile',
  fields = dataInput.fields.getNames(),
) => {
  try {
    return gdalDissolve(dataInput, outputName, outputFormat, fields);
  } catch (error) {
    throw Error(error);
  }
};

exports.multiToSingle = multiToSingle;
exports.clip = clip;
exports.erase = erase;
exports.dissolve = dissolve;
