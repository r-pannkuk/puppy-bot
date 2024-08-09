#!/usr/bin/env python3

from PIL import Image, ImageFont, ImageDraw
import hashlib
from pathlib import Path
from urllib.parse import urlparse
from stat import S_ISREG, ST_CTIME, ST_MODE
import requests
from io import BytesIO
import sys
import os
import textwrap


MAX_THRESHOLD = 30
MIN_THRESHOLD = 10
MAX_TEXT_BLOCK_LENGTH = 130

# Args:
# 1. URL of the avatar
# 2. Discord user's name
# 3. Text to display

def main():
    # Determine if image exists in save files
    avatar_url = sys.argv[1]
    username = sys.argv[2]
    text = sys.argv[3]
    save_folder = "./saves/lied/"
    save_name = save_folder + hashlib.sha1(avatar_url.encode()).hexdigest() + '_' + hashlib.sha1(username.encode()).hexdigest() + '_' + hashlib.sha1(text.encode()).hexdigest() + ".png"

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
    base = Image.open("./src/assets/media/lied/Lied_Base.png")
    overlay = Image.open("./src/assets/media/lied/Lied_Overlay.png")
    
    # create a new empty image with alpha, set to base image size
    new_img = Image.new('RGBA', (700,740))
    
    # Paste the base image onto the new one before edits take place
    new_img.paste(base, (0,0), base)

    pos1 = (150, -5)

    thumbnail_size = (260, 260)

    # determine if this is a URL
    if(urlparse(avatar_url).scheme != ""):
        response = requests.get(avatar_url)

        user_img = Image.open(BytesIO(response.content)).convert("RGBA")

        # scale image to proper dimensions for a picture
        user_img.thumbnail(thumbnail_size)

        if user_img.width < thumbnail_size[0]:
            user_img = user_img.resize(thumbnail_size)

        paste_loc = (
            (int)(pos1[0] + (thumbnail_size[0] - user_img.width) / 2), 
            pos1[1]
        )

        # Simply post the new image in the right spot, adjusting for width
        new_img.paste(user_img, paste_loc, user_img)

    # Paste the overlay of the hand on top of the image
    new_img.paste(overlay, (0,0), overlay)

    # Draw the username #
    MAX_LINE = 'FFFFFFFF'
    font = ImageFont.truetype("./src/assets/fonts/animeace2_ital.ttf", 30)
    font_height = (font.getbbox('T')[1] - font.getbbox('T')[3]) * 1.25
    max_width = font.getbbox(MAX_LINE)[2] - font.getbbox(MAX_LINE)[0]

    text_start_offset = [
        53,
        395 + len(textwrap.wrap(username, width=len(MAX_LINE))) * font_height
    ]

    for line in textwrap.wrap(username, width=len(MAX_LINE)):
        line_box = font.getbbox(line)
        ImageDraw.Draw(new_img).text(
            (
                text_start_offset[0] - (line_box[2] - line_box[0]) / 2 + max_width / 2,
                text_start_offset[1]
            ), 
            line, 
            fill=(35,35,35,255), 
            font=font
        )
        text_start_offset[1] -= font_height

    # Draw the text #
    MAX_LINE = 'WWWWWWWW'

    font = ImageFont.truetype("./src/assets/fonts/animeace2_ital.ttf", 23)
    font_height = (font.getbbox('T')[1] - font.getbbox('T')[3]) * 1.5
    max_width = font.getbbox(MAX_LINE)[2] - font.getbbox(MAX_LINE)[0]

    if len(text) <= MAX_TEXT_BLOCK_LENGTH:
        text_block_1 = text
        text_block_2 = None
    else:
        split_index = text.rfind(' ', 0, MAX_TEXT_BLOCK_LENGTH)
        if split_index == -1:
            split_index = MAX_TEXT_BLOCK_LENGTH
        text_block_1 = text[:split_index].rstrip()
        text_block_2 = text[split_index:].lstrip()

      # Text Block 1 #

    text_start_offset = [
        490, 
        200 + len(textwrap.wrap(text_block_1, width=int(len(MAX_LINE) * 1.4))) * font_height / 2
    ]

    for line in textwrap.wrap(text_block_1, width=int(len(MAX_LINE) * 1.4)):
        line_box = font.getbbox(line)
        ImageDraw.Draw(new_img).text(
            (
                text_start_offset[0] - (line_box[2] - line_box[0]) / 2 + max_width / 2,
                text_start_offset[1]
            ), 
            line, 
            fill=(0,0,0,255), 
            font=font
        )
        text_start_offset[1] -= font_height
    
    # Text Block 2 #
    MAX_LINE = 'WWWWWWW'

    if text_block_2 is not None:
        text_start_offset = [
            310, 
            375 + len(textwrap.wrap(text_block_2, width=int(len(MAX_LINE) * 1.5))) * font_height / 2
        ]

        for line in textwrap.wrap(text_block_2, width=int(len(MAX_LINE) * 1.5)):
            line_box = font.getbbox(line)
            ImageDraw.Draw(new_img).text(
                (
                    text_start_offset[0] - (line_box[2] - line_box[0]) / 2 + max_width / 2,
                    text_start_offset[1]
                ), 
                line, 
                fill=(0,0,0,255), 
                font=font
            )
            text_start_offset[1] -= font_height

    # save
    new_img.save(save_name)

    print(save_name)
    return

if __name__ == '__main__':
    main()