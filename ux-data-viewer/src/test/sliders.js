$(propertyRangeSlider).slider({
  range: true,
  min: propertyInterval[0],
  max: propertyInterval[1],
  values: propertyInterval,
  slide: function( event, ui ) {

      //console.log(ui);

      $( "#amount" ).val( ui.value );
      $(this).find('.ui-slider-handle').text(ui.value);
  },
  create: function(event, ui) {
      var v=$(this).slider('value');
      $(this).find('.ui-slider-handle').text(v);
  }
});

$(propertyWeightSlider).slider({
  range: "min",
  value: 1,
  min: 0,
  max: 10,
  slide: function( event, ui ) {
      $( "#amount" ).val( ui.value );
      $(this).find('.ui-slider-handle').text(ui.value);
  },
  create: function(event, ui) {
      var v=$(this).slider('value');
      $(this).find('.ui-slider-handle').text(v);
  }
});
