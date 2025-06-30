#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
测试邮件发送功能
"""

import os
from email_utils import email_verification

def test_email_sending():
    """测试邮件发送功能"""
    print("🧪 测试邮件发送功能")
    print("=" * 50)
    
    # 检查配置
    sender_email = os.getenv('SENDER_EMAIL')
    sender_password = os.getenv('SENDER_PASSWORD')
    
    if not sender_email or not sender_password:
        print("❌ 未配置邮件发送信息")
        print("请设置以下环境变量：")
        print("SENDER_EMAIL=你的邮箱地址")
        print("SENDER_PASSWORD=邮箱授权码")
        print("\n参考 email_config_example.txt 文件")
        return False
    
    print(f"📧 发件人邮箱: {sender_email}")
    print(f"🔧 SMTP服务器: {os.getenv('SMTP_SERVER', 'smtp.qq.com')}")
    print(f"🔌 SMTP端口: {os.getenv('SMTP_PORT', '587')}")
    print("-" * 50)
    
    # 测试邮箱地址
    test_email = input("请输入测试邮箱地址: ").strip()
    test_username = input("请输入测试用户名: ").strip()
    
    if not test_email or not test_username:
        print("❌ 请输入有效的邮箱地址和用户名")
        return False
    
    print(f"\n📤 正在发送测试邮件到 {test_email}...")
    
    try:
        # 发送验证码
        success, message = email_verification.send_verification_email(test_email, test_username)
        
        if success:
            print("✅ 邮件发送成功！")
            print(f"📝 消息: {message}")
            
            # 测试验证码验证
            print("\n🔍 测试验证码验证...")
            test_code = input("请输入收到的验证码: ").strip()
            
            if test_code:
                verify_success, verify_message = email_verification.verify_code(test_email, test_code)
                if verify_success:
                    print("✅ 验证码验证成功！")
                    print(f"📝 消息: {verify_message}")
                else:
                    print("❌ 验证码验证失败")
                    print(f"📝 消息: {verify_message}")
            else:
                print("⚠️  跳过验证码验证测试")
            
            return True
        else:
            print("❌ 邮件发送失败")
            print(f"📝 错误信息: {message}")
            return False
            
    except Exception as e:
        print(f"❌ 发送邮件时发生错误: {e}")
        return False

def test_email_config():
    """测试邮件配置"""
    print("🔧 测试邮件配置")
    print("=" * 30)
    
    import smtplib
    
    smtp_server = os.getenv('SMTP_SERVER', 'smtp.qq.com')
    smtp_port = int(os.getenv('SMTP_PORT', '587'))
    sender_email = os.getenv('SENDER_EMAIL')
    sender_password = os.getenv('SENDER_PASSWORD')
    
    if not sender_email or not sender_password:
        print("❌ 未配置邮件信息")
        return False
    
    try:
        print(f"🔌 连接到 {smtp_server}:{smtp_port}...")
        server = smtplib.SMTP(smtp_server, smtp_port)
        server.starttls()
        
        print("🔐 尝试登录...")
        server.login(sender_email, sender_password)
        
        print("✅ 邮件配置测试成功！")
        server.quit()
        return True
        
    except Exception as e:
        print(f"❌ 邮件配置测试失败: {e}")
        return False

def main():
    """主函数"""
    print("📧 邮件功能测试工具")
    print("=" * 50)
    
    while True:
        print("\n请选择测试项目：")
        print("1. 测试邮件配置")
        print("2. 测试邮件发送")
        print("3. 退出")
        
        choice = input("\n请输入选择 (1-3): ").strip()
        
        if choice == '1':
            test_email_config()
        elif choice == '2':
            test_email_sending()
        elif choice == '3':
            print("👋 再见！")
            break
        else:
            print("❌ 无效选择，请重新输入")

if __name__ == '__main__':
    main() 