# 阿里云ECS免费试用版部署指南

## 🎯 免费试用版特点

### 配置规格
- **CPU**: 1核
- **内存**: 2GB
- **系统盘**: 40GB ESSD云盘
- **带宽**: 按使用流量计费（有免费额度）
- **地域**: 可选多个地域

### 限制说明
- **试用时长**: 通常12个月
- **性能**: 适合小型应用和测试
- **并发**: 建议并发用户数不超过50
- **存储**: 系统盘40GB，建议预留10GB空间

## 📋 详细部署步骤

### 第一步：购买ECS免费试用实例

#### 1.1 进入免费试用页面
1. 登录阿里云控制台
2. 搜索"免费试用"
3. 找到"云服务器ECS免费试用（个人版）"
4. 点击"立即试用"

#### 1.2 配置实例参数
```
地域和可用区：
- 选择离您最近的区域（如华北2、华东1）
- 可用区选择默认即可

实例规格：
- 实例规格：ecs.t5-lc1m1.small（1核2GB）
- 镜像：Ubuntu 20.04 64位
- 系统盘：40GB ESSD云盘

网络和安全：
- 专有网络VPC：默认
- 交换机：默认
- 安全组：新建安全组
- 带宽：按使用流量计费

登录凭证：
- 登录方式：密码
- 设置root密码（请记住此密码）
```

#### 1.3 安全组配置
创建安全组时添加以下规则：
```
入方向规则：
- 协议类型：SSH
- 端口范围：22/22
- 授权对象：0.0.0.0/0
- 优先级：1

- 协议类型：HTTP
- 端口范围：80/80
- 授权对象：0.0.0.0/0
- 优先级：1

- 协议类型：HTTPS
- 端口范围：443/443
- 授权对象：0.0.0.0/0
- 优先级：1
```

### 第二步：连接服务器

#### 2.1 获取连接信息
1. 在ECS控制台找到您的实例
2. 记录公网IP地址
3. 确认root密码已设置

#### 2.2 使用SSH连接
```bash
# Windows用户推荐使用以下工具之一：

# 1. Windows Terminal (Windows 10/11)
ssh root@your_server_ip

# 2. Git Bash
ssh root@your_server_ip

# 3. PuTTY
# 下载PuTTY，输入IP地址和端口22连接

# 4. WSL (Windows Subsystem for Linux)
ssh root@your_server_ip
```

### 第三步：上传项目文件

#### 3.1 方式一：使用SCP命令（推荐）
```bash
# 在Windows PowerShell或Git Bash中运行
# 替换your_server_ip为您的服务器IP

# 上传整个项目目录
scp -r D:\bt5\csolflask\* root@your_server_ip:/tmp/csolflask/

# 或者分步上传
scp -r D:\bt5\csolflask\*.py root@your_server_ip:/tmp/csolflask/
scp -r D:\bt5\csolflask\static root@your_server_ip:/tmp/csolflask/
scp -r D:\bt5\csolflask\templates root@your_server_ip:/tmp/csolflask/
scp D:\bt5\csolflask\requirements.txt root@your_server_ip:/tmp/csolflask/
scp D:\bt5\csolflask\deploy_aliyun.sh root@your_server_ip:/tmp/csolflask/
```

#### 3.2 方式二：使用SFTP工具
1. 下载FileZilla（免费）
2. 连接信息：
   - 主机：您的服务器IP
   - 用户名：root
   - 密码：您设置的密码
   - 端口：22
3. 上传项目文件到 `/tmp/csolflask/` 目录

#### 3.3 方式三：使用Git克隆
```bash
# 在服务器上运行
cd /tmp
git clone https://github.com/your-username/your-repo.git csolflask
```

### 第四步：执行部署脚本

#### 4.1 进入项目目录
```bash
cd /tmp/csolflask
```

#### 4.2 设置脚本权限
```bash
chmod +x deploy_aliyun.sh
chmod +x update_aliyun.sh
```

#### 4.3 执行部署脚本
```bash
sudo ./deploy_aliyun.sh
```

**注意**: 部署过程可能需要10-15分钟，请耐心等待。

### 第五步：验证部署

#### 5.1 检查服务状态
```bash
# 检查应用服务
systemctl status csolflask

# 检查Nginx服务
systemctl status nginx

# 检查端口监听
netstat -tlnp | grep :80
netstat -tlnp | grep :8000
```

#### 5.2 检查系统资源
```bash
# 查看内存使用
free -h

# 查看磁盘使用
df -h

# 查看进程状态
ps aux | grep -E "(csolflask|nginx)" | grep -v grep
```

#### 5.3 访问应用
在浏览器中访问：`http://your_server_ip`

### 第六步：配置域名（可选）

#### 6.1 域名解析
1. 在阿里云DNS控制台添加A记录
2. 记录类型：A
3. 主机记录：@ 或 www
4. 记录值：您的ECS公网IP

#### 6.2 SSL证书配置
```bash
# 安装Certbot
apt install certbot python3-certbot-nginx -y

# 申请SSL证书（替换为您的域名）
certbot --nginx -d your_domain.com
```

## 🔧 免费试用版优化说明

### 性能优化
- **Worker进程**: 使用1个worker（适应1核CPU）
- **内存限制**: 降低连接数和缓冲区大小
- **Nginx优化**: 简化配置，减少资源占用
- **缓存策略**: 启用gzip压缩和静态文件缓存

### 资源监控
```bash
# 实时监控资源使用
htop

# 查看内存使用详情
cat /proc/meminfo

# 查看CPU使用情况
top

# 查看磁盘IO
iotop
```

### 常见问题解决

#### 1. 内存不足
```bash
# 查看内存使用
free -h

# 清理缓存
sync && echo 3 > /proc/sys/vm/drop_caches

# 重启服务
systemctl restart csolflask
```

#### 2. 磁盘空间不足
```bash
# 查看磁盘使用
df -h

# 清理日志文件
journalctl --vacuum-time=7d

# 清理包缓存
apt clean
```

#### 3. 服务启动失败
```bash
# 查看详细日志
journalctl -u csolflask -f

# 检查配置文件
nginx -t

# 重启服务
systemctl restart csolflask nginx
```

## 📊 性能基准

### 预期性能
- **并发用户**: 10-20个同时在线
- **响应时间**: 1-3秒
- **内存使用**: 1.2-1.8GB
- **CPU使用**: 20-60%

### 监控建议
```bash
# 创建监控脚本
cat > /root/monitor.sh << 'EOF'
#!/bin/bash
echo "=== 系统资源监控 ==="
echo "时间: $(date)"
echo "内存使用:"
free -h
echo ""
echo "磁盘使用:"
df -h
echo ""
echo "服务状态:"
systemctl is-active csolflask
systemctl is-active nginx
EOF

chmod +x /root/monitor.sh

# 添加到定时任务
echo "*/5 * * * * /root/monitor.sh >> /var/log/system_monitor.log" | crontab -
```

## 🚀 升级建议

### 试用期结束后
1. **升级配置**: 考虑升级到2核4GB或更高配置
2. **数据备份**: 定期备份数据库和应用数据
3. **监控告警**: 配置资源使用告警
4. **CDN加速**: 考虑使用阿里云CDN加速静态资源

### 成本优化
- **按量付费**: 根据实际使用情况选择计费方式
- **预留实例**: 长期使用可考虑预留实例
- **带宽优化**: 合理设置带宽上限

## 📞 技术支持

### 阿里云支持
- **工单系统**: 通过控制台提交工单
- **电话支持**: 400-955-9888
- **在线客服**: 控制台右下角在线客服

### 社区支持
- **GitHub Issues**: 项目相关问题
- **技术论坛**: 阿里云开发者社区
- **文档中心**: 阿里云官方文档

## ✅ 部署检查清单

- [ ] ECS实例创建完成
- [ ] 安全组配置正确
- [ ] SSH连接成功
- [ ] 项目文件上传完成
- [ ] 部署脚本执行成功
- [ ] 服务启动正常
- [ ] 应用访问正常
- [ ] 域名解析配置（可选）
- [ ] SSL证书配置（可选）
- [ ] 监控脚本设置（推荐）

部署完成后，您的CSOL KZ地图管理平台就可以在阿里云ECS免费试用版上正常运行了！ 