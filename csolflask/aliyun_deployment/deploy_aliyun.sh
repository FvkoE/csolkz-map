#!/bin/bash

# 阿里云ECS部署脚本
# 针对2核2GB配置优化
# 使用方法: ./deploy_aliyun.sh

set -e  # 遇到错误立即退出

echo "=== CSOL Flask 阿里云ECS 2核2GB部署脚本 ==="

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 检查是否为root用户
if [ "$EUID" -ne 0 ]; then
    echo -e "${RED}请使用root用户运行此脚本${NC}"
    exit 1
fi

# 配置变量
APP_NAME="csolflask"
APP_DIR="/var/www/$APP_NAME"
SERVICE_NAME="$APP_NAME"
NGINX_SITE="$APP_NAME"

echo -e "${GREEN}开始部署 $APP_NAME 到阿里云ECS 2核2GB...${NC}"

# 1. 更新系统
echo -e "${YELLOW}1. 更新系统包...${NC}"
apt update
apt upgrade -y --no-install-recommends

# 2. 安装必要软件
echo -e "${YELLOW}2. 安装必要软件...${NC}"
apt install -y --no-install-recommends \
    python3 \
    python3-pip \
    python3-venv \
    nginx \
    git \
    curl \
    openssl \
    htop

# 3. 创建应用目录
echo -e "${YELLOW}3. 创建应用目录...${NC}"
mkdir -p $APP_DIR
mkdir -p /var/log/$APP_NAME

# 4. 设置目录权限
echo -e "${YELLOW}4. 设置目录权限...${NC}"
chown -R www-data:www-data $APP_DIR
chown -R www-data:www-data /var/log/$APP_NAME

# 5. 创建Python虚拟环境
echo -e "${YELLOW}5. 创建Python虚拟环境...${NC}"
cd $APP_DIR
python3 -m venv venv
source venv/bin/activate

# 6. 安装Python依赖
echo -e "${YELLOW}6. 安装Python依赖...${NC}"
pip install --upgrade pip
pip install --no-cache-dir -r requirements.txt

# 7. 创建环境变量文件
echo -e "${YELLOW}7. 创建环境变量文件...${NC}"
cat > $APP_DIR/.env << EOF
DEPLOYMENT_ENV=aliyun
SECRET_KEY=$(openssl rand -hex 32)
DB_USER=fvckyopue
DB_PASSWORD=d5kQa7pzXbrHUg8A
DB_HOST=mysql2.sqlpub.com
DB_PORT=3307
DB_NAME=csolkz
IMGBB_API_KEY=cbcb80fb8d641b6cc945f5797a7fab95
EOF

# 8. 配置Gunicorn
echo -e "${YELLOW}8. 配置Gunicorn...${NC}"
cp gunicorn.conf.py $APP_DIR/

# 9. 创建Systemd服务
echo -e "${YELLOW}9. 创建Systemd服务...${NC}"
cp systemd.service /etc/systemd/system/$SERVICE_NAME.service
systemctl daemon-reload

# 10. 配置Nginx
echo -e "${YELLOW}10. 配置Nginx...${NC}"
cp nginx.conf /etc/nginx/sites-available/$NGINX_SITE
ln -sf /etc/nginx/sites-available/$NGINX_SITE /etc/nginx/sites-enabled/

# 删除默认站点
rm -f /etc/nginx/sites-enabled/default

# 优化Nginx配置（针对2核2GB）
cat > /etc/nginx/nginx.conf << 'EOF'
user www-data;
worker_processes 2;
pid /run/nginx.pid;

events {
    worker_connections 512;
    use epoll;
    multi_accept on;
}

http {
    sendfile on;
    tcp_nopush on;
    tcp_nodelay on;
    keepalive_timeout 65;
    types_hash_max_size 2048;
    client_max_body_size 16M;

    include /etc/nginx/mime.types;
    default_type application/octet-stream;

    access_log /var/log/nginx/access.log;
    error_log /var/log/nginx/error.log;

    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css text/xml text/javascript application/javascript application/xml+rss application/json;

    include /etc/nginx/conf.d/*.conf;
    include /etc/nginx/sites-enabled/*;
}
EOF

# 测试Nginx配置
nginx -t

# 11. 启动服务
echo -e "${YELLOW}11. 启动服务...${NC}"
systemctl enable $SERVICE_NAME
systemctl start $SERVICE_NAME
systemctl enable nginx
systemctl start nginx

# 12. 配置防火墙
echo -e "${YELLOW}12. 配置防火墙...${NC}"
ufw allow 22/tcp
ufw allow 80/tcp
ufw allow 443/tcp
ufw --force enable

# 13. 检查服务状态
echo -e "${YELLOW}13. 检查服务状态...${NC}"
echo "=== 服务状态 ==="
systemctl status $SERVICE_NAME --no-pager -l
echo ""
systemctl status nginx --no-pager -l

# 14. 显示系统资源使用情况
echo -e "${YELLOW}14. 系统资源使用情况...${NC}"
echo "=== 内存使用 ==="
free -h
echo ""
echo "=== 磁盘使用 ==="
df -h
echo ""
echo "=== 进程状态 ==="
ps aux | grep -E "(csolflask|nginx)" | grep -v grep

# 15. 显示部署信息
echo -e "${GREEN}=== 部署完成 ===${NC}"
echo -e "${GREEN}应用目录: $APP_DIR${NC}"
echo -e "${GREEN}服务名称: $SERVICE_NAME${NC}"
echo -e "${GREEN}日志目录: /var/log/$APP_NAME${NC}"
echo ""
echo -e "${YELLOW}常用命令:${NC}"
echo "查看应用状态: systemctl status $SERVICE_NAME"
echo "重启应用: systemctl restart $SERVICE_NAME"
echo "查看日志: journalctl -u $SERVICE_NAME -f"
echo "查看Nginx状态: systemctl status nginx"
echo "查看资源使用: htop"
echo ""
echo -e "${YELLOW}2核2GB配置优化说明:${NC}"
echo "- 使用2个worker进程（充分利用2核CPU）"
echo "- 优化内存和连接数配置"
echo "- 启用gzip压缩和缓存"
echo "- 配置防火墙规则"
echo ""
echo -e "${YELLOW}下一步操作:${NC}"
echo "1. 测试应用访问: http://60.205.144.139"
echo "2. 配置域名解析到服务器IP"
echo "3. 申请SSL证书: certbot --nginx -d your_domain.com"
echo "4. 监控资源使用情况"

echo -e "${GREEN}部署完成！${NC}" 