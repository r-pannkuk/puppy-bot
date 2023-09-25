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

def main():
    if(len(sys.argv) == 1 or sys.argv[1] == ''):
        print("./src/assets/media/sylphie/sylphie_original.png")
        return


    # Determine if image exists in save files
    location = sys.argv[1]
    save_folder = './saves/sylphie/'
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
    # open base image to be used as the basis for the new one
    sylphie = Image.open("./src/assets/media/sylphie/sylphie_text.png")

    # create a new empty image with alpha, set to base image size
    new_img = Image.new('RGBA', (1920,1080))
    
    # Paste the base image onto the new one before edits take place
    new_img.paste(sylphie, (0,0))

    full_string = "But I don't want to do more! I want to {}! I'm good at {}ing! You can't make me do those other things!".format(sys.argv[1], sys.argv[1])

    normal_font = ImageFont.truetype("./src/assets/fonts/calibri.ttf", 25)
    italic_font = ImageFont.truetype("./src/assets/fonts/calibrii.ttf", 25)
    font_height = normal_font.getbbox('T')[1] - normal_font.getbbox('T')[3] * 1.5

    # original offset excludes the first "But I don't want..." in order to get italicized
    true_x_offset = 549
    x_offset_want_1 = 664
    x_offset_want_2 = 865
    x_offset = 920
    y_offset = 935

    input_length = len(sys.argv[1])

    italicized_characters = [13, 14, 15, 16, 46 + input_length, 47 + input_length, 48 + input_length, 49 + input_length]

    # ImageDraw.Draw(new_img).text((true_x_offset, y_offset), 'But I don\'t ', fill=(31,26,19,240), font=font)
    # ImageDraw.Draw(new_img).text((x_offset_want_1, y_offset), 'want', fill=(31,26,19,240), font=italic_font)
    # ImageDraw.Draw(new_img).text((719, y_offset), ' to do more! I ', fill=(31,26,19,240), font=font)
    # ImageDraw.Draw(new_img).text((x_offset_want_2, y_offset), 'want', fill=(31,26,19,240), font=italic_font)

    line_count = 1

    character_count = 0

    for line in textwrap.wrap(full_string, width=80):
        # text = line
        
        # # Need to offset first line to capture the above italics
        # if line_count == 1:
        #     text = line[35:]

        # ImageDraw.Draw(new_img).text((x_offset, y_offset), text, fill=(31,26,19,240), font=font)

        # # Reseting offset to make sure the text lines up
        # x_offset = true_x_offset
        # y_offset += font_height

        # line_count += 1

        x_offset = true_x_offset

        for character in line:
            character_count += 1

            if character_count in italicized_characters:
                font = italic_font
            else:
                font = normal_font

            ImageDraw.Draw(new_img).text((x_offset, y_offset), character, fill=(31,26,19,240), font=font)

            x_offset += normal_font.getbbox(character)[2] - normal_font.getbbox(character)[0]

        y_offset -= font_height


    # save
    new_img.save(save_name)

    print(save_name)
    return

if __name__ == '__main__':
    main()