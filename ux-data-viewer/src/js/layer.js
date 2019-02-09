

function style(property) {

  var styles = {

    "catchment" :   [ '#d74518', '#fdae61', '#5cb7cc', '#b7b7b7'],
    "far" :         ['#fff7f3', '#fcc5c0', '#f768a1', '#ae017e', '#49006a'],
    "density" :     ['#fff7f3','#c6dbef', '#6baed6', '#2171b5', '#08306b'],
    "test" :        ["#ffffd9","#edf8b1","#c7e9b4","#7fcdbb","#41b6c4","#1d91c0","#225ea8","#253494","#081d58"]

  }

  var keys = Object.keys(styles);
  var key = keys[0];

  if (property in keys) {

    key = property;

  } else {

    for (var i = 0; i< keys.length; i++) {

      if (property.indexOf(keys[i]) !== -1) {
        key = keys[i];
      }
    }
  }

  return styles[key];

}
