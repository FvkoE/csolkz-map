# 简化部署指南

## 🔧 SSH连接问题解决

### 问题分析
您遇到的错误 `Permission denied (publickey)` 表示服务器配置了密钥认证，而不是密码认证。

### 解决方案

#### 方案1：重置密码（推荐）
1. **登录阿里云控制台**
2. **进入ECS实例管理**
3. **选择您的实例** (60.205.144.139)
4. **点击"更多" → "密码/密钥" → "重置实例密码"**
5. **设置新密码**（请记住这个密码）
6. **重启实例**（密码生效需要重启）

#### 方案2：使用密钥对
如果您有密钥文件：
```bash
ssh -i your_key.pem root@60.205.144.139
```

#### 方案3：使用阿里云控制台
1. 在ECS控制台点击"远程连接"
2. 选择"VNC远程连接"
3. 使用控制台直接操作

## 🚀 替代部署方案

### 方案A：使用阿里云控制台部署

#### 1. 通过控制台连接
1. 在ECS控制台点击"远程连接"
2. 选择"VNC远程连接"
3. 输入VNC密码（首次使用需要设置）

#### 2. 在控制台中执行命令
```bash
# 更新系统
apt update && apt upgrade -y

# 安装必要软件
apt install -y python3 python3-pip python3-venv nginx git curl

# 创建应用目录
mkdir -p /var/www/csolflask
cd /var/www/csolflask

# 下载项目文件（通过Git）
git clone https://github.com/your-username/your-repo.git .
# 或者手动上传文件
```

#### 3. 手动部署步骤
```bash
# 创建虚拟环境
python3 -m venv venv
source venv/bin/activate

# 安装依赖
pip install -r requirements.txt

# 创建环境变量
cat > .env << EOF
DEPLOYMENT_ENV=aliyun
SECRET_KEY=$(openssl rand -hex 32)
DB_USER=fvckyopue
DB_PASSWORD=d5kQa7pzXbrHUg8A
DB_HOST=mysql2.sqlpub.com
DB_PORT=3307
DB_NAME=csolkz
IMGBB_API_KEY=cbcb80fb8d641b6cc945f5797a7fab95
EOF

# 创建Gunicorn配置
cat > gunicorn.conf.py << 'EOF'
bind = "127.0.0.1:8000"
workers = 2
worker_class = "sync"
worker_connections = 800
timeout = 30
keepalive = 2
max_requests = 800
max_requests_jitter = 100
preload_app = True
accesslog = "/var/log/csolflask/access.log"
errorlog = "/var/log/csolflask/error.log"
loglevel = "info"
proc_name = "csolflask"
user = "www-data"
group = "www-data"
chdir = "/var/www/csolflask"
raw_env = ["DEPLOYMENT_ENV=aliyun"]
worker_tmp_dir = "/dev/shm"
EOF

# 创建Systemd服务
cat > /etc/systemd/system/csolflask.service << 'EOF'
[Unit]
Description=CSOL Flask Application
After=network.target
Wants=network.target

[Service]
Type=notify
User=www-data
Group=www-data
WorkingDirectory=/var/www/csolflask
Environment="PATH=/var/www/csolflask/venv/bin"
Environment="DEPLOYMENT_ENV=aliyun"
ExecStart=/var/www/csolflask/venv/bin/gunicorn --config gunicorn.conf.py app:app
ExecReload=/bin/kill -s HUP $MAINPID
KillMode=mixed
TimeoutStopSec=5
PrivateTmp=true
Restart=always
RestartSec=10
StandardOutput=journal
StandardError=journal
SyslogIdentifier=csolflask
NoNewPrivileges=true
ProtectSystem=strict
ProtectHome=true
ReadWritePaths=/var/www/csolflask /var/log/csolflask

[Install]
WantedBy=multi-user.target
EOF

# 创建日志目录
mkdir -p /var/log/csolflask
chown -R www-data:www-data /var/www/csolflask /var/log/csolflask

# 配置Nginx
cat > /etc/nginx/sites-available/csolflask << 'EOF'
server {
    listen 80;
    server_name 60.205.144.139;
    
    client_max_body_size 16M;
    
    location /static/ {
        alias /var/www/csolflask/static/;
        expires 30d;
        add_header Cache-Control "public, immutable";
    }
    
    location / {
        proxy_pass http://127.0.0.1:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_connect_timeout 15s;
        proxy_send_timeout 15s;
        proxy_read_timeout 15s;
        proxy_buffering on;
        proxy_buffer_size 2k;
        proxy_buffers 4 2k;
    }
    
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    server_tokens off;
}
EOF

# 启用站点
ln -sf /etc/nginx/sites-available/csolflask /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default

# 测试Nginx配置
nginx -t

# 启动服务
systemctl daemon-reload
systemctl enable csolflask
systemctl start csolflask
systemctl enable nginx
systemctl start nginx

# 配置防火墙
ufw allow 22/tcp
ufw allow 80/tcp
ufw allow 443/tcp
ufw --force enable

# 检查服务状态
systemctl status csolflask
systemctl status nginx
```

### 方案B：使用Docker部署

#### 1. 安装Docker
```bash
# 安装Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sh get-docker.sh

# 启动Docker
systemctl start docker
systemctl enable docker
```

#### 2. 创建Dockerfile
```bash
cat > Dockerfile << 'EOF'
FROM python:3.9-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install -r requirements.txt

COPY . .

EXPOSE 8000

CMD ["gunicorn", "--bind", "0.0.0.0:8000", "--workers", "2", "app:app"]
EOF
```

#### 3. 构建和运行
```bash
# 构建镜像
docker build -t csolflask .

# 运行容器
docker run -d -p 80:8000 --name csolflask-app csolflask
```

## 📞 获取帮助

### 如果仍然无法连接
1. **检查安全组设置**：确保22端口已开放
2. **联系阿里云支持**：通过控制台提交工单
3. **使用VNC连接**：通过控制台直接操作

### 推荐操作顺序
1. 先尝试重置密码方案
2. 如果不行，使用VNC控制台连接
3. 在控制台中手动执行部署命令

## ✅ 验证部署

部署完成后，在浏览器中访问：
`http://60.205.144.139`

如果看到CSOL KZ地图管理平台的页面，说明部署成功！

## 🔧 常用命令

```bash
# 查看服务状态
systemctl status csolflask
systemctl status nginx

# 查看日志
journalctl -u csolflask -f
tail -f /var/log/nginx/access.log

# 重启服务
systemctl restart csolflask
systemctl restart nginx

# 查看端口监听
netstat -tlnp | grep :80
netstat -tlnp | grep :8000
``` 