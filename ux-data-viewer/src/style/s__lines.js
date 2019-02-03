import data from '../data/ways.geojson'

const style = {
    data : data,
    prop : 'ways_props',
    mapbox_style : {
        id: 'mad__ways_props',
        type: 'line',
        source: 'gis',
        buffer: 25,
        layout : {
            'line-cap': 'round',
            'line-join': 'round'
        },
        paint: {
            'line-color' : '#3B2D4A',
            'line-opacity' : 1,
            'line-width' :  5,
            'line-width' : ['/', ['get', 'count'], 500]
        }
    }
}

export default style;
