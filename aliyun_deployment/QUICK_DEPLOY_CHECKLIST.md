# 快速部署检查清单

## 🎯 您的服务器信息
- **公网IP**: 60.205.144.139
- **配置**: 2核2GB
- **系统**: Ubuntu 22.04 64位
- **带宽**: 100Mbps

## ✅ 部署步骤检查清单

### 第一步：连接服务器
- [ ] 打开PowerShell或Git Bash
- [ ] 运行: `ssh root@60.205.144.139`
- [ ] 输入root密码
- [ ] 确认连接成功

### 第二步：上传项目文件
选择以下方式之一：

#### 方式A：SCP命令（推荐）
- [ ] 运行: `scp -r D:\bt5\csolflask\* root@60.205.144.139:/tmp/csolflask/`
- [ ] 确认文件上传完成

#### 方式B：SFTP工具
- [ ] 下载FileZilla
- [ ] 连接信息：
  - 主机：60.205.144.139
  - 用户名：root
  - 密码：您的密码
  - 端口：22
- [ ] 上传文件到 `/tmp/csolflask/`

### 第三步：执行部署
- [ ] 在服务器上运行: `cd /tmp/csolflask`
- [ ] 设置权限: `chmod +x deploy_aliyun.sh`
- [ ] 执行部署: `sudo ./deploy_aliyun.sh`
- [ ] 等待部署完成（10-15分钟）

### 第四步：验证部署
- [ ] 检查服务状态: `systemctl status csolflask`
- [ ] 检查Nginx状态: `systemctl status nginx`
- [ ] 在浏览器访问: `http://60.205.144.139`
- [ ] 确认应用正常运行

## 🔧 常用命令

### 服务管理
```bash
# 查看应用状态
systemctl status csolflask

# 重启应用
systemctl restart csolflask

# 查看应用日志
journalctl -u csolflask -f

# 查看Nginx状态
systemctl status nginx

# 重启Nginx
systemctl restart nginx
```

### 系统监控
```bash
# 查看资源使用
htop

# 查看内存使用
free -h

# 查看磁盘使用
df -h

# 查看端口监听
netstat -tlnp | grep :80
netstat -tlnp | grep :8000
```

### 文件管理
```bash
# 查看应用目录
ls -la /var/www/csolflask/

# 查看日志目录
ls -la /var/log/csolflask/

# 查看配置文件
cat /var/www/csolflask/.env
```

## 🚨 故障排除

### 如果连接失败
```bash
# 检查网络连接
ping 60.205.144.139

# 检查SSH服务
telnet 60.205.144.139 22
```

### 如果服务启动失败
```bash
# 查看详细错误日志
journalctl -u csolflask -f

# 检查配置文件
nginx -t

# 检查端口占用
lsof -i :8000
lsof -i :80
```

### 如果应用无法访问
```bash
# 检查防火墙
ufw status

# 检查安全组规则
# 在阿里云控制台确认80端口已开放

# 检查Nginx配置
nginx -t
```

## 📞 需要帮助时

### 查看部署日志
```bash
# 查看部署脚本输出
tail -f /var/log/csolflask/error.log

# 查看系统日志
journalctl -u csolflask --since "10 minutes ago"
```

### 重启整个部署
```bash
# 停止服务
systemctl stop csolflask nginx

# 清理并重新部署
rm -rf /var/www/csolflask/*
cd /tmp/csolflask
sudo ./deploy_aliyun.sh
```

## 🎉 部署成功标志

- ✅ 浏览器访问 `http://60.205.144.139` 显示应用页面
- ✅ 地图列表正常显示
- ✅ 图片上传功能正常
- ✅ 管理员登录功能正常

## 📝 后续配置（可选）

### 域名配置
1. 购买域名
2. 在阿里云DNS控制台添加A记录
3. 记录值：60.205.144.139

### SSL证书配置
```bash
# 安装Certbot
apt install certbot python3-certbot-nginx -y

# 申请证书
certbot --nginx -d your_domain.com
```

### 监控配置
```bash
# 创建监控脚本
cat > /root/monitor.sh << 'EOF'
#!/bin/bash
echo "=== 系统监控 $(date) ==="
echo "内存: $(free -h | grep Mem | awk '{print $3"/"$2}')"
echo "磁盘: $(df -h / | tail -1 | awk '{print $3"/"$2}')"
echo "服务: $(systemctl is-active csolflask)"
EOF

chmod +x /root/monitor.sh
```

---

**部署完成后，您的CSOL KZ地图管理平台就可以通过 `http://60.205.144.139` 访问了！** 