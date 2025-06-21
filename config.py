import os

class Config:
    """应用配置类"""
    
    # 检测部署环境
    DEPLOYMENT_ENV = os.environ.get('DEPLOYMENT_ENV', 'development')
    
    # Flask配置
    SECRET_KEY = os.environ.get('SECRET_KEY') or 'your_secret_key_123456'
    
    # 数据库配置
    DB_USER = os.environ.get('DB_USER', 'fvckyopue')
    DB_PASSWORD = os.environ.get('DB_PASSWORD', 'd5kQa7pzXbrHUg8A')
    DB_HOST = os.environ.get('DB_HOST', 'mysql2.sqlpub.com')
    DB_PORT = os.environ.get('DB_PORT', '3307')
    DB_NAME = os.environ.get('DB_NAME', 'csolkz')
    
    # 数据库URL
    DATABASE_URL = f"mysql+pymysql://{DB_USER}:{DB_PASSWORD}@{DB_HOST}:{DB_PORT}/{DB_NAME}"
    
    # 文件上传配置
    UPLOAD_FOLDER = 'static/uploads'
    MAX_CONTENT_LENGTH = 16 * 1024 * 1024  # 16MB
    ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'gif', 'webp'}
    
    # 分页配置
    MAPS_PER_PAGE = 6

    # ImgBB配置
    IMGBB_API_KEY = os.environ.get('IMGBB_API_KEY', 'cbcb80fb8d641b6cc945f5797a7fab95')

class DevelopmentConfig(Config):
    """开发环境配置"""
    DEBUG = True

class ProductionConfig(Config):
    """生产环境配置"""
    DEBUG = False
    SECRET_KEY = os.environ.get('SECRET_KEY')

class AliyunConfig(ProductionConfig):
    """阿里云部署配置"""
    DEBUG = False
    
    # 阿里云特定配置
    # 可以在这里添加阿里云特有的配置项
    # 例如：日志路径、缓存配置等

class RenderConfig(ProductionConfig):
    """Render部署配置"""
    DEBUG = False
    
    # Render特定配置
    # 可以在这里添加Render特有的配置项
    # 例如：端口配置、环境变量等

# 配置字典
config = {
    'development': DevelopmentConfig,
    'production': ProductionConfig,
    'aliyun': AliyunConfig,
    'render': RenderConfig,
    'default': DevelopmentConfig
} 