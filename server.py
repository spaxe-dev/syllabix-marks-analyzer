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

app = Flask(__name__, static_folder='.', static_url_path='')
CORS(app)

# Configure upload settings
UPLOAD_FOLDER = tempfile.gettempdir()
ALLOWED_EXTENSIONS = {'pdf'}

app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER
app.config['MAX_CONTENT_LENGTH'] = 16 * 1024 * 1024  # 16MB max file size

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

@app.route('/')
def index():
    return send_from_directory('.', 'index.html')

@app.route('/api/parse', methods=['POST'])
def parse_result_pdf():
    """Parse uploaded PDF and return structured data"""
    try:
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
        
        # Check cache
        cache_dir = os.path.join(app.root_path, 'cache')
        os.makedirs(cache_dir, exist_ok=True)
        cache_path = os.path.join(cache_dir, f"{file_hash}.json")
        
        if os.path.exists(cache_path):
            print(f"Cache hit for {file.filename} ({file_hash})")
            with open(cache_path, 'r', encoding='utf-8') as f:
                return jsonify(json.load(f))
        
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
            result['meta'] = {
                'filename': file.filename,
                'timestamp': time.time(),
                'hash': file_hash
            }
            
            # Save to cache
            with open(cache_path, 'w', encoding='utf-8') as f:
                json.dump(result, f, ensure_ascii=False)
                
            return jsonify(result)
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
    try:
        cache_dir = os.path.join(app.root_path, 'cache')
        if not os.path.exists(cache_dir):
            return jsonify([])
        
        results = []
        for filename in os.listdir(cache_dir):
            if not filename.endswith('.json'):
                continue
                
            try:
                filepath = os.path.join(cache_dir, filename)
                with open(filepath, 'r', encoding='utf-8') as f:
                    # Read only the beginning to get metadata if possible, 
                    # but since it's JSON we might need to load it. 
                    # For small number of files, loading is fine.
                    data = json.load(f)
                    
                    meta = data.get('meta', {})
                    stats = data.get('statistics', {})
                    
                    # Fallback if meta is missing (old cache)
                    if not meta:
                        import time
                        meta = {
                            'filename': 'Unknown Result File',
                            'timestamp': os.path.getmtime(filepath),
                            'hash': filename.replace('.json', '')
                        }
                    
                    results.append({
                        'hash': meta.get('hash', filename.replace('.json', '')),
                        'filename': meta.get('filename', 'Unknown'),
                        'timestamp': meta.get('timestamp', 0),
                        'student_count': stats.get('total_students', 0),
                        'college_count': len(stats.get('college_statistics', {}))
                    })
            except Exception as e:
                print(f"Error reading cache file {filename}: {e}")
                
        # Sort by newest first
        results.sort(key=lambda x: x['timestamp'], reverse=True)
        return jsonify(results)
    except Exception as e:
        traceback.print_exc()
        return jsonify({'error': str(e)}), 500

@app.route('/api/results/<file_hash>', methods=['GET'])
def get_cached_result(file_hash):
    """Get specific cached result"""
    try:
        cache_dir = os.path.join(app.root_path, 'cache')
        filepath = os.path.join(cache_dir, f"{file_hash}.json")
        
        if not os.path.exists(filepath):
            return jsonify({'error': 'Result not found'}), 404
            
        with open(filepath, 'r', encoding='utf-8') as f:
            return jsonify(json.load(f))
    except Exception as e:
        return jsonify({'error': str(e)}), 500

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
            if subject['total'] is None:
                continue
            
            # Get all marks for this subject
            subject_marks = []
            for s in students:
                if i < len(s['subjects']) and s['subjects'][i]['total'] is not None:
                    subject_marks.append(s['subjects'][i]['total'])
            
            if subject_marks:
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
