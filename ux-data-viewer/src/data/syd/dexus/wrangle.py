import json
from pprint import pprint

def load(path):

    data = {}
     
    with open(path) as data_file:    
        data = json.load(data_file)
    
    return data


buildings = load("buildings.geojson");
building_data = load("building_data.json");

pprint(buildings["features"][0]);
pprint (building_data[0]);

total = len(buildings["features"]);

mKey = "BUILDINGKEY";

for i, feature in enumerate(buildings["features"]) :

    print (str(i) + " / "  + str(total));

    #if (i > 100) : break;

    flag = False;

    for data in building_data :

        if feature["properties"][mKey] == data[mKey] :

            for key in data.keys() :

                if not key in feature["properties"] :

                    try :

                        feature["properties"][key] = float (data[key] )

                    except :

                        feature["properties"][key] = data[key] 

            flag = True;

            break;

    if not flag :

        #print ("not found")
    
        buildings["features"].remove(feature);

    for key in feature["properties"].keys() :

        if (key == "" or key == None) :

            #print ("invalid key :" + key);

            del feature["properties"][key]

    if ( "HEIGHTROOF" in feature["properties"].keys() ) :

        feature["properties"]["height"] = feature["properties"]["HEIGHTROOF"] * 0.3048;

    else :

        feature["properties"]["height"] = 0;    

print ("... wrangled")

pprint(buildings["features"][0]);

with open('building_merge.geojson', 'w') as out_file:
    json.dump(buildings, out_file)

print ("... done")

