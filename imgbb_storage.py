__all__ = ['init_imgbb_storage', 'upload_to_imgbb']

import requests
import base64
import os

# 全局变量存储API KEY
g_imgbb_api_key = None

def init_imgbb_storage(api_key):
    global g_imgbb_api_key
    g_imgbb_api_key = api_key
    print(f"ImgBB API密钥已设置: {api_key[:10]}..." if api_key else "API密钥为空")

def upload_to_imgbb(file):
    """上传图片到ImgBB，返回图片URL"""
    try:
        # 检查API密钥
        if not g_imgbb_api_key:
            print("错误: ImgBB API密钥未配置")
            return None
            
        # 读取文件数据
        if hasattr(file, 'read'):
            file.seek(0)
            image_data = file.read()
        else:
            image_data = file
            
        # 检查文件大小
        if len(image_data) > 32 * 1024 * 1024:  # 32MB限制
            print(f"错误: 图片文件过大 ({len(image_data)} bytes)")
            return None
            
        # 编码为base64
        encoded_image = base64.b64encode(image_data).decode('utf-8')
        
        # 请求数据
        data = {
            'key': g_imgbb_api_key,
            'image': encoded_image
        }
        
        print(f"正在上传图片到ImgBB，文件大小: {len(image_data)} bytes")
        
        # 设置超时时间
        response = requests.post(
            'https://api.imgbb.com/1/upload', 
            data=data, 
            timeout=30  # 30秒超时
        )
        
        print(f"ImgBB API响应状态码: {response.status_code}")
        
        if response.status_code == 200:
            result = response.json()
            if result['success']:
                print("图片上传成功")
                return result['data']['url']
            else:
                error_msg = result.get('error', {}).get('message', 'Unknown error')
                print(f"ImgBB上传失败: {error_msg}")
                return None
        else:
            print(f"ImgBB API请求失败: HTTP {response.status_code}")
            print(f"响应内容: {response.text[:200]}...")  # 只显示前200个字符
            return None
            
    except requests.exceptions.Timeout:
        print("错误: ImgBB API请求超时")
        return None
    except requests.exceptions.ConnectionError:
        print("错误: 无法连接到ImgBB API，请检查网络连接")
        return None
    except requests.exceptions.RequestException as e:
        print(f"错误: ImgBB API请求异常: {e}")
        return None
    except Exception as e:
        print(f"错误: 上传图片时出现未知错误: {e}")
        return None 