const style = (data, source, feature) => ({
    data : data,
    prop : 'catchment',
    mapbox_style : {
        id : 'line_catchment',
        source : source,
        type: 'line',
        // filter : ['>=', '_far', 0],
        layout : {
            'line-cap': 'round',
            'line-join': 'round'
        },
        paint: {
            'line-color' :  {
                property : feature,
                type: 'interval',
                stops : [
                    [0,  '#d74518'],
                    [400,  '#fdae61'],
                    [800,  '#5cb7cc'],
                    [1200,  '#b7b7b7']
                ],
            },
            'line-width': [
                "interpolate", ["linear"], ["zoom"],
                10, 1,
                20, 6
            ],
        }
    }
})

export default style;
