#!/usr/bin/env python3

from PIL import Image
import hashlib
from pathlib import Path
from urllib.parse import urlparse
from stat import S_ISREG, ST_CTIME, ST_MODE
import requests
from io import BytesIO
import sys
import os

MAX_THRESHOLD = 30
MIN_THRESHOLD = 10

# Args:
# 1. URL of the avatar
# 2. Discord user's name
# 3. Text to display

def main():
    print(sys.argv)

    # Determine if image exists in save files
    location = sys.argv[1]
    save_folder = "./saves/lied/"
    save_name = save_folder + hashlib.sha1(location.encode()).hexdigest() + ".png"

    # check for already created images
    # if(os.path.isfile(save_name)):
    #     print(save_name)
    #     return
    
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
    base = Image.open("./src/assets/media/lied/Lied_Base.png")
    overlay = Image.open("./src/assets/media/lied/Lied_Overlay.png")
    
    # create a new empty image with alpha, set to base image size
    new_img = Image.new('RGBA', (700,740))
    
    # Paste the base image onto the new one before edits take place
    new_img.paste(base, (0,0), base)

    pos1 = (150, -5)

    thumbnail_size = (260, 260)

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
    new_img.paste(overlay, (0,0), overlay)

    # save
    new_img.save(save_name)

    print(save_name)
    return

if __name__ == '__main__':
    main()