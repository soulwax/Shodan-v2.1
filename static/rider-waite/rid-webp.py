#!/usr/bin/env python3
# File: static/rider-waite/rid-webp.py
import * as sys
import os

def remove_webp_extension(folder_path, file_ending='.webp'):
    # Iterate through all files in the folder
    for filename in os.listdir(folder_path):
        if filename.endswith('.webp'):
            # Get the old file path
            old_file = os.path.join(folder_path, filename)
            # Create new filename without .webp
            new_filename = filename[:-5]  # Remove last 5 characters ('.webp')
            # Get the new file path
            new_file = os.path.join(folder_path, new_filename)
            
            try:
                # Rename the file
                os.rename(old_file, new_file)
                print(f'Renamed: {filename} → {new_filename}')
            except Exception as e:
                print(f'Error renaming {filename}: {str(e)}')

# Use the function
folder_path = '<path>'  # Replace with your folder path
remove_webp_extension(folder_path)


if __name__ == '__main__':
    # arg1 contains the path to the folder
    folder_path = sys.argv[1]
    # optional arg2 contains the file ending
    file_ending = sys.argv[2] if len(sys.argv) > 2 else '.webp'
    file_ending = file_ending if file_ending.startswith('.') else '.' + file_ending
    remove_webp_extension(folder_path, file_ending)