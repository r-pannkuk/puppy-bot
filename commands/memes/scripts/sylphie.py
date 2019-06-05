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

def main():
    if(len(sys.argv) == 1 or sys.argv[1] == ''):
        print("./commands/memes/templates/sylphie_original.png")
        return


    # Determine if image exists in save files
    location = sys.argv[1]
    save_name = "./commands/memes/saves/sylphie/" + hashlib.sha1(location.encode()).hexdigest() + ".png"

    # check for already created images
    if(os.path.isfile(save_name)):
        print(save_name)
        return
    
    if(len(os.listdir("./commands/memes/saves/sylphie")) >= MAX_THRESHOLD):
        files = (os.path.join("./commands/memes/saves/sylphie/", fn) for fn in os.listdir("./commands/memes/saves/sylphie/"))
        files = ((os.stat(path), path) for path in files)
        files = ((stat[ST_CTIME], path) for stat, path in files if S_ISREG(stat[ST_MODE]))

        sorted_files = sorted(files)
        sorted_files.reverse()

        # remove oldest files
        for cdate, path in sorted_files[MIN_THRESHOLD-1:]:
            os.remove(path)

    # open base image to be used as the basis for the new one
    sylphie = Image.open("./commands/memes/templates/sylphie_text.png")
    
    # create a new empty image with alpha, set to base image size
    new_img = Image.new('RGBA', (1920,1080))
    
    # Paste the base image onto the new one before edits take place
    new_img.paste(sylphie, (0,0))

    full_string = "But I don't want to do more! I want to {}! I'm good at {}ing! You can't make me do those other things!".format(sys.argv[1], sys.argv[1])

    font = ImageFont.truetype("./commands/memes/fonts/calibri.ttf", 25)
    italic_font = ImageFont.truetype("./commands/memes/fonts/calibrii.ttf", 25)
    font_height = font.getsize('T')[1] * 1.5
    max_width = font.getsize('But I don\'t want to heal! I ant to do those other things! You can\'t make me')[0]

    # original offset excludes the first "But I don't want..." in order to get italicized
    true_x_offset = 549
    italics_x_offset = 664
    x_offset = 723
    y_offset = 935

    ImageDraw.Draw(new_img).text((true_x_offset, y_offset), 'But I don\'t ', fill=(31,26,19,240), font=font)
    ImageDraw.Draw(new_img).text((italics_x_offset, y_offset), 'want', fill=(31,26,19,240), font=italic_font)

    line_count = 1

    for line in textwrap.wrap(full_string, width=80):
        text = line
        
        # Need to offset first line to capture the above italics
        if line_count == 1:
            text = line[17:]

        ImageDraw.Draw(new_img).text((x_offset, y_offset), text, fill=(31,26,19,240), font=font)

        # Reseting offset to make sure the text lines up
        x_offset = true_x_offset
        y_offset += font_height

        line_count += 1


    # save
    new_img.save(save_name)

    print(save_name)
    return

if __name__ == '__main__':
    main()