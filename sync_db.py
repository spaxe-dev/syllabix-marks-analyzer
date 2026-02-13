import os
import json
import psycopg2
from datetime import datetime

# Path to output
OUTPUT_FILE = os.path.join("frontend", "public", "data", "index.json")

def sync_db_to_static():
    db_url = os.environ.get('DATABASE_URL')
    if not db_url:
        print("❌ No DATABASE_URL found. Skipping sync.")
        return

    try:
        print("🔌 Connecting to Database...")
        conn = psycopg2.connect(db_url, sslmode='require')
        cur = conn.cursor()
        
        # Fetch latest results
        print("📥 Fetching results...")
        cur.execute("""
            SELECT hash, meta, data->'statistics' 
            FROM results 
            ORDER BY created_at DESC
        """)
        rows = cur.fetchall()
        cur.close()
        conn.close()

        index_list = []
        for r in rows:
            h, meta, stats = r
            if not meta: meta = {}
            if not stats: stats = {}
            
            # Ensure proper types
            if isinstance(meta, str): meta = json.loads(meta)
            if isinstance(stats, str): stats = json.loads(stats)

            index_list.append({
                'hash': h,
                'filename': meta.get('filename', 'Unknown'),
                'timestamp': meta.get('timestamp', 0),
                'student_count': stats.get('total_students', 0),
                'college_count': len(stats.get('college_statistics', {})),
                'program': meta.get('program'),
                'semester': meta.get('semester'),
                'scheme': meta.get('scheme'),
                'examination': meta.get('examination')
            })

        # Write to index.json
        os.makedirs(os.path.dirname(OUTPUT_FILE), exist_ok=True)
        with open(OUTPUT_FILE, 'w', encoding='utf-8') as f:
            json.dump(index_list, f, ensure_ascii=False, indent=2)
        
        print(f"✅ Successfully synced {len(index_list)} results to {OUTPUT_FILE}")

    except Exception as e:
        print(f"❌ Sync failed: {e}")
        exit(1)

if __name__ == "__main__":
    sync_db_to_static()
