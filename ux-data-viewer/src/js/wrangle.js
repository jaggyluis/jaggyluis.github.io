
function wrangle(data) {

  var wrangled = {
    data : data,
    properties : [],
    values : [],
    types : [],
  }

  if (data.type === 'FeatureCollection') {

    var features = data.features;
    var properties = {}

    features.forEach((f, i) => {

      var type = f.geometry.type;

      if (!(wrangled.types.includes(type))) {
        wrangled.types.push(type);
      }

      if (!("_id" in f.properties)) {
        f.properties["_id"] = i;
      }

      f.properties['test'] = Math.random(); // NOTE - for unit testing on all types ---

      Object.keys(f.properties).forEach(k => {

        if (k[0] === "_") {

          return;
        }

        if (f.properties[k] === null || f.properties[k] === undefined) {
          f.properties[k] = 0;
        }

        var value = f.properties[k];

        if (k in properties) {

          if (properties[k][0] >= value) {
            properties[k][0] = value;
          }

          if (properties[k][1] <= value) {
            properties[k][1] = value;
          }

        } else {

          properties[k] = [value, value];
        }

      });

      wrangled.values.push(f.properties);
    });

    Object.keys(properties).forEach(p => {

      if (properties[p][0] === null || properties[p][0] === undefined) {
        properties[p][0] = 0;
      }

      if (properties[p][1] === null || properties[p][1] === undefined) {
        properties[p][1] = 0;
      }

    });

    wrangled.properties = properties;
  }

  console.log(wrangled);

  return wrangled;
}
