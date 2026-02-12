/**
 * University Result Analyzer - Application Logic
 * Handles PDF upload, data processing, and UI updates
 */

// Global state
let resultData = null;
let gradeChart = null;

// DOM Elements
const uploadSection = document.getElementById('upload-section');
const resultsDashboard = document.getElementById('results-dashboard');
const fileInput = document.getElementById('file-input');
const browseBtn = document.getElementById('browse-btn');
const uploadProgress = document.getElementById('upload-progress');
const newFileBtn = document.getElementById('new-file-btn');
const seatSearch = document.getElementById('seat-search');
const searchBtn = document.getElementById('search-btn');
const tableFilter = document.getElementById('table-filter');
const resultFilter = document.getElementById('result-filter');

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    setupEventListeners();
    loadCachedResults();
});

function setupEventListeners() {
    // File upload
    browseBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        fileInput.click();
    });

    uploadSection.addEventListener('click', () => fileInput.click());

    fileInput.addEventListener('change', handleFileSelect);

    // Drag and drop
    uploadSection.addEventListener('dragover', handleDragOver);
    uploadSection.addEventListener('dragleave', handleDragLeave);
    uploadSection.addEventListener('drop', handleDrop);

    // New file button
    newFileBtn.addEventListener('click', resetUpload);

    // Search
    searchBtn.addEventListener('click', searchStudent);
    seatSearch.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') searchStudent();
    });

    // Table filters
    tableFilter.addEventListener('input', filterTable);
    resultFilter.addEventListener('change', filterTable);
}

function handleDragOver(e) {
    e.preventDefault();
    uploadSection.classList.add('dragover');
}

function handleDragLeave(e) {
    e.preventDefault();
    uploadSection.classList.remove('dragover');
}

function handleDrop(e) {
    e.preventDefault();
    uploadSection.classList.remove('dragover');

    const files = e.dataTransfer.files;
    if (files.length > 0 && files[0].type === 'application/pdf') {
        processFile(files[0]);
    }
}

function handleFileSelect(e) {
    const file = e.target.files[0];
    if (file) {
        processFile(file);
    }
}

async function processFile(file) {
    // Show progress
    document.querySelector('.upload-content').classList.add('hidden');
    uploadProgress.classList.remove('hidden');

    const formData = new FormData();
    formData.append('file', file);

    try {
        const response = await fetch('/api/parse', {
            method: 'POST',
            body: formData
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Failed to process PDF');
        }

        resultData = await response.json();

        // Update UI
        displayResults(file.name);

    } catch (error) {
        console.error('Error:', error);
        alert('Error processing PDF: ' + error.message);
        resetUpload();
    }
}

function displayResults(fileName) {
    // Hide upload, show results
    uploadSection.classList.add('hidden');
    document.getElementById('cached-section').classList.add('hidden');
    resultsDashboard.classList.remove('hidden');

    // File info
    document.getElementById('file-name').textContent = fileName;
    document.getElementById('file-meta').textContent =
        `${resultData.students.length} students • ${Object.keys(resultData.course_metadata).length} subjects`;

    // Stats
    const stats = resultData.statistics;
    animateValue('total-students', stats.total_students);
    animateValue('passed-students', stats.passed_students);
    document.getElementById('pass-percentage').textContent = stats.pass_percentage + '%';
    document.getElementById('median-cgpa').textContent = stats.median_cgpa.toFixed(2);

    // Toppers
    displayToppers();

    // Chart
    createGradeChart();

    // College Analysis
    displayCollegeAnalysis();

    // Table
    displayStudentsTable();
}

function animateValue(elementId, value) {
    const element = document.getElementById(elementId);
    let current = 0;
    const increment = Math.ceil(value / 30);
    const timer = setInterval(() => {
        current += increment;
        if (current >= value) {
            current = value;
            clearInterval(timer);
        }
        element.textContent = current;
    }, 20);
}

function displayToppers() {
    const toppersList = document.getElementById('toppers-list');
    toppersList.innerHTML = '';

    const toppers = resultData.statistics.subject_toppers;
    const metadata = resultData.course_metadata;

    Object.entries(toppers).forEach(([code, topper], index) => {
        const subjectName = metadata[code]?.name || code;
        const item = document.createElement('div');
        item.className = 'topper-item';
        item.innerHTML = `
            <div class="topper-rank">${index + 1}</div>
            <div class="topper-info">
                <span class="topper-subject">${subjectName}</span>
                <span class="topper-name">${topper.name}</span>
            </div>
            <div class="topper-marks">
                <span class="topper-score">${topper.marks}</span>
                <span class="topper-seat">#${topper.seat_no}</span>
            </div>
        `;
        toppersList.appendChild(item);
    });
}

function createGradeChart() {
    const ctx = document.getElementById('grade-chart').getContext('2d');

    // Count grades
    const gradeCounts = { 'O': 0, 'A+': 0, 'A': 0, 'B+': 0, 'B': 0, 'C': 0, 'D': 0, 'F': 0 };

    resultData.students.forEach(student => {
        student.subjects.forEach(subject => {
            if (subject.grade && gradeCounts.hasOwnProperty(subject.grade)) {
                gradeCounts[subject.grade]++;
            }
        });
    });

    if (gradeChart) {
        gradeChart.destroy();
    }

    gradeChart = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: Object.keys(gradeCounts),
            datasets: [{
                data: Object.values(gradeCounts),
                backgroundColor: [
                    '#10b981', // O - Green
                    '#3b82f6', // A+ - Blue
                    '#6366f1', // A - Indigo
                    '#8b5cf6', // B+ - Purple
                    '#a855f7', // B - Violet
                    '#f59e0b', // C - Amber
                    '#f97316', // D - Orange
                    '#ef4444'  // F - Red
                ],
                borderWidth: 0,
                hoverOffset: 10
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'right',
                    labels: {
                        color: 'rgba(255, 255, 255, 0.7)',
                        font: {
                            family: "'Inter', sans-serif",
                            size: 12
                        },
                        padding: 15,
                        usePointStyle: true,
                        pointStyle: 'circle'
                    }
                },
                tooltip: {
                    backgroundColor: 'rgba(0, 0, 0, 0.8)',
                    titleFont: { family: "'Inter', sans-serif" },
                    bodyFont: { family: "'Inter', sans-serif" },
                    padding: 12,
                    cornerRadius: 8
                }
            },
            cutout: '65%'
        }
    });
}

function displayStudentsTable() {
    const tbody = document.getElementById('students-tbody');
    tbody.innerHTML = '';

    // Sort by total marks (descending)
    const sortedStudents = [...resultData.students].sort((a, b) => b.total_marks - a.total_marks);

    sortedStudents.forEach((student, index) => {
        const row = document.createElement('tr');
        row.dataset.seat = student.seat_no;
        row.dataset.name = student.name.toLowerCase();
        row.dataset.result = student.result.toLowerCase();
        row.dataset.college = student.college.toLowerCase();

        // Get short college name (after the colon, first word)
        const collegeParts = student.college.split(':');
        const shortCollege = collegeParts.length > 1 ? collegeParts[1].trim().split(' ').slice(0, 2).join(' ') : student.college;

        row.innerHTML = `
            <td><strong>#${index + 1}</strong></td>
            <td>${student.seat_no}</td>
            <td>
                <div class="student-cell">
                    <span class="student-name">${student.name}</span>
                    <span class="student-college">${shortCollege}</span>
                </div>
            </td>
            <td><strong>${student.total_marks}</strong> / 800</td>
            <td>
                <span class="result-badge ${student.result === 'PASS' ? 'pass' : 'fail'}">
                    ${student.result}
                </span>
            </td>
            <td>
                <button class="btn btn-secondary btn-analyze" onclick="analyzeStudent('${student.seat_no}')">
                    View
                </button>
            </td>
        `;
        tbody.appendChild(row);
    });
}

function filterTable() {
    const filterText = tableFilter.value.toLowerCase();
    const resultType = resultFilter.value;

    const rows = document.querySelectorAll('#students-tbody tr');

    rows.forEach(row => {
        const matchesText = row.dataset.seat.includes(filterText) ||
            row.dataset.name.includes(filterText);
        const matchesResult = resultType === 'all' ||
            (resultType === 'pass' && row.dataset.result === 'pass') ||
            (resultType === 'fail' && row.dataset.result !== 'pass');

        row.style.display = matchesText && matchesResult ? '' : 'none';
    });
}

function searchStudent() {
    const seatNo = seatSearch.value.trim();
    if (!seatNo) return;

    analyzeStudent(seatNo);
}

async function analyzeStudent(seatNo) {
    const studentResult = document.getElementById('student-result');

    // Find student in local data
    const student = resultData.students.find(s => s.seat_no === seatNo);

    if (!student) {
        studentResult.classList.remove('hidden');
        studentResult.innerHTML = `
            <div class="student-header" style="justify-content: center;">
                <p style="color: var(--danger);">❌ Student with seat number ${seatNo} not found</p>
            </div>
        `;
        return;
    }

    // Calculate analysis locally
    const allMarks = resultData.students.map(s => s.total_marks).sort((a, b) => a - b);
    const rank = resultData.students.filter(s => s.total_marks > student.total_marks).length + 1;
    const percentile = ((resultData.students.filter(s => s.total_marks < student.total_marks).length / resultData.students.length) * 100).toFixed(1);

    // Calculate subject comparison
    const subjectComparison = student.subjects.map((subject, i) => {
        if (!subject.total) return null;

        const subjectMarks = resultData.students
            .filter(s => s.subjects[i] && s.subjects[i].total)
            .map(s => s.subjects[i].total);

        const avg = subjectMarks.reduce((a, b) => a + b, 0) / subjectMarks.length;
        const max = Math.max(...subjectMarks);
        const min = Math.min(...subjectMarks);
        const subjectRank = subjectMarks.filter(m => m > subject.total).length + 1;

        return {
            ...subject,
            class_avg: avg.toFixed(1),
            class_max: max,
            class_min: min,
            rank: subjectRank,
            total_students: subjectMarks.length
        };
    }).filter(Boolean);

    // Update search input
    seatSearch.value = seatNo;

    // Display results
    studentResult.classList.remove('hidden');
    studentResult.innerHTML = `
        <div class="student-header">
            <div class="student-avatar">${student.name.charAt(0)}</div>
            <div class="student-info">
                <h3>${student.name}</h3>
                <div class="student-meta">
                    <span class="meta-item">🎫 ${student.seat_no}</span>
                    <span class="meta-item">👤 ${student.gender}</span>
                    <span class="meta-item">📋 ${student.status}</span>
                    <span class="meta-item">🏫 ${student.college.split(':')[0]}</span>
                </div>
            </div>
            <span class="result-badge ${student.result === 'PASS' ? 'pass' : 'fail'}" style="font-size: 1rem; padding: 0.5rem 1rem;">
                ${student.result}
            </span>
        </div>
        
        <div class="student-stats">
            <div class="student-stat accent">
                <span class="student-stat-value">#${rank}</span>
                <span class="student-stat-label">Overall Rank</span>
            </div>
            <div class="student-stat ${parseFloat(percentile) > 50 ? 'success' : ''}">
                <span class="student-stat-value">${percentile}%</span>
                <span class="student-stat-label">Percentile</span>
            </div>
            <div class="student-stat">
                <span class="student-stat-value">${student.total_marks}</span>
                <span class="student-stat-label">Total Marks</span>
            </div>
            <div class="student-stat">
                <span class="student-stat-value">${student.cgpa.toFixed(2)}</span>
                <span class="student-stat-label">CGPA</span>
            </div>
        </div>
        
        <div class="subject-comparison">
            <h4>📚 Subject-wise Performance</h4>
            <table class="subject-table">
                <thead>
                    <tr>
                        <th>Subject</th>
                        <th>T1</th>
                        <th>O1</th>
                        <th>E1</th>
                        <th>I1</th>
                        <th>Total</th>
                        <th>Grade</th>
                        <th>Rank</th>
                    </tr>
                </thead>
                <tbody>
                    ${subjectComparison.map(s => `
                        <tr class="${s.passed === false ? 'failed-row' : ''}">
                            <td title="${s.name}">${s.name.length > 25 ? s.name.substring(0, 22) + '...' : s.name}</td>
                            <td>${s.term_work ?? '-'}</td>
                            <td>${s.oral ?? '-'}</td>
                            <td>${s.external ?? '-'}</td>
                            <td>${s.internal ?? '-'}</td>
                            <td><strong>${s.total}</strong></td>
                            <td><span class="grade-badge grade-${s.grade}">${s.grade}</span></td>
                            <td>#${s.rank} / ${s.total_students}</td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        </div>
    `;

    // Scroll to result
    studentResult.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function resetUpload() {
    resultData = null;
    fileInput.value = '';

    document.querySelector('.upload-content').classList.remove('hidden');
    uploadProgress.classList.add('hidden');
    uploadSection.classList.remove('hidden');
    resultsDashboard.classList.add('hidden');
    document.getElementById('student-result').classList.add('hidden');

    if (gradeChart) {
        gradeChart.destroy();
        gradeChart = null;
    }

    // Refresh cache list
    loadCachedResults();
}

async function loadCachedResults() {
    const cachedSection = document.getElementById('cached-section');
    const cachedList = document.getElementById('cached-list');

    try {
        const response = await fetch('/api/cache');
        if (!response.ok) return;

        const results = await response.json();

        if (results.length === 0) {
            cachedSection.classList.add('hidden');
            return;
        }

        cachedList.innerHTML = '';
        results.forEach(item => {
            const date = new Date(item.timestamp * 1000).toLocaleString();

            const div = document.createElement('div');
            div.className = 'cached-item glass-card';
            div.onclick = () => loadCachedResult(item.hash);

            div.innerHTML = `
                <div class="cached-icon">📄</div>
                <div class="cached-details">
                    <h4 class="cached-name">${item.filename}</h4>
                    <span class="cached-meta">${item.student_count} Students • ${item.college_count} Colleges</span>
                    <span class="cached-date">${date}</span>
                </div>
            `;

            cachedList.appendChild(div);
        });

        cachedSection.classList.remove('hidden');

    } catch (error) {
        console.error('Error loading cache:', error);
    }
}

async function loadCachedResult(hash) {
    // Show loading state
    const cachedSection = document.getElementById('cached-section');
    cachedSection.classList.add('hidden');
    document.querySelector('.upload-content').classList.add('hidden');
    uploadProgress.classList.remove('hidden');

    try {
        const response = await fetch(`/api/results/${hash}`);
        if (!response.ok) throw new Error('Failed to load result');

        resultData = await response.json();
        const filename = resultData.meta?.filename || 'Cached Result';

        displayResults(filename);

    } catch (error) {
        console.error('Error:', error);
        alert('Error loading cached result');
        resetUpload();
    }
}

// Make analyzeStudent globally accessible
window.analyzeStudent = analyzeStudent;

function displayCollegeAnalysis() {
    const section = document.getElementById('college-section');
    const grid = document.getElementById('college-grid');
    grid.innerHTML = '';

    // Check if college stats exist
    if (!resultData.statistics.college_statistics) {
        section.classList.add('hidden');
        return;
    }

    section.classList.remove('hidden');
    const stats = resultData.statistics.college_statistics;

    Object.entries(stats).forEach(([collegeName, collegeStat], index) => {
        // Create Card
        const card = document.createElement('div');
        card.className = 'glass-card college-card';

        // Shorten college name for display
        const shortName = collegeName.split(':')[1]?.trim() || collegeName;

        card.innerHTML = `
            <div class="college-header">
                <h3>${shortName}</h3>
                <div class="college-meta">
                    <span class="college-total">${collegeStat.total_students} Students</span>
                    <span class="college-pass-rate ${collegeStat.pass_percentage >= 50 ? 'success' : 'danger'}">
                        ${collegeStat.pass_percentage}% Pass
                    </span>
                </div>
            </div>
            
            <div class="college-content">
                <div class="college-chart-container">
                     <canvas id="college-chart-${index}"></canvas>
                </div>
                
                <div class="college-subjects">
                    <h4>Subject Performance (Pass %)</h4>
                    <div class="subject-mini-list">
                        ${Object.values(collegeStat.subject_stats).map(subj => `
                            <div class="subject-mini-item">
                                <span class="subj-name" title="${subj.name}">${subj.name.substring(0, 15)}${subj.name.length > 15 ? '...' : ''}</span>
                                <div class="subj-bar-container">
                                    <div class="subj-bar ${subj.pass_percentage < 50 ? 'danger' : ''}" style="width: ${subj.pass_percentage}%"></div>
                                </div>
                                <span class="subj-pct">${subj.pass_percentage}%</span>
                            </div>
                        `).join('')}
                    </div>
                </div>
            </div>
        `;

        grid.appendChild(card);

        // Initialize Pie Chart
        new Chart(document.getElementById(`college-chart-${index}`), {
            type: 'doughnut',
            data: {
                labels: ['Passed', 'Failed'],
                datasets: [{
                    data: [collegeStat.passed_students, collegeStat.failed_students],
                    backgroundColor: ['#10b981', '#ef4444'],
                    borderWidth: 0
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'right',
                        labels: {
                            color: 'rgba(255, 255, 255, 0.7)',
                            font: { size: 10 },
                            padding: 10,
                            usePointStyle: true,
                            pointStyle: 'circle'
                        }
                    }
                },
                cutout: '65%'
            }
        });
    });
}
