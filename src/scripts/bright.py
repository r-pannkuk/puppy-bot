#!/usr/bin/env python3

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
    # if(len(sys.argv) == 1 or sys.argv[1] == ''):
    #     print('./src/assets/media/bright/bright_Background.png')
    #     return

    # Determine if image exists in save files
    location = sys.argv[1]
    save_folder = './saves/bright/'
    save_name = save_folder + hashlib.sha1(location.encode()).hexdigest() + '.gif'


    # check for already created images
    if(os.path.isfile(save_name)):
        print(save_name)
        return
    
    if(not os.path.isdir(save_folder)):
        Path(save_folder).mkdir(parents=True, exist_ok=True)

    if(len(os.listdir(save_folder)) >= MAX_THRESHOLD):
        files = (os.path.join(save_folder, fn)
                 for fn in os.listdir(save_folder))
        files = ((os.stat(path), path) for path in files)
        files = ((stat[ST_CTIME], path)
                 for stat, path in files if S_ISREG(stat[ST_MODE]))

        sorted_files = sorted(files)
        sorted_files.reverse()

        # remove oldest files
        for cdate, path in sorted_files[MIN_THRESHOLD-1:]:
            os.remove(path)

    # open base images to be used as the layers for the new image
    brights = [
        {
            'source': Image.open('./src/assets/media/bright/Bright_0.png'),
            'mask': None,
            'position': (204, 20),
            'size': (205, 205),
        },
        {
            'source': Image.open('./src/assets/media/bright/Bright_1.png'),
            'mask': None,
            'position': (213, 20),
            'size': (209, 209),
        },
        {
            'source': Image.open('./src/assets/media/bright/Bright_2.png'),
            'mask': None,
            'position': (215, 20),
            'size': (225, 225)
        },
        {
            'source': Image.open('./src/assets/media/bright/Bright_3.png'),
            'mask': None,
            'position': (222, 20),
            'size': (225, 225)
        },
        {
            'source': Image.open('./src/assets/media/bright/Bright_4.png'),
            'mask': None,
            'position': (222, 25),
            'size': (225, 225)
        },
        {
            'source': Image.open('./src/assets/media/bright/Bright_5.png'),
            'mask': None,
            'position': (224, 25),
            'size': (225, 225)
        },
        {
            'source': Image.open('./src/assets/media/bright/Bright_6.png'),
            'mask': None,
            'position': (221, 30),
            'size': (225, 225)
        },
        {
            'source': Image.open('./src/assets/media/bright/Bright_7.png'),
            'mask': None,
            'position': (222, 35),
            'size': (225, 225)
        },
        {
            'source': Image.open('./src/assets/media/bright/Bright_8.png'),
            'mask': None,
            'position': (222, 35),
            'size': (225, 225)
        },
        {
            'source': Image.open('./src/assets/media/bright/Bright_9.png'),
            'mask': Image.open('./src/assets/media/bright/Bright_9_mask.png'),
            'position': (222, 35),
            'size': (225, 225)
        },
        {
            'source': Image.open('./src/assets/media/bright/Bright_10.png'),
            'mask': Image.open('./src/assets/media/bright/Bright_10_mask.png'),
            'position': (26, 52),
            'size': (204, 204)
        },
        {
            'source': Image.open('./src/assets/media/bright/Bright_11.png'),
            'mask': Image.open('./src/assets/media/bright/Bright_11_mask.png'),
            'position': (0, 38),
            'size': (193, 193)
        },
        {
            'source': Image.open('./src/assets/media/bright/Bright_12.png'),
            'mask': None,
            'position': (-171, 55),
            'size': (188, 188)
        },
        {
            'source': Image.open('./src/assets/media/bright/Bright_13.png'),
            'mask': None,
            'position': (0, 0),
            'size': (0, 0)
        },
        {
            'source': Image.open('./src/assets/media/bright/Bright_14.png'),
            'mask': None,
            'position': (0, 0),
            'size': (0, 0)
        },
        {
            'source': Image.open('./src/assets/media/bright/Bright_15.png'),
            'mask': None,
            'position': (0, 0),
            'size': (0, 0)
        }

    ]

    user_img = None
    animation_frames = []

    # determine if this is a URL
    if(urlparse(location).scheme != ''):
        response = requests.get(location)

        user_img = Image.open(BytesIO(response.content)).convert('RGBA')

    for bright in brights:
        # create a new empty image with alpha, set to base image size
        new_img = Image.new('RGBA', (498, 373))

        # paste the initial base image on the frame
        new_img.paste(bright["source"], (0, 0), bright["source"])

        if user_img != None and bright["size"] != (0, 0):
            # copy of user image and frame for manipulation
            user_img_copy = user_img
            frame_copy = new_img

            # scaling user image to fit mask
            user_img.thumbnail(bright["size"])

            # paste the user image onto the temporary frame
            frame_copy.paste(user_img, (
                (int)(bright["position"][0] +
                      (bright["size"][0] - user_img.size[0])/2),
                (int)(bright["position"][1] +
                      (bright["size"][1] - user_img.size[1])/2)
            ), user_img)

            # mask the frame onto the original to get it to fit correctly
            new_img.paste(frame_copy, (0, 0), mask=bright["mask"])

        # add frame to the animation frames list
        animation_frames.append(new_img)

    # adding 5 additional frames at the end
    for i in range(1, 8):
        animation_frames.append(animation_frames[len(animation_frames) - 1])

    # exporting gif
    animation_frames[0].save(save_name,
                             save_all=True, append_images=animation_frames[1:], optimize=False, duration=60, loop=0)

    print(save_name)
    return


if __name__ == '__main__':
    main()
