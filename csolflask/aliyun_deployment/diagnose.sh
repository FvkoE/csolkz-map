#!/bin/bash

# 诊断脚本 - 检查CSOL Flask部署状态

echo "=== CSOL Flask 部署诊断 ==="

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

APP_DIR="/var/www/csolflask"
SERVICE_NAME="csolflask"

echo -e "${YELLOW}1. 检查应用目录...${NC}"
if [ -d "$APP_DIR" ]; then
    echo -e "${GREEN}✓ 应用目录存在: $APP_DIR${NC}"
    ls -la $APP_DIR/
else
    echo -e "${RED}✗ 应用目录不存在: $APP_DIR${NC}"
fi

echo -e "${YELLOW}2. 检查虚拟环境...${NC}"
if [ -d "$APP_DIR/venv" ]; then
    echo -e "${GREEN}✓ 虚拟环境目录存在${NC}"
    ls -la $APP_DIR/venv/bin/ | head -10
else
    echo -e "${RED}✗ 虚拟环境目录不存在${NC}"
fi

echo -e "${YELLOW}3. 检查gunicorn可执行文件...${NC}"
if [ -f "$APP_DIR/venv/bin/gunicorn" ]; then
    echo -e "${GREEN}✓ gunicorn可执行文件存在${NC}"
    ls -la $APP_DIR/venv/bin/gunicorn
else
    echo -e "${RED}✗ gunicorn可执行文件不存在${NC}"
fi

echo -e "${YELLOW}4. 检查requirements.txt...${NC}"
if [ -f "$APP_DIR/requirements.txt" ]; then
    echo -e "${GREEN}✓ requirements.txt存在${NC}"
    cat $APP_DIR/requirements.txt
else
    echo -e "${RED}✗ requirements.txt不存在${NC}"
fi

echo -e "${YELLOW}5. 检查systemd服务配置...${NC}"
if [ -f "/etc/systemd/system/$SERVICE_NAME.service" ]; then
    echo -e "${GREEN}✓ systemd服务配置存在${NC}"
    cat /etc/systemd/system/$SERVICE_NAME.service
else
    echo -e "${RED}✗ systemd服务配置不存在${NC}"
fi

echo -e "${YELLOW}6. 检查服务状态...${NC}"
systemctl status $SERVICE_NAME --no-pager -l

echo -e "${YELLOW}7. 查看最新日志...${NC}"
journalctl -u $SERVICE_NAME -n 10 --no-pager

echo -e "${YELLOW}8. 检查Python版本...${NC}"
python3 --version

echo -e "${YELLOW}9. 检查pip版本...${NC}"
pip3 --version

echo -e "${YELLOW}10. 检查磁盘空间...${NC}"
df -h

echo -e "${YELLOW}11. 检查内存使用...${NC}"
free -h

echo -e "${YELLOW}12. 检查网络连接...${NC}"
netstat -tlnp | grep :80 || echo "端口80未监听"
netstat -tlnp | grep :8000 || echo "端口8000未监听"

echo -e "${YELLOW}13. 检查Nginx状态...${NC}"
systemctl status nginx --no-pager -l

echo -e "${YELLOW}14. 检查防火墙状态...${NC}"
ufw status

echo -e "${GREEN}诊断完成！${NC}" 