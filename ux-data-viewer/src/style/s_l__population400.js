const style = (data, source, feature) => ({
    data : data,
    prop : 'Population within 400m',
    mapbox_style : {
        id: 'mad__ways_props',
        source: source,
        type: 'line',
        layout : {
            'line-cap': 'round',
            'line-join': 'round'
        },
        paint: {
            'line-color' : '#ffffff',
            'line-opacity' : 1,
            'line-width' : ['/', ['get', feature], 400]
        }
    }
})

export default style;
