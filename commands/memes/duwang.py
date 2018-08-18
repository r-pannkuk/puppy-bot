from PIL import Image, ImageFont, ImageDraw
import hashlib
import time
import urllib.request
import urllib
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
        print("./commands/memes/duwang_original.jpg")
        return


    # Determine if image exists in save files
    location = sys.argv[1]
    save_name = "./commands/memes/saves/duwang/" + hashlib.sha1(location.encode()).hexdigest() + ".png"

    # check for already created images
    if(os.path.isfile(save_name)):
        print(save_name)
        return
    
    if(len(os.listdir("./commands/memes/saves/duwang")) >= MAX_THRESHOLD):
        files = (os.path.join("./commands/memes/saves/duwang/", fn) for fn in os.listdir("./commands/memes/saves/duwang/"))
        files = ((os.stat(path), path) for path in files)
        files = ((stat[ST_CTIME], path) for stat, path in files if S_ISREG(stat[ST_MODE]))

        sorted_files = sorted(files)
        sorted_files.reverse()

        # remove oldest files
        for cdate, path in sorted_files[MIN_THRESHOLD-1:]:
            os.remove(path)

    # open base image to be used as the basis for the new one
    duwang = Image.open("./commands/memes/duwang_text.png")
    
    # create a new empty image with alpha, set to base image size
    new_img = Image.new('RGBA', (312,175))
    
    # Paste the base image onto the new one before edits take place
    new_img.paste(duwang, (0,0))

    # determine if this is a URL
    if(urllib.parse.urlparse(location).scheme != ""):
        
        font = ImageFont.truetype("./commands/memes/animeace2_ital.ttf", 13)
        font_height = font.getsize('T')[1] + 4
        max_width = font.getsize('WWWWWWWWWW')[0]

        user_img = Image.open(urllib.request.urlretrieve(location)[0])

        # scale image to proper dimensions for a picture
        user_img.thumbnail((78,44))

        # Simply post the new image in the right spot, adjusting for width
        new_img.paste(user_img, (204 + (int)((78 - user_img.width) / 2),57), user_img)

        ImageDraw.Draw(new_img).text((214, 20), "What a", fill=(0,0,0,255), font=font)
        ImageDraw.Draw(new_img).text((206, 34), "beautiful", fill=(0,0,0,255), font=font)

    # otherwise use text
    else:
        font = ImageFont.truetype("./commands/memes/animeace2_ital.ttf", 13)
        font_height = font.getsize('T')[1] + 4
        max_width = font.getsize('WWWWWWWWWW')[0]

        offset = 5 + (int)((110 - (len(textwrap.wrap(sys.argv[1], width=9))*font_height))/2)

        for line in textwrap.wrap(sys.argv[1], width=9):
            ImageDraw.Draw(new_img).text((185 + (int)((max_width - font.getsize(line)[0])/2), offset), line, fill=(0,0,0,255), font=font)
            offset += font_height

    # save
    new_img.save(save_name)

    print(save_name)
    return

if __name__ == '__main__':
    main()