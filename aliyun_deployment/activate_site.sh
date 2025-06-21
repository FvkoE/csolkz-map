#!/bin/bash

# Nginx 网站配置激活脚本
# 解决 "Welcome to nginx!" 页面的问题

echo "=== 激活 csolflask 网站配置 ==="

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

SITE_CONFIG_NAME="csolflask"
AVAILABLE_SITES_DIR="/etc/nginx/sites-available"
ENABLED_SITES_DIR="/etc/nginx/sites-enabled"

# 1. 检查 csolflask 配置文件是否存在
echo -e "${YELLOW}1. 检查配置文件是否存在...${NC}"
if [ -f "$AVAILABLE_SITES_DIR/$SITE_CONFIG_NAME" ]; then
    echo -e "${GREEN}✓ 配置文件 $AVAILABLE_SITES_DIR/$SITE_CONFIG_NAME 存在。${NC}"
else
    echo -e "${RED}✗ 错误: 配置文件 $AVAILABLE_SITES_DIR/$SITE_CONFIG_NAME 不存在!${NC}"
    echo -e "${RED}请先运行之前的 fix_nginx_config.sh 脚本。${NC}"
    exit 1
fi

# 2. 删除默认的 Nginx 网站配置
echo -e "${YELLOW}2. 删除默认的 Nginx 配置链接...${NC}"
if [ -L "$ENABLED_SITES_DIR/default" ]; then
    sudo rm "$ENABLED_SITES_DIR/default"
    echo -e "${GREEN}✓ 已删除默认配置链接。${NC}"
else
    echo -e "${YELLOW}ℹ️  默认配置链接不存在，无需删除。${NC}"
fi

# 3. 创建 csolflask 网站的符号链接
echo -e "${YELLOW}3. 创建 csolflask 配置的符号链接...${NC}"
if [ -L "$ENABLED_SITES_DIR/$SITE_CONFIG_NAME" ]; then
    echo -e "${YELLOW}ℹ️  符号链接已存在，无需创建。${NC}"
else
    sudo ln -s "$AVAILABLE_SITES_DIR/$SITE_CONFIG_NAME" "$ENABLED_SITES_DIR/$SITE_CONFIG_NAME"
    echo -e "${GREEN}✓ 已创建符号链接。${NC}"
fi

# 4. 显示 sites-enabled 目录内容以供核查
echo -e "${YELLOW}4. 核查已启用的网站...${NC}"
ls -l $ENABLED_SITES_DIR

# 5. 测试 Nginx 配置
echo -e "${YELLOW}5. 测试 Nginx 配置...${NC}"
if sudo nginx -t; then
    echo -e "${GREEN}✓ Nginx 配置测试通过。${NC}"
else
    echo -e "${RED}✗ Nginx 配置测试失败！请检查错误信息。${NC}"
    exit 1
fi

# 6. 重启 Nginx 服务
echo -e "${YELLOW}6. 重启 Nginx 服务...${NC}"
sudo systemctl restart nginx
echo -e "${GREEN}✓ Nginx 服务已重启。${NC}"

echo ""
echo -e "${GREEN}=== 配置激活完成 ===${NC}"
echo -e "${GREEN}现在你的网站应该可以正常访问了。${NC}"
echo -e "${YELLOW}请在浏览器中刷新页面: http://60.205.144.139${NC}" 