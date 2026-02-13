import os

port = os.environ.get("PORT", 10000)
bind = f"0.0.0.0:{port}"
workers = 1
timeout = 300
max_requests = 10
worker_class = 'sync'
