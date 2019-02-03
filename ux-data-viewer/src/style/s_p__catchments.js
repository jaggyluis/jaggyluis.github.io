const style = (data, source, feature) => ({
    data : data,
    prop : 'catchment',
    mapbox_style : {
        id : 'line_catchment',
        source : source,
        type: 'fill-extrusion',
        paint: {
            'fill-extrusion-color': {
                property : feature,
                type: 'interval',
                stops : [
                    [0,  '#d74518'],
                    [400,  '#fdae61'],
                    [800,  '#5cb7cc'],
                    [1200,  '#b7b7b7']
                ],
            },
            // use an 'interpolate' expression to add a smooth transition effect to the
            // buildings as the user zooms in
            'fill-extrusion-height':
                // "linear", //["linear"], ["zoom"],
                //25, 0,
                ['/', ['get', feature], 100]
            ,
            'fill-extrusion-base': 0,
            'fill-extrusion-opacity': 1
        }
    }
})

export default style;
