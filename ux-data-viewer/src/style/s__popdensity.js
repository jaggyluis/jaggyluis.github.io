import dots from '../data/la_dots_county.geojson'

const style = {
    data : dots,
    prop : 'Population Density',
    mapbox_style : {
        id : 'dots_popden',
        source : 'dots',
        type: 'circle',
        filter : ['>=', 'c10__pop_density__sqkm', 0],
        paint: {
            'circle-color' :  {
                property : 'c10__pop_density__sqkm',
                type: 'exponential',
                stops : [
                    [0,  '#fff7f3'],
                    [2000,  '#c6dbef'],
                    [4750,  '#6baed6'],
                    [8500,  '#2171b5'],
                    [19000,'#08306b']
                ],
            },
            'circle-opacity' : 0.75,
            'circle-radius' :   {
                property : 'c10__pop_density__sqkm',
                type: 'exponential',
                stops : [
                    [0, 1],
                    [2000, 2],
                    [4750, 3],
                    [8500, 4],
                    [19000, 6]
                ],
            }
        }
    }
}

export default style;
