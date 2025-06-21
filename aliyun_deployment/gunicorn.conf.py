# Gunicorn配置文件
# 针对阿里云ECS 2核2GB配置优化

# 绑定地址和端口
bind = "127.0.0.1:8000"

# Worker进程数（2核CPU，使用2个worker）
workers = 2

# Worker类型
worker_class = "sync"

# 每个worker的最大连接数
worker_connections = 800

# 请求超时时间（秒）
timeout = 30

# Keep-alive连接时间
keepalive = 2

# 每个worker处理的最大请求数（防止内存泄漏）
max_requests = 800
max_requests_jitter = 100

# 预加载应用（提高性能）
preload_app = True

# 日志配置
accesslog = "/var/log/csolflask/access.log"
errorlog = "/var/log/csolflask/error.log"
loglevel = "info"

# 进程名称
proc_name = "csolflask"

# 用户和组（需要与systemd服务配置一致）
user = "www-data"
group = "www-data"

# 工作目录
chdir = "/var/www/csolflask"

# 环境变量
raw_env = [
    "DEPLOYMENT_ENV=aliyun"
]

# 内存优化设置
worker_tmp_dir = "/dev/shm" 