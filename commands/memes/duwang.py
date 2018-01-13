# 'WOLVERINE CRUSH' meme generator
# JS Kouri
# 8/2014
# No restrictions on use

from PIL import Image
import hashlib
import time
import urllib.request
import sys
import os.path

def main():
    
    # if(len(sys.argv) == 1 or sys.argv[1] == ''):
    #     print("./commands/memes/duwang_original.jpg");
    #     return;

    # download image from URL
    location = sys.argv[1]
    save_name = "./commands/memes/saves/" + hashlib.sha1(location.encode()).hexdigest() + ".png";

    # check for already created images
    # if(os.path.isfile(save_name)):
    #     print(save_name);
    #     return;

    # open base image and image to be superimposed:
    duwang = Image.open("./commands/memes/duwang.png")
    user_img = Image.open(urllib.request.urlretrieve(location)[0])

    # scale image to proper dimensions
    user_img.thumbnail((78,44))

    # create a new empty image with alpha, set to base image size
    new_im = Image.new('RGBA', (312,175))


    # Duwang image pasted first, second image pasted over it at the "Beautiful" line
    new_im.paste(duwang, (0,0))
    new_im.paste(user_img, (204 + (int)((78 - user_img.width) / 2),57))

    # save
    save_name = "./commands/memes/saves/test.png";
    new_im.save(save_name)

    print(save_name);
    return;

if __name__ == '__main__':
    main()