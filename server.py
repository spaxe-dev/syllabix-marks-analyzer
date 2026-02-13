"""
Flask Server for University Result Analysis
Provides API endpoints for PDF parsing and result analysis
"""

from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
from werkzeug.utils import secure_filename
import os
import tempfile
import json
from parse_results import parse_pdf
import traceback
import hashlib
import time
from datetime import datetime

# --- DATABASE / STORAGE MANAGER ---
class StorageManager:
    def __init__(self, app):
        self.app = app
        self.mode = 'file'
        self.conn = None
        
        # Check for DATABASE_URL env var (Render/Heroku/etc)
        self.db_url = os.environ.get('DATABASE_URL')
        if self.db_url:
            try:
                import psycopg2
                from urllib.parse import urlparse
                
                # Check if it needs SSL (render requires it often)
                self.conn = psycopg2.connect(self.db_url, sslmode='require')
                self.mode = 'db'
                print("✅ Connected to PostgreSQL Database")
                self._init_db()
            except Exception as e:
                print(f"⚠️  Database connection failed ({str(e)}). Falling back to file storage.")
                self.mode = 'file'
        else:
            print("ℹ️  No DATABASE_URL found. Using local file storage.")

    def _init_db(self):
        """Create table if not exists"""
        try:
            cur = self.conn.cursor()
            cur.execute("""
                CREATE TABLE IF NOT EXISTS results (
                    hash TEXT PRIMARY KEY,
                    filename TEXT,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    meta JSONB,
                    data JSONB
                );
            """)
            self.conn.commit()
            cur.close()
        except Exception as e:
            print(f"❌ Failed to init DB schema: {e}")
            self.conn.rollback()

    def save(self, file_hash, result_data):
        if self.mode == 'db':
            try:
                import json
                cur = self.conn.cursor()
                meta = result_data.get('meta', {})
                timestamp = datetime.fromtimestamp(meta.get('timestamp', time.time()))
                
                # Upsert (Insert or Do Nothing if exists)
                cur.execute("""
                    INSERT INTO results (hash, filename, created_at, meta, data)
                    VALUES (%s, %s, %s, %s, %s)
                    ON CONFLICT (hash) DO UPDATE 
                    SET meta = EXCLUDED.meta, data = EXCLUDED.data;
                """, (
                    file_hash, 
                    meta.get('filename', 'Unknown'), 
                    timestamp,
                    json.dumps(meta), 
                    json.dumps(result_data)
                ))
                self.conn.commit()
                cur.close()
                return True
            except Exception as e:
                print(f"❌ DB Save Error: {e}")
                self.conn.rollback()
                return False
        else:
            # File Mode
            try:
                cache_dir = os.path.join(self.app.root_path, 'cache')
                os.makedirs(cache_dir, exist_ok=True)
                cache_path = os.path.join(cache_dir, f"{file_hash}.json")
                with open(cache_path, 'w', encoding='utf-8') as f:
                    json.dump(result_data, f, ensure_ascii=False)
                return True
            except Exception as e:
                print(f"❌ File Save Error: {e}")
                return False

    def get(self, file_hash):
        if self.mode == 'db':
            try:
                cur = self.conn.cursor()
                cur.execute("SELECT data FROM results WHERE hash = %s", (file_hash,))
                row = cur.fetchone()
                cur.close()
                if row:
                    return row[0] # data column is already dict/json
                return None
            except Exception as e:
                print(f"❌ DB Get Error: {e}")
                self.conn.rollback()
                return None
        else:
            # File Mode
            cache_path = os.path.join(self.app.root_path, 'cache', f"{file_hash}.json")
            if os.path.exists(cache_path):
                with open(cache_path, 'r', encoding='utf-8') as f:
                    return json.load(f)
            return None

    def list(self):
        results = []
        if self.mode == 'db':
            try:
                cur = self.conn.cursor()
                # Fetch meta and calculate stats from it
                cur.execute("SELECT hash, meta FROM results ORDER BY created_at DESC")
                rows = cur.fetchall()
                cur.close()
                # Better query:
                cur = self.conn.cursor()
                cur.execute("""
                    SELECT hash, meta, data->'statistics' as stats 
                    FROM results 
                    ORDER BY created_at DESC
                """)
                rows = cur.fetchall()
                cur.close()
                
                for r in rows:
                    h, meta, stats = r
                    if not meta: meta = {}
                    if not stats: stats = {}
                    
                    results.append({
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
                return results

            except Exception as e:
                print(f"❌ DB List Error: {e}")
                self.conn.rollback()
                return []
        else:
            # File Mode
            cache_dir = os.path.join(self.app.root_path, 'cache')
            if not os.path.exists(cache_dir):
                return []
            
            for filename in os.listdir(cache_dir):
                if not filename.endswith('.json'): continue
                try:
                    filepath = os.path.join(cache_dir, filename)
                    with open(filepath, 'r', encoding='utf-8') as f:
                        data = json.load(f)
                        meta = data.get('meta', {})
                        stats = data.get('statistics', {})
                        exam = data.get('exam_info', {})
                        
                        if not meta:
                            meta = {'filename': 'Unknown', 'timestamp': os.path.getmtime(filepath), 'hash': filename.replace('.json', '')}
                        
                        if 'program' not in meta:
                            meta['program'] = exam.get('program', 'Unknown')
                            meta['semester'] = exam.get('semester', '')

                        results.append({
                            'hash': meta.get('hash', filename.replace('.json', '')),
                            'filename': meta.get('filename', 'Unknown'),
                            'timestamp': meta.get('timestamp', 0),
                            'student_count': stats.get('total_students', 0),
                            'college_count': len(stats.get('college_statistics', {})),
                            'program': meta.get('program'),
                            'semester': meta.get('semester'),
                            'scheme': meta.get('scheme'),
                            'examination': meta.get('examination')
                        })
                except: pass
            
            results.sort(key=lambda x: x['timestamp'], reverse=True)
            return results

app = Flask(__name__, static_folder='frontend/dist/assets', static_url_path='/assets')
CORS(app)

storage = StorageManager(app)

# Configure upload settings
UPLOAD_FOLDER = tempfile.gettempdir()
ALLOWED_EXTENSIONS = {'pdf'}

app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER
app.config['MAX_CONTENT_LENGTH'] = 16 * 1024 * 1024  # 16MB max file size

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

@app.route('/')
def index():
    return send_from_directory('frontend/dist', 'index.html')

@app.route('/<path:path>')
def serve_static(path):
    # Check if file exists in frontend/dist
    if os.path.exists(os.path.join('frontend/dist', path)):
        return send_from_directory('frontend/dist', path)
    # Otherwise return index.html for React Router
    return send_from_directory('frontend/dist', 'index.html')

@app.route('/api/parse', methods=['POST'])
def parse_result_pdf():
    """Parse uploaded PDF and return structured data"""
    try:
        # Password Check
        required_password = os.environ.get('UPLOAD_PASSWORD', 'syllabix')
        provided_password = request.headers.get('X-Upload-Password')
        
        if provided_password != required_password:
             return jsonify({'error': 'Invalid Access Password'}), 401

        if 'file' not in request.files:
            return jsonify({'error': 'No file provided'}), 400
        
        file = request.files['file']
        
        if file.filename == '':
            return jsonify({'error': 'No file selected'}), 400
        
        if not allowed_file(file.filename):
            return jsonify({'error': 'Invalid file type. Only PDF files are allowed'}), 400
        
        # Calculate file hash for caching
        import hashlib
        import time
        file_content = file.read()
        file_hash = hashlib.sha256(file_content).hexdigest()
        
        if not allowed_file(file.filename):
            return jsonify({'error': 'Invalid file type. Only PDF files are allowed'}), 400
        
        # Calculate file hash for caching
        file_content = file.read()
        file_hash = hashlib.sha256(file_content).hexdigest()
        
        # Check cache via StorageManager
        cached_result = storage.get(file_hash)
        if cached_result:
            print(f"Cache hit for {file.filename} ({file_hash})")
            return jsonify(cached_result)
        
        # Reset file pointer for saving
        file.seek(0)
        
        # Save file temporarily
        filename = secure_filename(file.filename)
        filepath = os.path.join(app.config['UPLOAD_FOLDER'], filename)
        file.save(filepath)
        
        try:
            # Parse the PDF
            result = parse_pdf(filepath)
            
            # Add metadata for cache listing
            exam_info = result.get('exam_info', {})
            result['meta'] = {
                'filename': file.filename,
                'timestamp': time.time(),
                'hash': file_hash,
                'program': exam_info.get('program', 'Unknown Program'),
                'semester': exam_info.get('semester', ''),
                'scheme': exam_info.get('scheme', ''),
                'examination': exam_info.get('examination', '')
            }
            
            # Save via StorageManager
            if storage.save(file_hash, result):
                return jsonify(result)
            else:
                return jsonify(result) # Return anyway even if save failed
                
        finally:
            # Clean up uploaded file
            if os.path.exists(filepath):
                os.remove(filepath)
                
    except Exception as e:
        traceback.print_exc()
        return jsonify({'error': str(e)}), 500

@app.route('/api/cache', methods=['GET'])
def get_cached_results():
    """List available cached results"""
    return jsonify(storage.list())

@app.route('/api/results/<file_hash>', methods=['GET'])
def get_single_result(file_hash):
    """Get a specific result by hash"""
    result = storage.get(file_hash)
    if result:
        return jsonify(result)
    return jsonify({'error': 'Result not found'}), 404

@app.route('/api/analyze-student/<seat_no>', methods=['POST'])
def analyze_student(seat_no):
    """Analyze a specific student compared to others"""
    try:
        data = request.get_json()
        students = data.get('students', [])
        
        # Find the target student
        target = None
        for student in students:
            if student['seat_no'] == seat_no:
                target = student
                break
        
        if not target:
            return jsonify({'error': f'Student with seat number {seat_no} not found'}), 404
        
        # Calculate percentile for total marks
        all_marks = sorted([s['total_marks'] for s in students])
        target_marks = target['total_marks']
        rank = len([m for m in all_marks if m < target_marks]) + 1
        percentile = (len([m for m in all_marks if m < target_marks]) / len(all_marks)) * 100
        
        # Calculate subject-wise comparison
        subject_comparison = []
        for i, subject in enumerate(target['subjects']):
            # Get all marks for this subject
            subject_marks = []
            for s in students:
                if i < len(s['subjects']) and s['subjects'][i]['total'] is not None:
                    subject_marks.append(s['subjects'][i]['total'])
            
            if subject['total'] is not None and subject_marks:
                avg_marks = sum(subject_marks) / len(subject_marks)
                max_marks = max(subject_marks)
                min_marks = min(subject_marks)
                subject_rank = len([m for m in subject_marks if m > subject['total']]) + 1
                
                subject_comparison.append({
                    'code': subject['code'],
                    'name': subject['name'],
                    'marks': subject['total'],
                    'grade': subject['grade'],
                    'passed': subject['passed'],
                    'class_avg': round(avg_marks, 1),
                    'class_max': max_marks,
                    'class_min': min_marks,
                    'rank': subject_rank,
                    'total_students': len(subject_marks)
                })
            else:
                # Include subjects without total — show available component data
                subject_comparison.append({
                    'code': subject['code'],
                    'name': subject['name'],
                    'marks': subject['total'],
                    'grade': subject.get('grade'),
                    'passed': subject.get('passed'),
                    'class_avg': None,
                    'class_max': None,
                    'class_min': None,
                    'rank': None,
                    'total_students': len(subject_marks) if subject_marks else None
                })
        
        return jsonify({
            'student': target,
            'analysis': {
                'overall_rank': len(all_marks) - rank + 1,
                'total_students': len(students),
                'percentile': round(percentile, 1),
                'subject_comparison': subject_comparison
            }
        })
        
    except Exception as e:
        traceback.print_exc()
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    print("Starting Result Analysis Server...")
    print("Open http://localhost:5000 in your browser")
    app.run(debug=True, port=5000)
