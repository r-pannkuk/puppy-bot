from PIL import Image, ImageDraw, ImageFont
import hashlib
import time
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

            x_offset += font.getsize(character)[0]

        y_offset += font_height


def main():
    # if(len(sys.argv) == 1 or sys.argv[1] == ''):
    #     print("./commands/memes/media/kinzo/kinzo_original.png")
    #     return


    # Determine if image exists in save files
    location = sys.argv[1] + sys.argv[2]
    save_name = "./commands/memes/saves/kinzo/" + hashlib.sha1(location.encode()).hexdigest() + ".png"

    # check for already created images
    if(os.path.isfile(save_name)):
        print(save_name)
        return
    
    if(len(os.listdir("./commands/memes/saves/kinzo")) >= MAX_THRESHOLD):
        files = (os.path.join("./commands/memes/saves/kinzo/", fn) for fn in os.listdir("./commands/memes/saves/kinzo/"))
        files = ((os.stat(path), path) for path in files)
        files = ((stat[ST_CTIME], path) for stat, path in files if S_ISREG(stat[ST_MODE]))

        sorted_files = sorted(files)
        sorted_files.reverse()

        # remove oldest files
        for cdate, path in sorted_files[MIN_THRESHOLD-1:]:
            os.remove(path)

    base_filename = "./commands/memes/media/kinzo/Kinzo_Template.png"

    if len(sys.argv[1]) > 16:
        base_filename = "./commands/memes/media/kinzo/Kinzo_Template_Long.png"

    # open base image to be used as the basis for the new one
    kinzo = Image.open(base_filename)

    # create a new empty image with alpha, set to base image size
    new_img = Image.new('RGBA', (800,450))
    
    # Paste the base image onto the new one before edits take place
    new_img.paste(kinzo, (0,0))

    font = ImageFont.truetype("./commands/memes/fonts/sazanami-gothic.ttf", 20)
    font_height = font.getsize('T')[1] * 1.5

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