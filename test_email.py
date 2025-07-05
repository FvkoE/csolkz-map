#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
邮箱发送测试脚本
用于测试邮箱配置是否正确
"""

import os
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from email.header import Header
from dotenv import load_dotenv

# 加载环境变量
load_dotenv()

def test_email_config():
    """测试邮箱配置"""
    print("🔍 检查邮箱配置...")
    
    # 获取配置
    smtp_server = os.getenv('SMTP_SERVER', 'smtp.qq.com')
    smtp_port = int(os.getenv('SMTP_PORT', '587'))
    sender_email = os.getenv('SENDER_EMAIL', '782074627@qq.com')
    sender_password = os.getenv('SENDER_PASSWORD', 'ktqyjdktcouzbfaj')
    sender_name = os.getenv('SENDER_NAME', 'CSOLKZ')
    
    print(f"📧 SMTP服务器: {smtp_server}:{smtp_port}")
    print(f"📧 发件人邮箱: {sender_email}")
    print(f"🔑 授权码: {'*' * len(sender_password) if sender_password else '未设置'}")
    print(f"📝 发件人名称: {sender_name}")
    
    # 检查必要配置
    if not sender_email or sender_email == 'your_email@qq.com':
        print("❌ 错误：未设置发件人邮箱地址")
        print("请在环境变量中设置 SENDER_EMAIL")
        return False
    
    if not sender_password or sender_password == 'your_email_authorization_code':
        print("❌ 错误：未设置邮箱授权码")
        print("请在环境变量中设置 SENDER_PASSWORD")
        return False
    
    print("✅ 配置检查通过")
    
    # 测试SMTP连接
    print("\n🔗 测试SMTP连接...")
    try:
        with smtplib.SMTP(smtp_server, smtp_port) as server:
            print(f"✅ 成功连接到 {smtp_server}:{smtp_port}")
            
            # 启用TLS
            server.starttls()
            print("✅ TLS加密已启用")
            
            # 登录
            server.login(sender_email, sender_password)
            print("✅ 邮箱登录成功")
            
            # 发送测试邮件
            print("\n📤 发送测试邮件...")
            
            # 创建邮件
            msg = MIMEMultipart('alternative')
            msg['From'] = f'{sender_name} <{sender_email}>'
            msg['To'] = sender_email  # 发送给自己
            msg['Subject'] = Header('CSOL KZ - 邮箱配置测试', 'utf-8')
            
            # 邮件内容
            html_content = """
            <html>
            <body>
                <h2>🎉 邮箱配置测试成功！</h2>
                <p>您的邮箱配置已正确设置，可以正常发送验证码邮件。</p>
                <p><strong>配置信息：</strong></p>
                <ul>
                    <li>SMTP服务器：{smtp_server}:{smtp_port}</li>
                    <li>发件人邮箱：{sender_email}</li>
                    <li>发件人名称：{sender_name}</li>
                </ul>
                <p>测试时间：{test_time}</p>
            </body>
            </html>
            """.format(
                smtp_server=smtp_server,
                smtp_port=smtp_port,
                sender_email=sender_email,
                sender_name=sender_name,
                test_time=os.popen('date').read().strip()
            )
            
            html_part = MIMEText(html_content, 'html', 'utf-8')
            msg.attach(html_part)
            
            # 发送邮件
            server.send_message(msg)
            print("✅ 测试邮件发送成功！")
            print(f"📧 请检查邮箱 {sender_email} 是否收到测试邮件")
            
            return True
            
    except smtplib.SMTPAuthenticationError as e:
        print(f"❌ 邮箱认证失败: {e}")
        print("💡 可能的原因：")
        print("1. 邮箱授权码错误")
        print("2. 邮箱未开启SMTP服务")
        print("3. 使用了登录密码而不是授权码")
        return False
        
    except smtplib.SMTPConnectError as e:
        print(f"❌ SMTP连接失败: {e}")
        print("💡 可能的原因：")
        print("1. 网络连接问题")
        print("2. SMTP服务器地址或端口错误")
        print("3. 防火墙阻止连接")
        return False
        
    except smtplib.SMTPException as e:
        print(f"❌ SMTP错误: {e}")
        return False
        
    except Exception as e:
        print(f"❌ 未知错误: {e}")
        return False

def main():
    """主函数"""
    print("=" * 50)
    print("📧 CSOL KZ 邮箱配置测试")
    print("=" * 50)
    
    success = test_email_config()
    
    print("\n" + "=" * 50)
    if success:
        print("🎉 邮箱配置测试成功！")
        print("✅ 可以正常发送验证码邮件")
    else:
        print("❌ 邮箱配置测试失败！")
        print("🔧 请检查配置并重新测试")
    print("=" * 50)

if __name__ == '__main__':
    main() 