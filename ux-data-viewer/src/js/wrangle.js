
function wrangle(data) {

  var wrangled = {
    data : [],
    properties : []
  }

  if (data.type === 'FeatureCollection') {

    var features = data.features;
    var properties = {}

    features.forEach(f => {

      Object.keys (f.properties).forEach(k => {

        if (k[0] === "_") {

          return;
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

      wrangled.data.push(f.properties);
    });

    wrangled.properties = properties;
  }

  console.log(wrangled);

  return wrangled;
}
