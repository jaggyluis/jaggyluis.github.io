const style = (data, source, feature) => ({
    data : data,
    prop : 'FAR',
    mapbox_style : {
        id : 'line_far',
        source : source,
        type: 'line',
        filter : ['>=', feature, 0],
        layout : {
            'line-cap': 'round',
            'line-join': 'round'
        },
        paint: {
            'line-color' :  {
                property : feature,
                type: 'interval',
                stops : [
                    [0.5,'#fff7f3'],
                    [1,  '#fcc5c0'],
                    [2,  '#f768a1'],
                    [3,  '#ae017e'],
                    [5,  '#49006a']
                ],
            },
            'line-width': 3
        }
    }
})

export default style;
