@echo off
chcp 65001 >nul
title CSOL KZ 注册页面服务器

echo.
echo ========================================
echo    CSOL KZ 注册页面独立服务器
echo ========================================
echo.
echo 🚀 正在启动注册页面服务器...
echo 📝 注册页面地址: http://localhost:5001
echo 🔧 按 Ctrl+C 停止服务器
echo.
echo ========================================
echo.

python run_register.py

echo.
echo 服务器已停止
pause 