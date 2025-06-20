__all__ = ['init_imgbb_storage', 'upload_to_imgbb']

import requests
import base64
import os

# 全局变量存储API KEY
g_imgbb_api_key = None

def init_imgbb_storage(api_key):
    global g_imgbb_api_key
    g_imgbb_api_key = api_key

def upload_to_imgbb(file):
    """上传图片到ImgBB，返回图片URL"""
    try:
        # 读取文件数据
        if hasattr(file, 'read'):
            file.seek(0)
            image_data = file.read()
        else:
            image_data = file
        # 编码为base64
        encoded_image = base64.b64encode(image_data).decode('utf-8')
        # 请求数据
        data = {
            'key': g_imgbb_api_key,
            'image': encoded_image
        }
        response = requests.post('https://api.imgbb.com/1/upload', data=data)
        if response.status_code == 200:
            result = response.json()
            if result['success']:
                return result['data']['url']
            else:
                print(f"ImgBB上传失败: {result.get('error', {}).get('message', 'Unknown error')}")
                return None
        else:
            print(f"ImgBB API请求失败: {response.status_code}")
            return None
    except Exception as e:
        print(f"上传图片时出错: {e}")
        return None 