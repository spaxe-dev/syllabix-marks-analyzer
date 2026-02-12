
import os
import json
import shutil
from pathlib import Path

CACHE_DIR = "cache"
PUBLIC_DATA_DIR = "frontend/public/data"

def generate_static_cache():
    if not os.path.exists(CACHE_DIR):
        print("No cache directory found.")
        return

    os.makedirs(PUBLIC_DATA_DIR, exist_ok=True)
    
    index = []
    
    for filename in os.listdir(CACHE_DIR):
        if not filename.endswith('.json'):
            continue
            
        src_path = os.path.join(CACHE_DIR, filename)
        dst_path = os.path.join(PUBLIC_DATA_DIR, filename)
        
        try:
            with open(src_path, 'r', encoding='utf-8') as f:
                data = json.load(f)
                
            meta = data.get('meta', {})
            stats = data.get('statistics', {})
            
            # Fallback metadata
            if not meta:
                meta = {
                    'filename': 'Unknown Result File',
                    'timestamp': os.path.getmtime(src_path),
                    'hash': filename.replace('.json', '')
                }
            
            entry = {
                'hash': meta.get('hash', filename.replace('.json', '')),
                'filename': meta.get('filename', 'Unknown'),
                'timestamp': meta.get('timestamp', 0),
                'student_count': stats.get('total_students', 0),
                'college_count': len(stats.get('college_statistics', {}))
            }
            index.append(entry)
            
            # Copy file to public/data
            shutil.copy2(src_path, dst_path)
            print(f"Copied {filename} to public/data")
            
        except Exception as e:
            print(f"Error processing {filename}: {e}")
            
    # Sort index by timestamp desc
    index.sort(key=lambda x: x['timestamp'], reverse=True)
    
    # Save index.json
    index_path = os.path.join(PUBLIC_DATA_DIR, "index.json")
    with open(index_path, 'w', encoding='utf-8') as f:
        json.dump(index, f, indent=2)
        
    print(f"Generated index.json with {len(index)} entries.")

if __name__ == "__main__":
    generate_static_cache()
