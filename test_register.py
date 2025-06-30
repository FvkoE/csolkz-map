#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
测试注册功能
"""

import requests
import json

def test_register():
    """测试注册功能"""
    base_url = "http://localhost:5000"  # 根据实际情况修改
    
    # 测试数据
    test_user = {
        'username': 'testuser123',
        'email': 'test@example.com',
        'password': 'password123',
        'confirm_password': 'password123',
        'agree_terms': 'on'
    }
    
    try:
        # 1. 测试注册页面是否可以访问
        print("1. 测试注册页面访问...")
        response = requests.get(f"{base_url}/register")
        if response.status_code == 200:
            print("✅ 注册页面可以正常访问")
        else:
            print(f"❌ 注册页面访问失败: {response.status_code}")
            return
        
        # 2. 测试注册功能
        print("2. 测试注册功能...")
        response = requests.post(f"{base_url}/register", data=test_user)
        
        if response.status_code == 302:  # 重定向到登录页面
            print("✅ 注册成功，重定向到登录页面")
        else:
            print(f"❌ 注册失败: {response.status_code}")
            print(f"响应内容: {response.text}")
            return
        
        # 3. 测试重复注册
        print("3. 测试重复注册...")
        response = requests.post(f"{base_url}/register", data=test_user)
        
        if response.status_code == 200 and "用户名已存在" in response.text:
            print("✅ 重复注册被正确阻止")
        else:
            print("❌ 重复注册验证失败")
        
        print("\n🎉 注册功能测试完成！")
        
    except requests.exceptions.ConnectionError:
        print("❌ 无法连接到服务器，请确保Flask应用正在运行")
    except Exception as e:
        print(f"❌ 测试过程中出现错误: {e}")

if __name__ == '__main__':
    test_register() 