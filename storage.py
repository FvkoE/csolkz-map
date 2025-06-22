"""
统一图片存储模块
支持本地存储和ImgBB，保证向后兼容
"""

import os
import uuid
import requests
import base64
from datetime import datetime
from PIL import Image
import io
from config import config

# 获取配置
app_config = config['default']
STORAGE_METHOD = getattr(app_config, 'STORAGE_METHOD', 'fallback') # 从配置读取
UPLOAD_FOLDER = getattr(app_config, 'UPLOAD_FOLDER', 'static/uploads')
IMGBB_API_KEY = getattr(app_config, 'IMGBB_API_KEY', None)

# 全局变量存储API KEY
g_imgbb_api_key = None

def init_storage(api_key=None):
    """初始化存储系统"""
    global g_imgbb_api_key
    
    if api_key:
        g_imgbb_api_key = api_key
        print(f"ImgBB API密钥已设置: {api_key[:10]}...")
    
    # 确保本地存储目录存在
    if STORAGE_METHOD == 'local':
        os.makedirs(UPLOAD_FOLDER, exist_ok=True)
        print(f"本地存储目录已创建: {UPLOAD_FOLDER}")
    
    print(f"存储方式: {STORAGE_METHOD}")

def get_storage_method():
    """获取当前存储方式"""
    return STORAGE_METHOD

def compress_image(image_data, max_width=800, max_height=600, quality=85):
    """压缩图片"""
    try:
        # 打开图片
        image = Image.open(io.BytesIO(image_data))
        
        # 转换为RGB模式（如果是RGBA）
        if image.mode in ('RGBA', 'LA'):
            background = Image.new('RGB', image.size, (255, 255, 255))
            background.paste(image, mask=image.split()[-1] if image.mode == 'RGBA' else None)
            image = background
        
        # 调整大小
        if image.width > max_width or image.height > max_height:
            image.thumbnail((max_width, max_height), Image.Resampling.LANCZOS)
        
        # 保存压缩后的图片
        output = io.BytesIO()
        image.save(output, format='JPEG', quality=quality, optimize=True)
        return output.getvalue()
    except Exception as e:
        print(f"图片压缩失败: {e}")
        return image_data

def generate_filename(original_filename):
    """生成唯一文件名"""
    # 获取文件扩展名
    ext = os.path.splitext(original_filename)[1].lower()
    if ext not in ['.jpg', '.jpeg', '.png', '.gif', '.webp']:
        ext = '.jpg'  # 默认使用jpg
    
    # 生成唯一文件名
    unique_id = uuid.uuid4().hex
    return f"{unique_id}{ext}"

def get_monthly_folder():
    """获取按月份分组的文件夹"""
    current_month = datetime.now().strftime("%Y-%m")
    monthly_folder = os.path.join(UPLOAD_FOLDER, current_month)
    os.makedirs(monthly_folder, exist_ok=True)
    return monthly_folder

def upload_to_local(file):
    """上传图片到本地存储"""
    try:
        # 检查文件
        if not file or not file.filename:
            print("错误: 没有选择文件")
            return None
        
        # 检查文件扩展名
        ext = os.path.splitext(file.filename)[1].lower()
        if ext not in ['.jpg', '.jpeg', '.png', '.gif', '.webp']:
            print(f"错误: 不支持的文件格式 {ext}")
            return None
        
        # 读取文件数据
        file.seek(0)
        image_data = file.read()
        
        # 检查文件大小
        if len(image_data) > 16 * 1024 * 1024:  # 16MB限制
            print(f"错误: 文件过大 ({len(image_data)} bytes)")
            return None
        
        # 压缩图片
        compressed_data = compress_image(image_data)
        print(f"图片压缩: {len(image_data)} -> {len(compressed_data)} bytes")
        
        # 生成文件名和路径
        filename = generate_filename(file.filename)
        monthly_folder = get_monthly_folder()
        filepath = os.path.join(monthly_folder, filename)
        
        # 保存文件
        with open(filepath, 'wb') as f:
            f.write(compressed_data)
        
        # 返回相对URL
        relative_path = os.path.relpath(filepath, 'static')
        url = f"/{relative_path.replace(os.sep, '/')}"
        
        print(f"图片上传成功: {url}")
        return url
        
    except Exception as e:
        print(f"本地存储失败: {e}")
        return None

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
            
        # 压缩图片
        compressed_data = compress_image(image_data)
        
        # 检查文件大小
        if len(compressed_data) > 32 * 1024 * 1024:  # 32MB限制
            print(f"错误: 图片文件过大 ({len(compressed_data)} bytes)")
            return None
            
        # 编码为base64
        encoded_image = base64.b64encode(compressed_data).decode('utf-8')
        
        # 请求数据
        data = {
            'key': g_imgbb_api_key,
            'image': encoded_image
        }
        
        print(f"正在上传图片到ImgBB，文件大小: {len(compressed_data)} bytes")
        
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
            print(f"响应内容: {response.text[:200]}...")
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

def upload_image(file):
    """统一的上传接口"""
    if STORAGE_METHOD == 'local':
        return upload_to_local(file)
    elif STORAGE_METHOD == 'imgbb':
        return upload_to_imgbb(file)
    else:
        print(f"未知的存储方式: {STORAGE_METHOD}")
        return None

def delete_image(image_url):
    """删除图片文件（仅对本地存储有效）"""
    if STORAGE_METHOD != 'local':
        print("当前使用ImgBB存储，无法删除图片文件")
        return False
        
    try:
        if not image_url or not image_url.startswith('/'):
            return False
        
        # 移除开头的斜杠，构建文件路径
        relative_path = image_url[1:]  # 移除开头的 '/'
        filepath = os.path.join('static', relative_path)
        
        if os.path.exists(filepath):
            os.remove(filepath)
            print(f"图片文件已删除: {filepath}")
            return True
        else:
            print(f"图片文件不存在: {filepath}")
            return False
            
    except Exception as e:
        print(f"删除图片失败: {e}")
        return False

# 保持向后兼容
def init_imgbb_storage(api_key):
    """保持向后兼容的ImgBB初始化函数"""
    init_storage(api_key)

def upload_to_imgbb_old(file):
    """保持向后兼容的ImgBB上传函数"""
    return upload_to_imgbb(file) 