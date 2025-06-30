#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
独立注册页面运行脚本
只启动注册相关的功能，避免与主应用冲突
"""

from flask import Flask, render_template, request, redirect, url_for, flash, session, jsonify
from models import SessionLocal, User
from email_utils import email_verification
import re
import os
from datetime import datetime

def create_register_app():
    """创建独立的注册应用"""
    app = Flask(__name__)
    
    # 基础配置
    app.secret_key = 'register_secret_key_2024'
    app.config['SESSION_TYPE'] = 'filesystem'
    
    # 注册路由
    @app.route('/')
    def register_page():
        """注册页面"""
        return render_template('register.html')
    
    @app.route('/send_verification_code', methods=['POST'])
    def send_verification_code():
        """发送验证码"""
        try:
            data = request.get_json()
            email = data.get('email', '').strip()
            username = data.get('username', '').strip()
            
            # 验证邮箱格式
            if not email or not re.match(r'^[^\s@]+@[^\s@]+\.[^\s@]+$', email):
                return jsonify({'success': False, 'message': '请输入有效的邮箱地址'})
            
            # 验证用户名
            if not username or len(username) < 3:
                return jsonify({'success': False, 'message': '用户名至少需要3个字符'})
            
            # 检查邮箱是否已被注册
            session_db = SessionLocal()
            try:
                existing_email = session_db.query(User).filter_by(email=email).first()
                if existing_email:
                    return jsonify({'success': False, 'message': '该邮箱已被注册'})
            finally:
                session_db.close()
            
            # 发送验证码
            success, message = email_verification.send_verification_email(email, username)
            
            return jsonify({'success': success, 'message': message})
            
        except Exception as e:
            print(f"发送验证码错误: {e}")
            return jsonify({'success': False, 'message': '发送失败，请重试'})
    
    @app.route('/register', methods=['GET', 'POST'])
    def register():
        """用户注册"""
        if request.method == 'POST':
            username = request.form.get('username', '').strip()
            email = request.form.get('email', '').strip()
            verification_code = request.form.get('verification_code', '').strip()
            password = request.form.get('password', '')
            confirm_password = request.form.get('confirm_password', '')
            agree_terms = request.form.get('agree_terms')
            
            # 表单验证
            errors = []
            
            # 用户名验证
            if not username or len(username) < 3:
                errors.append('用户名至少需要3个字符')
            elif len(username) > 20:
                errors.append('用户名不能超过20个字符')
            elif not re.match(r'^[a-zA-Z0-9_\u4e00-\u9fa5]+$', username):
                errors.append('用户名只能包含字母、数字、下划线和中文')
            
            # 邮箱验证
            if not email or not re.match(r'^[^\s@]+@[^\s@]+\.[^\s@]+$', email):
                errors.append('请输入有效的邮箱地址')
            
            # 验证码验证
            if not verification_code:
                errors.append('请输入验证码')
            elif not re.match(r'^\d{6}$', verification_code):
                errors.append('验证码为6位数字')
            else:
                # 验证验证码
                verify_success, verify_message = email_verification.verify_code(email, verification_code)
                if not verify_success:
                    errors.append(verify_message)
            
            # 密码验证
            if not password or len(password) < 6:
                errors.append('密码至少需要6个字符')
            elif password != confirm_password:
                errors.append('两次输入的密码不一致')
            
            # 协议同意验证
            if not agree_terms:
                errors.append('请同意用户协议和隐私政策')
            
            if errors:
                for error in errors:
                    flash(error, 'error')
                return render_template('register.html')
            
            session_db = SessionLocal()
            try:
                # 再次检查用户名是否已存在
                existing_user = session_db.query(User).filter_by(username=username).first()
                if existing_user:
                    flash('用户名已存在', 'error')
                    return render_template('register.html')
                
                # 再次检查邮箱是否已存在
                existing_email = session_db.query(User).filter_by(email=email).first()
                if existing_email:
                    flash('邮箱已被注册', 'error')
                    return render_template('register.html')
                
                # 创建新用户
                new_user = User(
                    username=username,
                    email=email,
                    role='user'
                )
                new_user.set_password(password)
                
                session_db.add(new_user)
                session_db.commit()
                
                # 存储注册信息到session（用于成功页面显示）
                session['registered_username'] = username
                session['registered_email'] = email
                session['registered_time'] = datetime.now().strftime('%Y-%m-%d %H:%M:%S')
                
                flash('注册成功！请使用新账号登录', 'success')
                return redirect(url_for('success'))
                
            except Exception as e:
                session_db.rollback()
                flash('注册失败，请稍后重试', 'error')
                print(f"注册错误: {e}")
            finally:
                session_db.close()
        
        return render_template('register.html')
    
    @app.route('/success')
    def success():
        """注册成功页面"""
        return render_template('register_success.html')
    
    return app

def main():
    """主函数"""
    print("🚀 启动独立注册页面服务器...")
    print("📝 注册页面地址: http://localhost:5001")
    print("🔧 按 Ctrl+C 停止服务器")
    print("-" * 50)
    
    # 检查邮件配置
    if not os.getenv('SENDER_EMAIL') or not os.getenv('SENDER_PASSWORD'):
        print("⚠️  警告：未配置邮件发送信息")
        print("请设置以下环境变量：")
        print("SENDER_EMAIL=你的邮箱地址")
        print("SENDER_PASSWORD=邮箱授权码")
        print("SMTP_SERVER=smtp.qq.com (可选)")
        print("SMTP_PORT=587 (可选)")
        print("-" * 50)
    
    app = create_register_app()
    
    # 启动服务器
    app.run(
        host='0.0.0.0',
        port=5001,
        debug=True,
        use_reloader=True
    )

if __name__ == '__main__':
    main() 