#!/bin/ksh

# I find the errors that python spits out for malformed json are more useful than those
# from react. This is a simple script for reading parsing and printing a json file to
# validate that it's good json.

echo $1

#with open('public/games/the-original-series/empire/empire.json', 'r') as file:
python3 << EOF
import json
with open("$1", 'r') as file:
   data = json.load(file)
print(data)
EOF
