
//source from https://medium.com/@danny.pule/export-json-to-csv-file-using-javascript-a0b7bc5b00d2 ---

function convertToCSV(objArray) {
    var array = typeof objArray != 'object' ? JSON.parse(objArray) : objArray;
    var str = '';

    for (var i = 0; i < array.length; i++) {
        var line = '';
        for (var index in array[i]) {
            if (line != '') line += ','

            line += array[i][index];
        }

        str += line + '\r\n';
    }

    return str;
}

function exportCSVFile(headers, items, fileTitle) {
    if (headers) {
        items.unshift(headers);
    }

    // Convert Object to JSON
    var jsonObject = JSON.stringify(items);

    var csv = this.convertToCSV(jsonObject);

    var exportedFilenmae = fileTitle + '.csv' || 'export.csv';

    var blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    if (navigator.msSaveBlob) { // IE 10+
        navigator.msSaveBlob(blob, exportedFilenmae);
    } else {
        var link = document.createElement("a");
        if (link.download !== undefined) { // feature detection
            // Browsers that support HTML5 download attribute
            var url = URL.createObjectURL(blob);
            link.setAttribute("href", url);
            link.setAttribute("download", exportedFilenmae);
            link.style.visibility = 'hidden';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        }
    }
}

// LJ add ---
function exportObjArrayToCSV(fileTitle, objArray, objProperties) {

  var headers = {};
  var items = [];

  objArray.forEach(o => {

    var item = {};

    Object.keys(o).forEach(k => {

      if (!objProperties || objProperties.includes(k)) {

        if (!Object.keys(headers).includes(k)) {
          headers[k] = k;
        }

        item[k] = o[k].toString();
      }

    });

    items.push(item);

  });

  items.forEach(o => {

      Object.keys(headers).forEach(k => {

        if (!Object.keys(o).includes(k)) {
          o[k] = "";
        }
      });
  });

  exportCSVFile(headers, items, fileTitle);

}
