const validateFuncs = require('./validateFuncs');
const gdalMultiToSingle = require('./gdalMultiToSingle');
const gdal = require('gdal');
const path = require('path');

const getLayer = dataset => gdal.open(dataset).layers.get(0);
const getColumns = layer => layer.fields.getNames();

const createLayer = (datasetCut, datasetBase, typeCode) => {
  const srid = datasetCut.srs;
  const shapePath = `/vsimem/${datasetCut.name}_clip.shp`;
  const newDataset = gdal.open(shapePath, 'w', 'ESRI Shapefile');
  const newLayer = newDataset.layers.create(`${datasetCut.name}_clip`, srid, typeCode);
  const datasetCutColumns = getColumns(datasetCut);
  const datasetBaseColumns = getColumns(datasetBase).map(value => {
    if (datasetCutColumns.map(cutColumn => cutColumn.toUpperCase()).includes(value.toUpperCase())) {
      return `${value}|${value.slice(0, -1)}1`;
    }
    return value;
  });
  const layersColumns = {
    datasetCut: datasetCutColumns,
    datasetBase: datasetBaseColumns,
  };

  const addColumns = (columns, dataset, newdataset) => {
    for (const column of columns) {
      if (!column.includes('|')) {
        const fieldDefinition = dataset.fields.get(column);
        newdataset.fields.add(fieldDefinition);
      } else {
        const fieldDefinition = dataset.fields.get(column.split('|')[0]);
        fieldDefinition.name = column.split('|')[1].toString();
        newdataset.fields.add(fieldDefinition);
      }
    }
  };
  addColumns(layersColumns.datasetCut, datasetCut, newLayer);
  addColumns(layersColumns.datasetBase, datasetBase, newLayer);

  return { newLayer, layersColumns };
};

const clipFeatures = (newLayer, layersColumns, datasetCut, datasetBase, typeName) => {
  const cutFeatures = datasetCut.features;
  cutFeatures.forEach(cutFeature => {
    const envelope = cutFeature
      .getGeometry()
      .getEnvelope()
      .toPolygon();
    datasetBase.setSpatialFilter(envelope);
    const baseFeatures = datasetBase.features;
    baseFeatures.forEach(baseFeature => {
      const clipFeature = cutFeature.getGeometry().intersection(baseFeature.getGeometry());
      if (!clipFeature.isEmpty()) {
        if (clipFeature.name.toLowerCase() === `multi${typeName}`) {
          for (const multipart of clipFeature.children.toArray()) {
            const feature = new gdal.Feature(newLayer);
            feature.setGeometry(multipart);
            for (const column of layersColumns.datasetCut) {
              feature.fields.set(column, cutFeature.fields.get(column));
            }
            for (const column of layersColumns.datasetBase) {
              if (!column.includes('|')) {
                feature.fields.set(column, baseFeature.fields.get(column));
              } else {
                const columnName = column.split('|')[1];
                const columnValue = baseFeature.fields.get(column.split('|')[0]);
                feature.fields.set(columnName, columnValue);
              }
            }
            newLayer.features.add(feature);
          }
        } else {
          const feature = new gdal.Feature(newLayer);
          feature.setGeometry(clipFeature);
          for (const column of layersColumns.datasetCut) {
            feature.fields.set(column, cutFeature.fields.get(column));
          }
          for (const column of layersColumns.datasetBase) {
            if (!column.includes('|')) {
              feature.fields.set(column, baseFeature.fields.get(column));
            } else {
              const columnName = column.split('|')[1];
              const columnValue = baseFeature.fields.get(column.split('|')[0]);
              feature.fields.set(columnName, columnValue);
            }
          }
          newLayer.features.add(feature);
        }
      }
    });
  });
  newLayer.flush();
  return newLayer;
};

const exportLayer = (clippedData, outputName, outputFormat, typeCode) => {
  const srid = clippedData.srs;
  const layerName = path.basename(outputName).substring(0, outputName.lastIndexOf('.'));
  const outputFile = gdal.open(outputName, 'w', outputFormat);
  const outputLayer = outputFile.layers.create(layerName, srid, typeCode);
  for (const columnName of clippedData.fields.getNames()) {
    outputLayer.fields.add(clippedData.fields.get(columnName));
  }

  let clippedFeature = clippedData.features.first();
  while (clippedFeature) {
    const outputFeature = new gdal.Feature(outputLayer);
    outputFeature.setGeometry(clippedFeature.getGeometry());
    for (const columnName of clippedData.fields.getNames()) {
      outputFeature.fields.set(columnName, clippedFeature.fields.get(columnName));
    }
    outputLayer.features.add(outputFeature);
    clippedFeature = clippedData.features.next();
  }

  outputLayer.flush();
  outputFile.close();
  return outputName;
};

module.exports = (datasetClip, datasetBase, outputName, outputFormat) => {
  validateFuncs(datasetClip, datasetBase);

  const allowClippedType = ['polygon', 'multipolygon'];
  const clipGeomType = datasetClip.features
    .first()
    .getGeometry()
    .name.toLowerCase();
  if (!allowClippedType.includes(clipGeomType)) {
    throw new Error('Clip feature must be Polygon or MultiPolygon.');
  }

  const datasetClipSingle = getLayer(
    gdalMultiToSingle(datasetClip, '/vsimem/datasetCut.shp', 'ESRI Shapefile'),
  );
  const datasetBaseSingle = getLayer(
    gdalMultiToSingle(datasetBase, '/vsimem/datasetClip.shp', 'ESRI Shapefile'),
  );

  const geomType = datasetBaseSingle.features.first().getGeometry().name;
  let typeCode;
  let typeName;
  switch (geomType.toLowerCase()) {
    case 'multipolygon':
    case 'polygon': {
      typeCode = 3;
      typeName = 'polygon';
      break;
    }
    case 'point':
    case 'multipoint':
      typeCode = 1;
      typeName = 'point';
      break;
    case 'linestring':
    case 'multilinestring':
      typeCode = 2;
      typeName = 'linestring';
      break;
    default:
      throw new Error('Invalid geometry type.');
  }

  const { newLayer, layersColumns } = createLayer(datasetClipSingle, datasetBaseSingle, typeCode);

  const clippedData = clipFeatures(
    newLayer,
    layersColumns,
    datasetClipSingle,
    datasetBaseSingle,
    typeName,
  );

  return exportLayer(clippedData, outputName, outputFormat, typeCode);
};
