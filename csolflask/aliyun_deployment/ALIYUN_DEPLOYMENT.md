# 阿里云ECS部署指南

## 部署方案

本项目支持多平台部署：
- **Render**: 免费云平台，适合测试和小型应用
- **阿里云ECS**: 付费云服务器，性能更好，适合生产环境

## 阿里云ECS部署步骤

### 1. 购买阿里云ECS实例
1. 登录阿里云控制台
2. 购买ECS实例（推荐配置）：
   - **操作系统**: Ubuntu 20.04/22.04 LTS
   - **实例规格**: 2核4GB（最低配置）
   - **带宽**: 5Mbps
   - **存储**: 40GB系统盘

### 2. 连接服务器
```bash
# 使用SSH连接
ssh root@your_server_ip
```

### 3. 安装必要软件
```bash
# 更新系统
apt update && apt upgrade -y

# 安装Python和pip
apt install python3 python3-pip python3-venv -y

# 安装MySQL（可选，如果使用本地数据库）
apt install mysql-server -y

# 安装Nginx
apt install nginx -y

# 安装Git
apt install git -y
```

### 4. 创建应用目录
```bash
# 创建应用目录
mkdir -p /var/www/csolflask
cd /var/www/csolflask

# 克隆代码（或上传代码）
git clone https://github.com/your-username/your-repo.git .
```

### 5. 创建Python虚拟环境
```bash
# 创建虚拟环境
python3 -m venv venv

# 激活虚拟环境
source venv/bin/activate

# 安装依赖
pip install -r requirements.txt
```

### 6. 配置环境变量
```bash
# 创建环境变量文件
nano /var/www/csolflask/.env

# 添加以下内容：
DEPLOYMENT_ENV=aliyun
SECRET_KEY=your_aliyun_secret_key_here
DB_USER=fvckyopue
DB_PASSWORD=d5kQa7pzXbrHUg8A
DB_HOST=mysql2.sqlpub.com
DB_PORT=3307
DB_NAME=csolkz
IMGBB_API_KEY=cbcb80fb8d641b6cc945f5797a7fab95
```

### 7. 配置Gunicorn
```bash
# 创建Gunicorn配置文件
nano /var/www/csolflask/gunicorn.conf.py
```

### 8. 创建Systemd服务
```bash
# 创建服务文件
nano /etc/systemd/system/csolflask.service
```

### 9. 配置Nginx
```bash
# 创建Nginx配置文件
nano /etc/nginx/sites-available/csolflask
```

### 10. 启动服务
```bash
# 启动应用服务
systemctl start csolflask
systemctl enable csolflask

# 启动Nginx
systemctl start nginx
systemctl enable nginx
```

## 配置文件内容

### Gunicorn配置 (gunicorn.conf.py)
```python
bind = "127.0.0.1:8000"
workers = 2
worker_class = "sync"
worker_connections = 1000
timeout = 30
keepalive = 2
max_requests = 1000
max_requests_jitter = 100
preload_app = True
```

### Systemd服务配置
```ini
[Unit]
Description=CSOL Flask Application
After=network.target

[Service]
User=www-data
Group=www-data
WorkingDirectory=/var/www/csolflask
Environment="PATH=/var/www/csolflask/venv/bin"
ExecStart=/var/www/csolflask/venv/bin/gunicorn --config gunicorn.conf.py app:app
ExecReload=/bin/kill -s HUP $MAINPID
Restart=always

[Install]
WantedBy=multi-user.target
```

### Nginx配置
```nginx
server {
    listen 80;
    server_name your_domain.com;  # 替换为您的域名

    location / {
        proxy_pass http://127.0.0.1:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    location /static/ {
        alias /var/www/csolflask/static/;
        expires 30d;
    }
}
```

## 环境区分

### 配置文件修改
在`config.py`中添加环境检测：

```python
import os

class Config:
    # 检测部署环境
    DEPLOYMENT_ENV = os.environ.get('DEPLOYMENT_ENV', 'development')
    
    # 根据环境调整配置
    if DEPLOYMENT_ENV == 'aliyun':
        DEBUG = False
        # 阿里云特定配置
    elif DEPLOYMENT_ENV == 'render':
        DEBUG = False
        # Render特定配置
    else:
        DEBUG = True
```

## 域名和SSL配置

### 1. 域名解析
在阿里云DNS控制台添加A记录，指向您的ECS公网IP。

### 2. SSL证书配置
```bash
# 安装Certbot
apt install certbot python3-certbot-nginx -y

# 获取SSL证书
certbot --nginx -d your_domain.com
```

## 监控和维护

### 1. 查看服务状态
```bash
# 查看应用状态
systemctl status csolflask

# 查看日志
journalctl -u csolflask -f
```

### 2. 更新应用
```bash
cd /var/www/csolflask
git pull
source venv/bin/activate
pip install -r requirements.txt
systemctl restart csolflask
```

## 成本估算

### 阿里云ECS费用（月）
- **2核4GB实例**: 约￥100-200/月
- **带宽费用**: 按流量计费
- **域名**: 约￥50/年
- **SSL证书**: 免费（Let's Encrypt）

### 与Render对比
- **Render免费版**: 0元，但有休眠限制
- **阿里云ECS**: 约￥150/月，但性能更好，无休眠

## 故障排除

### 常见问题
1. **端口被占用**: 检查8000端口是否被占用
2. **权限问题**: 确保www-data用户有正确权限
3. **数据库连接**: 检查防火墙和数据库配置
4. **静态文件**: 确保Nginx配置正确

### 日志查看
```bash
# 应用日志
tail -f /var/log/csolflask.log

# Nginx日志
tail -f /var/log/nginx/access.log
tail -f /var/log/nginx/error.log
``` 