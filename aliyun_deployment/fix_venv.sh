#!/bin/bash

# 修复虚拟环境脚本
# 解决 gunicorn 找不到的问题

set -e

echo "=== 修复CSOL Flask虚拟环境 ==="

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

APP_DIR="/var/www/csolflask"
SERVICE_NAME="csolflask"

echo -e "${YELLOW}1. 停止服务...${NC}"
systemctl stop $SERVICE_NAME || true

echo -e "${YELLOW}2. 检查当前目录结构...${NC}"
ls -la $APP_DIR/

echo -e "${YELLOW}3. 删除旧的虚拟环境...${NC}"
rm -rf $APP_DIR/venv

echo -e "${YELLOW}4. 重新创建虚拟环境...${NC}"
cd $APP_DIR
python3 -m venv venv

echo -e "${YELLOW}5. 激活虚拟环境并升级pip...${NC}"
source venv/bin/activate
pip install --upgrade pip

echo -e "${YELLOW}6. 安装依赖...${NC}"
pip install --no-cache-dir -r requirements.txt

echo -e "${YELLOW}7. 验证gunicorn安装...${NC}"
which gunicorn
gunicorn --version

echo -e "${YELLOW}8. 检查虚拟环境中的可执行文件...${NC}"
ls -la venv/bin/ | grep gunicorn

echo -e "${YELLOW}9. 设置正确的权限...${NC}"
chown -R www-data:www-data $APP_DIR
chmod +x venv/bin/gunicorn

echo -e "${YELLOW}10. 重新加载systemd配置...${NC}"
systemctl daemon-reload

echo -e "${YELLOW}11. 启动服务...${NC}"
systemctl start $SERVICE_NAME

echo -e "${YELLOW}12. 检查服务状态...${NC}"
systemctl status $SERVICE_NAME --no-pager -l

echo -e "${YELLOW}13. 查看最新日志...${NC}"
journalctl -u $SERVICE_NAME -n 20 --no-pager

echo -e "${GREEN}修复完成！${NC}" 