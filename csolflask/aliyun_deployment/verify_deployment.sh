#!/bin/bash

# 验证CSOL Flask部署成功脚本

echo "=== 验证CSOL Flask部署状态 ==="

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${YELLOW}1. 检查服务状态...${NC}"
systemctl status csolflask --no-pager -l

echo -e "${YELLOW}2. 检查进程状态...${NC}"
ps aux | grep gunicorn | grep -v grep

echo -e "${YELLOW}3. 检查端口监听...${NC}"
netstat -tlnp | grep :8000 || echo "端口8000未监听"
netstat -tlnp | grep :80 || echo "端口80未监听"

echo -e "${YELLOW}4. 测试本地访问...${NC}"
curl -s -o /dev/null -w "HTTP状态码: %{http_code}\n" http://localhost:8000 || echo "本地访问失败"

echo -e "${YELLOW}5. 检查Nginx状态...${NC}"
systemctl status nginx --no-pager -l

echo -e "${YELLOW}6. 测试Nginx代理...${NC}"
curl -s -o /dev/null -w "HTTP状态码: %{http_code}\n" http://localhost || echo "Nginx代理失败"

echo -e "${YELLOW}7. 检查防火墙状态...${NC}"
ufw status

echo -e "${YELLOW}8. 检查系统资源...${NC}"
echo "内存使用:"
free -h
echo ""
echo "磁盘使用:"
df -h

echo -e "${YELLOW}9. 检查应用日志...${NC}"
echo "最近的应用日志:"
journalctl -u csolflask -n 5 --no-pager

echo -e "${YELLOW}10. 检查Nginx日志...${NC}"
echo "最近的Nginx访问日志:"
tail -n 5 /var/log/nginx/access.log 2>/dev/null || echo "Nginx访问日志不存在"
echo ""
echo "最近的Nginx错误日志:"
tail -n 5 /var/log/nginx/error.log 2>/dev/null || echo "Nginx错误日志不存在"

echo -e "${GREEN}=== 验证完成 ===${NC}"
echo -e "${GREEN}如果所有检查都通过，你的CSOL Flask应用已经成功部署！${NC}"
echo ""
echo -e "${YELLOW}访问地址:${NC}"
echo "本地访问: http://localhost:8000"
echo "公网访问: http://60.205.144.139"
echo ""
echo -e "${YELLOW}下一步建议:${NC}"
echo "1. 在浏览器中访问 http://60.205.144.139 测试网站"
echo "2. 测试管理员登录功能"
echo "3. 测试地图上传功能"
echo "4. 配置域名和SSL证书" 