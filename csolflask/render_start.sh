#!/bin/bash
# Render启动脚本

echo "Starting CSOL Flask application..."

# 检查环境变量
echo "Checking environment variables..."
echo "DB_HOST: $DB_HOST"
echo "DB_NAME: $DB_NAME"

# 启动应用
exec gunicorn app:app --bind 0.0.0.0:$PORT --workers 1 --timeout 120 