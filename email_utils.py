#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
邮件发送工具模块
用于发送验证码邮件
"""

import smtplib
import random
import string
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from email.header import Header
import os
from datetime import datetime, timedelta
import json

class EmailVerification:
    def __init__(self):
        # 邮件配置
        self.smtp_server = os.getenv('SMTP_SERVER', 'smtp.qq.com')
        self.smtp_port = int(os.getenv('SMTP_PORT', '587'))
        self.sender_email = os.getenv('SENDER_EMAIL', '782074627@qq.com')
        self.sender_password = os.getenv('SENDER_PASSWORD', 'ktqyjdktcouzbfaj')  # 邮箱授权码
        self.sender_name = os.getenv('SENDER_NAME', 'CSOLKZ ')
        
        # 验证码存储（实际项目中应该使用Redis或数据库）
        self.verification_codes = {}
        
    def generate_verification_code(self, length=6):
        """生成验证码"""
        return ''.join(random.choices(string.digits, k=length))
    
    def send_verification_email(self, to_email, username):
        """发送验证码邮件"""
        try:
            # 生成验证码
            verification_code = self.generate_verification_code()
            
            # 设置验证码过期时间（10分钟）
            expire_time = datetime.now() + timedelta(minutes=10)
            
            # 存储验证码信息
            self.verification_codes[to_email] = {
                'code': verification_code,
                'username': username,
                'expire_time': expire_time,
                'attempts': 0  # 验证尝试次数
            }
            
            # 创建邮件内容
            subject = f'{self.sender_name} - 邮箱验证码'
            
            html_content = f"""
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="UTF-8">
                <title>邮箱验证码</title>
                <style>
                    body {{
                        font-family: 'Microsoft YaHei', Arial, sans-serif;
                        line-height: 1.6;
                        color: #333;
                        max-width: 600px;
                        margin: 0 auto;
                        padding: 20px;
                    }}
                    .header {{
                        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                        color: white;
                        padding: 20px;
                        text-align: center;
                        border-radius: 10px 10px 0 0;
                    }}
                    .content {{
                        background: #f8f9fa;
                        padding: 30px;
                        border-radius: 0 0 10px 10px;
                    }}
                    .verification-code {{
                        background: #fff;
                        border: 2px solid #667eea;
                        border-radius: 8px;
                        padding: 20px;
                        text-align: center;
                        margin: 20px 0;
                        font-size: 24px;
                        font-weight: bold;
                        color: #667eea;
                        letter-spacing: 5px;
                    }}
                    .warning {{
                        background: #fff3cd;
                        border: 1px solid #ffeaa7;
                        border-radius: 5px;
                        padding: 15px;
                        margin: 20px 0;
                        color: #856404;
                    }}
                    .footer {{
                        text-align: center;
                        margin-top: 30px;
                        color: #666;
                        font-size: 12px;
                    }}
                </style>
            </head>
            <body>
                <div class="header">
                    <h1>{self.sender_name}</h1>
                    <p>邮箱验证码</p>
                </div>
                
                <div class="content">
                    <h2>您好，{username}！</h2>
                    <p>感谢您注册 {self.sender_name}，请使用以下验证码完成邮箱验证：</p>
                    
                    <div class="verification-code">
                        {verification_code}
                    </div>
                    
                    <p><strong>验证码有效期：</strong>10分钟</p>
                    <p><strong>用户名：</strong>{username}</p>
                    <p><strong>邮箱：</strong>{to_email}</p>
                    
                    <div class="warning">
                        <strong>⚠️ 安全提醒：</strong><br>
                        • 请勿将验证码告诉他人<br>
                        • 验证码10分钟内有效<br>
                        • 如非本人操作，请忽略此邮件
                    </div>
                    
                    <p>如果验证码无法使用，请重新获取。</p>
                </div>
                
                <div class="footer">
                    <p>此邮件由系统自动发送，请勿回复</p>
                    <p>如有问题，请联系管理员：FvkoE (QQ: 782074627)</p>
                </div>
            </body>
            </html>
            """
            
            # 创建邮件对象
            msg = MIMEMultipart('alternative')
            msg['From'] = f'{self.sender_name} <{self.sender_email}>'
            msg['To'] = to_email
            msg['Subject'] = Header(subject, 'utf-8')
            
            # 添加HTML内容
            html_part = MIMEText(html_content, 'html', 'utf-8')
            msg.attach(html_part)
            
            # 发送邮件
            with smtplib.SMTP(self.smtp_server, self.smtp_port) as server:
                server.starttls()  # 启用TLS加密
                server.login(self.sender_email, self.sender_password)
                server.send_message(msg)
            
            print(f"✅ 验证码邮件已发送到 {to_email}")
            return True, "验证码已发送到您的邮箱"
            
        except Exception as e:
            print(f"❌ 发送邮件失败: {e}")
            return False, f"发送邮件失败: {str(e)}"
    
    def verify_code(self, email, code):
        """验证验证码"""
        if email not in self.verification_codes:
            return False, "验证码不存在或已过期"
        
        verification_data = self.verification_codes[email]
        
        # 检查是否过期
        if datetime.now() > verification_data['expire_time']:
            del self.verification_codes[email]
            return False, "验证码已过期，请重新获取"
        
        # 检查尝试次数
        if verification_data['attempts'] >= 5:
            del self.verification_codes[email]
            return False, "验证失败次数过多，请重新获取验证码"
        
        # 验证码匹配检查
        if verification_data['code'] == code:
            # 验证成功，删除验证码
            del self.verification_codes[email]
            return True, "验证成功"
        else:
            # 验证失败，增加尝试次数
            verification_data['attempts'] += 1
            return False, f"验证码错误，还剩 {5 - verification_data['attempts']} 次尝试机会"
    
    def is_email_verified(self, email):
        """检查邮箱是否已验证"""
        return email not in self.verification_codes
    
    def cleanup_expired_codes(self):
        """清理过期的验证码"""
        current_time = datetime.now()
        expired_emails = []
        
        for email, data in self.verification_codes.items():
            if current_time > data['expire_time']:
                expired_emails.append(email)
        
        for email in expired_emails:
            del self.verification_codes[email]
        
        if expired_emails:
            print(f"🧹 清理了 {len(expired_emails)} 个过期验证码")

# 创建全局实例
email_verification = EmailVerification() 