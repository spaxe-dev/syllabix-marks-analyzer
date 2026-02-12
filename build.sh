#!/usr/bin/env bash
# Exit on error
set -o errexit

# 1. Install Python dependencies
pip install -r requirements.txt

# 2. Build Frontend
# Go to frontend directory
cd frontend

# Install Node dependencies
npm install

# Build static files to dist/
npm run build

# Return to root
cd ..
