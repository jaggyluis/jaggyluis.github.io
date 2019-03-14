

function drop(dropZoneElement, fileExtensionFilters, cb) {

  if (window.File && window.FileReader && window.FileList && window.Blob) {
    // Great success!
    function handleJSONDrop(evt) {
      evt.stopPropagation();
      evt.preventDefault();
      var files = evt.dataTransfer.files;
        // Loop through the FileList and read
        for (var i = 0, f; f = files[i]; i++) {

          var ext = f.name.split('.').pop();

          // Only process extension files.
          if (!(fileExtensionFilters.includes(ext))) {

            console.log("file not in extensions")

            continue;
          }

          var reader = new FileReader();

          // Closure to capture the file information.
          reader.onload = (function(theFile) {

            return function(e) {
              cb(e.target.result, theFile.name); // NOTE - this is where the event is called ---

            };

          })(f);

          reader.readAsText(f);
        }
    }

    function handleDragOver(evt) {
      evt.stopPropagation();
      evt.preventDefault();
      evt.dataTransfer.dropEffect = 'copy'; // Explicitly show this is a copy.
    }

    // Setup the dnd listeners.
    var dropZone = dropZoneElement;
    dropZone.addEventListener('dragover', handleDragOver, false);
    dropZone.addEventListener('drop', handleJSONDrop, false);

  } else {
    alert('The File APIs are not fully supported in this browser.');
  }
}
