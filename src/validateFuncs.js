module.exports = (datasetCut, datasetBase) => {
  if (datasetCut.constructor.name !== 'Layer' || datasetBase.constructor.name !== 'Layer') {
    throw new Error('The input must be an Layer object from GDAL');
  }

  const datasetCutEPSG = datasetCut.srs.toProj4();
  const datasetBaseEPSG = datasetBase.srs.toProj4();
  if (datasetCutEPSG !== datasetBaseEPSG) throw Error('Data must be in the same projection.');
};
