const uuid = require('uuid');
const gdalMultiToSingle = require('./gdalMultiToSingle');
const gdalClip = require('./gdalClip');

const multiToSingle = (
  inputData,
  outputName = `output_${uuid().replace(/-/g, '')}.shp`,
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
  outputName = `output_${uuid().replace(/-/g, '')}.shp`,
  outputFormat = 'ESRI Shapefile',
) => {
  try {
    return gdalClip(datasetClip, datasetBase, outputName, outputFormat);
  } catch (error) {
    throw Error(error);
  }
};

exports.multiToSingle = multiToSingle;
exports.clip = clip;
