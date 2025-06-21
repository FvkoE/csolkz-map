#!/bin/bash

# 阿里云ECS应用更新脚本
# 使用方法: ./update_aliyun.sh

set -e  # 遇到错误立即退出

echo "=== CSOL Flask 阿里云更新脚本 ==="

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 配置变量
APP_NAME="csolflask"
APP_DIR="/var/www/$APP_NAME"
SERVICE_NAME="$APP_NAME"

echo -e "${GREEN}开始更新 $APP_NAME...${NC}"

# 检查应用目录是否存在
if [ ! -d "$APP_DIR" ]; then
    echo -e "${RED}应用目录不存在: $APP_DIR${NC}"
    echo -e "${YELLOW}请先运行 deploy_aliyun.sh 进行初始部署${NC}"
    exit 1
fi

# 1. 备份当前版本
echo -e "${YELLOW}1. 备份当前版本...${NC}"
BACKUP_DIR="/var/backups/$APP_NAME/$(date +%Y%m%d_%H%M%S)"
mkdir -p $BACKUP_DIR
cp -r $APP_DIR/* $BACKUP_DIR/
echo -e "${GREEN}备份完成: $BACKUP_DIR${NC}"

# 2. 进入应用目录
cd $APP_DIR

# 3. 拉取最新代码
echo -e "${YELLOW}2. 拉取最新代码...${NC}"
if [ -d ".git" ]; then
    git fetch origin
    git reset --hard origin/main
else
    echo -e "${YELLOW}未检测到Git仓库，请手动更新代码${NC}"
fi

# 4. 激活虚拟环境
echo -e "${YELLOW}3. 激活虚拟环境...${NC}"
source venv/bin/activate

# 5. 更新Python依赖
echo -e "${YELLOW}4. 更新Python依赖...${NC}"
pip install --upgrade pip
pip install -r requirements.txt

# 6. 设置文件权限
echo -e "${YELLOW}5. 设置文件权限...${NC}"
chown -R www-data:www-data $APP_DIR

# 7. 重启应用服务
echo -e "${YELLOW}6. 重启应用服务...${NC}"
systemctl restart $SERVICE_NAME

# 8. 检查服务状态
echo -e "${YELLOW}7. 检查服务状态...${NC}"
if systemctl is-active --quiet $SERVICE_NAME; then
    echo -e "${GREEN}服务启动成功${NC}"
else
    echo -e "${RED}服务启动失败，查看日志:${NC}"
    journalctl -u $SERVICE_NAME --no-pager -l
    exit 1
fi

# 9. 清理旧备份（保留最近5个）
echo -e "${YELLOW}8. 清理旧备份...${NC}"
cd /var/backups/$APP_NAME
ls -t | tail -n +6 | xargs -r rm -rf

# 10. 显示更新信息
echo -e "${GREEN}=== 更新完成 ===${NC}"
echo -e "${GREEN}应用目录: $APP_DIR${NC}"
echo -e "${GREEN}备份目录: $BACKUP_DIR${NC}"
echo ""
echo -e "${YELLOW}服务状态:${NC}"
systemctl status $SERVICE_NAME --no-pager -l

echo -e "${GREEN}更新完成！${NC}" 