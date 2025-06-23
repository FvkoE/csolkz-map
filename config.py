import os

class Config:
    """应用配置类"""
    
    # 检测部署环境
    DEPLOYMENT_ENV = os.environ.get('DEPLOYMENT_ENV', 'development')
    
    # Flask配置
    SECRET_KEY = os.environ.get('SECRET_KEY') or 'your_secret_key_123456'
    
    # 会话配置
    PERMANENT_SESSION_LIFETIME = 100 * 365 * 24 * 3600  # 会话过期时间：永久（100年）
    SESSION_COOKIE_SECURE = False  # 开发环境设为False，生产环境应设为True
    SESSION_COOKIE_HTTPONLY = True  # 防止XSS攻击
    SESSION_COOKIE_SAMESITE = 'Lax'  # CSRF防护
    SESSION_COOKIE_MAX_AGE = 100 * 365 * 24 * 3600  # Cookie最大年龄：永久（100年）
    
    # 数据库配置 - 使用环境变量，如果未设置则抛出错误
    DB_USER = os.environ.get('DB_USER')
    DB_PASSWORD = os.environ.get('DB_PASSWORD')
    DB_HOST = os.environ.get('DB_HOST')
    DB_PORT = os.environ.get('DB_PORT', '3306')
    DB_NAME = os.environ.get('DB_NAME')
    
    # 检查必要的数据库配置
    if not all([DB_USER, DB_PASSWORD, DB_HOST, DB_NAME]):
        raise ValueError(
            "数据库配置不完整！请设置以下环境变量：\n"
            "DB_USER, DB_PASSWORD, DB_HOST, DB_NAME\n"
            "或者创建 .env 文件包含这些配置。"
        )
    
    # 数据库URL
    DATABASE_URL = f"mysql+pymysql://{DB_USER}:{DB_PASSWORD}@{DB_HOST}:{DB_PORT}/{DB_NAME}"
    
    # 文件上传配置
    UPLOAD_FOLDER = 'static/uploads'
    MAX_CONTENT_LENGTH = 2 * 1024 * 1024  # 2MB
    ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'gif', 'webp'}
    
    # 分页配置
    MAPS_PER_PAGE = 30

    # local: 仅本地存储
    # imgbb: 仅ImgBB云存储
    # fallback: 优先ImgBB，失败时自动降级到本地
    STORAGE_METHOD = os.environ.get('STORAGE_METHOD', 'local')

    # ImgBB配置
    IMGBB_API_KEY = os.environ.get('IMGBB_API_KEY')

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