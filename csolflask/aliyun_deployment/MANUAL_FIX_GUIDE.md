# CSOL Flask 阿里云部署手动修复指南

## 问题描述
系统服务启动失败，错误信息：`Failed to locate executable /var/www/csolflask/venv/bin/gunicorn: No such file or directory`

## 根本原因
虚拟环境没有正确创建或者 gunicorn 没有安装到虚拟环境中。

## 修复步骤

### 1. 停止服务
```bash
sudo systemctl stop csolflask
```

### 2. 检查当前状态
```bash
# 检查应用目录
ls -la /var/www/csolflask/

# 检查虚拟环境
ls -la /var/www/csolflask/venv/bin/ | grep gunicorn
```

### 3. 重新创建虚拟环境
```bash
# 进入应用目录
cd /var/www/csolflask

# 删除旧的虚拟环境
sudo rm -rf venv

# 重新创建虚拟环境
sudo python3 -m venv venv

# 激活虚拟环境
source venv/bin/activate

# 升级pip
pip install --upgrade pip

# 安装依赖
pip install --no-cache-dir -r requirements.txt
```

### 4. 验证安装
```bash
# 检查gunicorn是否安装
which gunicorn
gunicorn --version

# 检查虚拟环境中的可执行文件
ls -la venv/bin/ | grep gunicorn
```

### 5. 设置权限
```bash
# 设置目录权限
sudo chown -R www-data:www-data /var/www/csolflask
sudo chmod +x venv/bin/gunicorn
```

### 6. 重新加载服务
```bash
# 重新加载systemd配置
sudo systemctl daemon-reload

# 启动服务
sudo systemctl start csolflask

# 检查服务状态
sudo systemctl status csolflask
```

### 7. 查看日志
```bash
# 查看最新日志
sudo journalctl -u csolflask -n 20 --no-pager
```

## 自动化修复脚本

如果手动修复太复杂，可以使用提供的修复脚本：

```bash
# 上传修复脚本到服务器
# 然后执行：
chmod +x fix_venv.sh
sudo ./fix_venv.sh
```

## 诊断脚本

使用诊断脚本检查系统状态：

```bash
chmod +x diagnose.sh
sudo ./diagnose.sh
```

## 常见问题

### 问题1：权限不足
```bash
# 确保使用sudo运行命令
sudo python3 -m venv venv
```

### 问题2：Python版本问题
```bash
# 检查Python版本
python3 --version

# 如果版本太旧，更新Python
sudo apt update
sudo apt install python3.9 python3.9-venv
```

### 问题3：网络问题导致pip安装失败
```bash
# 使用国内镜像源
pip install -i https://pypi.tuna.tsinghua.edu.cn/simple --no-cache-dir -r requirements.txt
```

### 问题4：磁盘空间不足
```bash
# 检查磁盘空间
df -h

# 清理不需要的文件
sudo apt autoremove
sudo apt autoclean
```

## 验证修复结果

修复完成后，验证以下项目：

1. ✅ 服务状态正常：`systemctl status csolflask`
2. ✅ 没有错误日志：`journalctl -u csolflask -f`
3. ✅ 网站可以访问：`curl http://localhost:8000`
4. ✅ Nginx正常：`systemctl status nginx`

## 预防措施

1. 定期备份虚拟环境
2. 监控磁盘空间
3. 设置日志轮转
4. 配置监控告警

## 联系支持

如果问题仍然存在，请提供以下信息：
- 诊断脚本输出结果
- 系统日志
- 错误截图 