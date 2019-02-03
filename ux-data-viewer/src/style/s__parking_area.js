import dots from '../data/la_dots_county.geojson'

const style = {
    data : dots,
    prop : 'Parking Area',
    mapbox_style : {
        id : 'dots_parking',
        source : 'dots',
        type: 'circle',
        filter : ['>=', 'parking_area', 0],
        paint: {
            'circle-color' : [
                'match',
                ['get', 'parking_type'],
                'Commercial'        , '#f64f59'
                ,'Residential'      , '#c471ed'
                ,'Industrial'       , '#12c2e9'
                ,'#252525'
            ],
            'circle-opacity' : 0.75,
            'circle-radius' :   {
                property : 'parking_area',
                type: 'exponential',
                stops : [
                    [5000, 1.5],
                    [17500, 3],
                    [30000, 4.5],
                    [62500, 6]
                ],
            }
        }
    }
}

export default style;
