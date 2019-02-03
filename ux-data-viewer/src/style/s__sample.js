import data from '../data/sample.geojson'

const style = {
    data : data,
    prop : 'sample',
    mapbox_style : {
        id: 'mad__ways_sample',
        type: 'line',
        source: 'sample',
        buffer: 25,
        layout : {
            'line-cap': 'round',
            'line-join': 'round'
        },
        paint: {
            'line-color' : '#3B2D4A',
            'line-opacity' : 0.25, 
            'line-width' :  5,
        }
    }
}

export default style;
