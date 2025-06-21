#!/bin/bash

# 修复Nginx配置脚本
# 将server_name改为正确的IP地址

echo "=== 修复Nginx配置 ==="

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

# 获取服务器IP地址
SERVER_IP=$(curl -s ifconfig.me 2>/dev/null || echo "60.205.144.139")

echo -e "${YELLOW}检测到服务器IP: $SERVER_IP${NC}"

# 备份原配置
echo -e "${YELLOW}1. 备份原Nginx配置...${NC}"
sudo cp /etc/nginx/sites-available/csolflask /etc/nginx/sites-available/csolflask.backup

# 创建新的Nginx配置
echo -e "${YELLOW}2. 创建新的Nginx配置...${NC}"
sudo tee /etc/nginx/sites-available/csolflask > /dev/null << EOF
# Nginx配置文件
# 用于阿里云ECS部署

server {
    listen 80;
    server_name $SERVER_IP _;  # 使用实际IP地址
    
    # 客户端最大请求体大小
    client_max_body_size 16M;
    
    # 静态文件缓存
    location /static/ {
        alias /var/www/csolflask/static/;
        expires 30d;
        add_header Cache-Control "public, immutable";
        
        # 图片文件特殊处理
        location ~* \.(jpg|jpeg|png|gif|webp)$ {
            expires 1y;
            add_header Cache-Control "public, immutable";
        }
    }
    
    # 代理到Flask应用
    location / {
        proxy_pass http://127.0.0.1:8000;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        
        # 超时设置
        proxy_connect_timeout 30s;
        proxy_send_timeout 30s;
        proxy_read_timeout 30s;
        
        # 缓冲设置
        proxy_buffering on;
        proxy_buffer_size 4k;
        proxy_buffers 8 4k;
    }
    
    # 安全头设置
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;
    
    # 隐藏Nginx版本
    server_tokens off;
    
    # 错误页面
    error_page 404 /404.html;
    error_page 500 502 503 504 /50x.html;
    
    location = /50x.html {
        root /usr/share/nginx/html;
    }
}
EOF

# 测试Nginx配置
echo -e "${YELLOW}3. 测试Nginx配置...${NC}"
if sudo nginx -t; then
    echo -e "${GREEN}✓ Nginx配置测试通过${NC}"
else
    echo -e "${RED}✗ Nginx配置测试失败${NC}"
    exit 1
fi

# 重启Nginx
echo -e "${YELLOW}4. 重启Nginx服务...${NC}"
sudo systemctl restart nginx

# 检查Nginx状态
echo -e "${YELLOW}5. 检查Nginx状态...${NC}"
sudo systemctl status nginx --no-pager -l

# 检查端口监听
echo -e "${YELLOW}6. 检查端口监听...${NC}"
netstat -tlnp | grep :80 || echo "端口80未监听"

# 检查防火墙
echo -e "${YELLOW}7. 检查防火墙状态...${NC}"
sudo ufw status

# 测试本地访问
echo -e "${YELLOW}8. 测试本地访问...${NC}"
curl -s -o /dev/null -w "HTTP状态码: %{http_code}\n" http://localhost || echo "本地访问失败"

echo -e "${GREEN}=== 修复完成 ===${NC}"
echo -e "${GREEN}现在可以尝试访问: http://$SERVER_IP${NC}"
echo ""
echo -e "${YELLOW}如果仍然无法访问，请检查:${NC}"
echo "1. 阿里云安全组是否开放了80端口"
echo "2. 服务器防火墙是否允许80端口"
echo "3. 应用服务是否正常运行" 