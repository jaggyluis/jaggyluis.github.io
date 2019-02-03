import data from '../data/mad_stations.geojson'

const style = {
    data : data,
    prop : 'stations',
    mapbox_style : {
        id : 'stations_origin',
        source : 'data',
        type: 'circle',
        paint: {
            'circle-color' :  [
                'match',
                ['get', 'sink'],
                1        , '#3B2D4A'
                ,'#f578a2'
            ],

            'circle-opacity' : 0.9,
            'circle-radius' :   {
                property : 'destiny__origin',
                type: 'exponential',
                stops : [
                    [-50, 2],
                    [-30, 3],
                    [0, 4.5],
                    [30, 6],
                    [60, 8]
                ],
            }
        }
    }
}

export default style;

// [
//     'match',
//     ['get', 'sink'],
//     1        , '#3B2D4A'
//     ,'#f578a2'
// ]
