const uuid = require('uuid');
const validateFuncs = require('./validateFuncs');
const gdalMultiToSingle = require('./gdalMultiToSingle');

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

exports.multiToSingle = multiToSingle;
