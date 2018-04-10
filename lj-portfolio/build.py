
import json
from pprint import pprint
import os
from PIL import Image  # uses pillow
from random import randint

def format_path(path) :
    
    return path.replace("\\", "/")

def load_image(path):
    
    im = Image.open(path)

    return im
    
    #print im.size   # return value is a tuple, ex.: (1200, 800)

def load(path):

    data = {}
    
    with open(path) as data_file:    
        data = json.load(data_file)
    
    return data

def build_project(directory) :

    data = []
    data_items = {};

    for file_ in os.listdir(directory):

        file_name = os.path.splitext(file_)[0]
        file_path = os.path.join(directory, file_)

        if os.path.isdir(file_path) :

            pass
            # for future implementation ---

        else :

            if file_.endswith(".jpg") or file_.endswith(".png"):

                im = load_image(file_path)
                aspect = float(im.size[0]) / float(im.size[1])
                size = round(aspect)

                file_data = {
                    "img" : [format_path(file_path)],
                    "size" : size,
                    }

                if file_name in data_items :

                    data_items[file_name]["img"] = file_data["img"]
                    data_items[file_name]["size"] = file_data["size"]

                else :

                    data_items[file_name] = file_data

            elif file_.endswith(".txt") :

                file_read = open(file_path);

                text = "<br>".join(file_read.readlines(5)) 
                
                size = randint(1,3)

                file_data = {
                    "txt" : text,
                    "size" : size
                    }

                if file_name in data_items:

                    data_items[file_name]["txt"] = file_data["txt"]

                else :

                    data_items[file_name] = file_data

    for key in data_items.keys():

        data.append(data_items[key])
                
    return data

def build_dir(directory):

    directory_path, directory_name = os.path.split(directory)

    data = {}
    children = []
    banner = None
    datum = []

    for file_ in os.listdir(directory):

        file_name = os.path.splitext(file_)[0]
        file_path = os.path.join(directory, file_)

        if os.path.isdir(file_path) :

            if file_name == "data" :

                project_data = build_project(file_path)

                if project_data :
                    datum = project_data

            else :
                
                dir_data = build_dir(file_path)

                if dir_data :
                    children.append(dir_data)

        else :

            if file_name == directory_name :
            
                if file_.endswith(".json"): 
                    data = load(file_path)

                if file_.endswith(".jpg") or file_.endswith(".png"):
                    banner = format_path(file_path)                

    if len(children) :
        data["children"] = children

    if banner :
        data["banner"] = banner

    if datum:
        data["data"] = datum
        
    return data

    
out = build_dir("app\\data\\root")

#pprint(out)

with open('app/data/data.json', 'w') as out_file:
    json.dump(out, out_file)

            
