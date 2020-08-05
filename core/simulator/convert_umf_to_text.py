#!/usr/bin/env python3
# Usage:
#  PYTHONPATH=src ./convert_umf_to_text.py <json_source> <text_file>

import json
import csv
import argparse

parser = argparse.ArgumentParser(
    description='Convert JSON files to text for encoding / chatbot conversion.',
    formatter_class=argparse.ArgumentDefaultsHelpFormatter)
parser.add_argument('in_json', metavar='PATH',
                    type=str, help='Input file (JSON).')
parser.add_argument('out_csv', metavar='PATH',
                    type=str, help='Output file (csv).')


def main():
    args = parser.parse_args()
    print('Reading files')
    with open(args.in_json, mode='rt', encoding="utf8") as i:
        data = json.load(i)
        data = [(*data["_channelData"].values())]
        data = [c["_data"] for c in data]
        data = [message for sublist in data for message in sublist]
        data = [message for message in data if len(message) > 35]
        data.sort(key=lambda m: len(m))

    print('Writing...', )
    with open(args.out_csv, mode='wt', encoding='utf8', newline='') as o:
        writer = csv.writer(o)
        for message in data:
            writer.writerow([message])

if __name__ == '__main__':
    main()
