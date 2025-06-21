#!/bin/bash

# 快速诊断脚本 - 检查网站无法访问的原因

echo "=== 快速诊断网站访问问题 ==="

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${YELLOW}1. 检查应用服务状态...${NC}"
if systemctl is-active --quiet csolflask; then
    echo -e "${GREEN}✓ csolflask服务正在运行${NC}"
else
    echo -e "${RED}✗ csolflask服务未运行${NC}"
    systemctl status csolflask --no-pager -l
fi

echo -e "${YELLOW}2. 检查Nginx服务状态...${NC}"
if systemctl is-active --quiet nginx; then
    echo -e "${GREEN}✓ Nginx服务正在运行${NC}"
else
    echo -e "${RED}✗ Nginx服务未运行${NC}"
    systemctl status nginx --no-pager -l
fi

echo -e "${YELLOW}3. 检查端口监听...${NC}"
echo "检查8000端口（Flask应用）:"
if netstat -tlnp | grep :8000; then
    echo -e "${GREEN}✓ 8000端口正在监听${NC}"
else
    echo -e "${RED}✗ 8000端口未监听${NC}"
fi

echo "检查80端口（Nginx）:"
if netstat -tlnp | grep :80; then
    echo -e "${GREEN}✓ 80端口正在监听${NC}"
else
    echo -e "${RED}✗ 80端口未监听${NC}"
fi

echo -e "${YELLOW}4. 检查防火墙状态...${NC}"
ufw status

echo -e "${YELLOW}5. 检查Nginx配置...${NC}"
if nginx -t; then
    echo -e "${GREEN}✓ Nginx配置正确${NC}"
else
    echo -e "${RED}✗ Nginx配置有错误${NC}"
fi

echo -e "${YELLOW}6. 检查Nginx配置文件...${NC}"
echo "当前Nginx配置:"
cat /etc/nginx/sites-available/csolflask | head -10

echo -e "${YELLOW}7. 测试本地访问...${NC}"
echo "测试Flask应用（端口8000）:"
curl -s -o /dev/null -w "HTTP状态码: %{http_code}\n" http://localhost:8000 || echo "访问失败"

echo "测试Nginx代理（端口80）:"
curl -s -o /dev/null -w "HTTP状态码: %{http_code}\n" http://localhost || echo "访问失败"

echo -e "${YELLOW}8. 检查应用日志...${NC}"
echo "最近的应用日志:"
journalctl -u csolflask -n 5 --no-pager

echo -e "${YELLOW}9. 检查Nginx日志...${NC}"
echo "最近的Nginx错误日志:"
tail -n 5 /var/log/nginx/error.log 2>/dev/null || echo "错误日志不存在"

echo -e "${YELLOW}10. 检查网络连接...${NC}"
echo "服务器IP地址:"
curl -s ifconfig.me 2>/dev/null || echo "无法获取公网IP"

echo -e "${YELLOW}11. 检查阿里云安全组...${NC}"
echo "请手动检查阿里云控制台中的安全组设置:"
echo "- 入方向规则是否包含80端口"
echo "- 入方向规则是否包含22端口（SSH）"

echo -e "${GREEN}=== 诊断完成 ===${NC}"
echo ""
echo -e "${YELLOW}常见解决方案:${NC}"
echo "1. 如果服务未运行: sudo systemctl start csolflask"
echo "2. 如果Nginx未运行: sudo systemctl start nginx"
echo "3. 如果配置错误: 运行 fix_nginx_config.sh"
echo "4. 如果防火墙阻止: sudo ufw allow 80"
echo "5. 如果安全组问题: 在阿里云控制台开放80端口" 