
import json
from pprint import pprint
import os
from PIL import Image  # uses pillow
from random import randint

def format_path(path) :   
    return path.replace("\\", "/")

def load_image(path):
    return Image.open(path)

def compress_image(im, factor) :

    im_size = im.size
    print im_size

    im = im.resize((im_size[0]/factor,im_size[1]/factor),Image.ANTIALIAS)

    print "--> " , im.size
    return im
    
    #im.save("path\\to\\save\\image_scaled_opt.jpg",optimize=True,quality=95)

def load(path):

    data = {}
     
    with open(path) as data_file:    
        data = json.load(data_file)
    
    return data

def build_project(directory, target) :

    data = []
    data_items = {};

    data_iteme_sm_dir = target + "\\build\\sm\\";
    
    if not os.path.exists(data_iteme_sm_dir):
        os.makedirs(data_iteme_sm_dir)    

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
                extension = file_.split(".")[1]

                im_compressed_sm = compress_image(im, 3)
                im_compressed_sm_path = data_iteme_sm_dir + file_name + "_sm." + extension
                im_compressed_sm.save(im_compressed_sm_path, optimize=True,quality=95)
                

                file_data = {
                    "img_raw" : [format_path(file_path)],
                    "img_sm" : [format_path(im_compressed_sm_path)],
                    "size" : size,
                    }

                if file_name in data_items :
                    for file_key in file_data[key].keya():
                        data_items[file_name][file_key] = file_data[file_key]

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

            if file_name == "raw" :

                project_data = build_project(file_path, directory)

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

            
