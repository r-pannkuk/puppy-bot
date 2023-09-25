#!/usr/bin/env python3

from PIL import Image, ImageDraw, ImageFont
import hashlib
import time
from pathlib import Path
from urllib.parse import urlparse
from urllib.request import urlretrieve
from stat import S_ISREG, ST_CTIME, ST_MODE
import sys
import os
import time
import re
import textwrap

MAX_THRESHOLD = 30
MIN_THRESHOLD = 10

def drawText(new_img, full_string, original_x_offset, character_count, y_offset, font, font_height):
    for line in textwrap.wrap(full_string, width=60):

        x_offset = original_x_offset

        for character in line:
            character_count += 1

            draw = ImageDraw.Draw(new_img)

            # Outline
            draw.text((x_offset-1, y_offset), character, fill=(0,0,0,255), font=font)
            draw.text((x_offset+1, y_offset), character, fill=(0,0,0,255), font=font)
            draw.text((x_offset, y_offset-1), character, fill=(0,0,0,255), font=font)
            draw.text((x_offset, y_offset+1), character, fill=(0,0,0,255), font=font)

            # Text
            draw.text((x_offset, y_offset), character, fill=(255,255,255,255), font=font)

            x_offset += font.getbbox(character)[2] - font.getbbox(character)[0]

        y_offset -= font_height


def main():
    # if(len(sys.argv) == 1 or sys.argv[1] == ''):
    #     print("./media/kinzo/kinzo_original.png")
    #     return


    # Determine if image exists in save files
    location = sys.argv[1] + sys.argv[2]
    save_folder = "./saves/kinzo/"
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

    base_filename = "./src/assets/media/kinzo/Kinzo_Template.png"

    if len(sys.argv[1]) > 16:
        base_filename = "./src/assets/media/kinzo/Kinzo_Template_Long.png"

    # open base image to be used as the basis for the new one
    kinzo = Image.open(base_filename)

    # create a new empty image with alpha, set to base image size
    new_img = Image.new('RGBA', (800,450))
    
    # Paste the base image onto the new one before edits take place
    new_img.paste(kinzo, (0,0))

    font = ImageFont.truetype("./src/assets/fonts/sazanami-gothic.ttf", 20)
    font_height = (font.getbbox('T')[1] - font.getbbox('T')[3]) * 1.5

    # Message Author
    original_x_offset = 60
    y_offset = 273

    full_string = sys.argv[1]

    input_length = len(full_string)

    line_count = 1

    character_count = 0

    drawText(new_img, full_string, original_x_offset, character_count, y_offset, font, font_height)


    # Message Body
    original_x_offset = 60
    y_offset = 307

    full_string = sys.argv[2]

    input_length = len(full_string)

    line_count = 1

    character_count = 0

    drawText(new_img, full_string, original_x_offset, character_count, y_offset, font, font_height)

    # save
    new_img.save(save_name)

    print(save_name)
    return

if __name__ == '__main__':
    main()