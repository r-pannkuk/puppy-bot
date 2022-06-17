import PIL
from PIL import _imaging
from PIL import Image, ImageDraw, ImageFont
import hashlib
import time
from pathlib import Path
from urllib.parse import urlparse
from urllib.request import urlretrieve
from stat import S_ISREG, ST_CTIME, ST_MODE
import requests
from io import BytesIO
import sys
import os
import time
import re
import textwrap

MAX_THRESHOLD = 30
MIN_THRESHOLD = 10

def main():
    if(len(sys.argv) == 1 or sys.argv[1] == ''):
        print("./src/assets/media/magneto/Magneto_Background.png")
        return


    # Determine if image exists in save files
    location = sys.argv[1]
    save_folder = "./saves/magneto/"
    save_name = save_folder + hashlib.sha1(location.encode()).hexdigest() + ".png"

    # check for already created images
    if(os.path.isfile(save_name)):
        print(save_name)
        return
    
    if(not os.path.isdir(save_folder)):
        Path(save_folder).mkdir(parents=True, exist_ok=True)
    
    if(len(os.listdir(save_folder)) >= MAX_THRESHOLD):
        files = (os.path.join(save_folder, fn) for fn in os.listdir(save_folder))
        files = ((os.stat(path), path) for path in files)
        files = ((stat[ST_CTIME], path) for stat, path in files if S_ISREG(stat[ST_MODE]))

        sorted_files = sorted(files)
        sorted_files.reverse()

        # remove oldest files
        for cdate, path in sorted_files[MIN_THRESHOLD-1:]:
            os.remove(path)

    # open base images to be used as the layers for the new image
    magneto = Image.open("./src/assets/media/magneto/Magneto_Background.png")
    hand = Image.open("./src/assets/media/magneto/Magneto_Hand.png")
    foreground = Image.open("./src/assets/media/magneto/Magneto_Foreground.png")
    
    # create a new empty image with alpha, set to base image size
    new_img = Image.new('RGBA', (469,359))
    
    # Paste the base image onto the new one before edits take place
    new_img.paste(magneto, (0,0), magneto)
    new_img.paste(hand, (0,0), hand)

    pos1 = (132, 144)
    pos2 = (330, 231)

    thumbnail_size = (pos2[0]-pos1[0], pos2[1]-pos1[1])

    # determine if this is a URL
    if(urlparse(location).scheme != ""):
        response = requests.get(location)

        user_img = Image.open(BytesIO(response.content)).convert("RGBA")

        # scale image to proper dimensions for a picture
        user_img.thumbnail(thumbnail_size)

        paste_loc = (
            (int)(pos1[0] + (thumbnail_size[0] - user_img.width) / 2), 
            pos1[1]
        )

        # Simply post the new image in the right spot, adjusting for width
        new_img.paste(user_img, paste_loc, user_img)

    # Paste the overlay of the hand on top of the image
    new_img.paste(foreground, (0,0), foreground)

    # save
    new_img.save(save_name)

    print(save_name)
    return

if __name__ == '__main__':
    main()