@echo off
echo === CSOL Flask 部署文件准备工具 ===

echo.
echo 正在检查部署文件...

REM 检查必要文件是否存在
if not exist "deploy_aliyun.sh" (
    echo [错误] deploy_aliyun.sh 文件不存在
    goto :error
)

if not exist "update_aliyun.sh" (
    echo [错误] update_aliyun.sh 文件不存在
    goto :error
)

if not exist "gunicorn.conf.py" (
    echo [错误] gunicorn.conf.py 文件不存在
    goto :error
)

if not exist "nginx.conf" (
    echo [错误] nginx.conf 文件不存在
    goto :error
)

if not exist "systemd.service" (
    echo [错误] systemd.service 文件不存在
    goto :error
)

echo [成功] 所有部署文件检查完成
echo.

echo === 部署文件清单 ===
echo 1. deploy_aliyun.sh - 阿里云初始部署脚本
echo 2. update_aliyun.sh - 阿里云更新脚本
echo 3. gunicorn.conf.py - Gunicorn配置文件
echo 4. nginx.conf - Nginx配置文件
echo 5. systemd.service - Systemd服务配置
echo 6. ALIYUN_DEPLOYMENT.md - 阿里云部署指南
echo 7. DEPLOYMENT_COMPARISON.md - 多平台部署对比
echo.

echo === 部署步骤 ===
echo 1. 购买阿里云ECS实例（Ubuntu 20.04/22.04）
echo 2. 使用SSH连接到服务器
echo 3. 上传项目文件到服务器
echo 4. 在服务器上运行: chmod +x deploy_aliyun.sh
echo 5. 在服务器上运行: sudo ./deploy_aliyun.sh
echo 6. 配置域名和SSL证书
echo.

echo === 注意事项 ===
echo - 确保服务器有足够的磁盘空间（至少40GB）
echo - 确保服务器能够访问外网
echo - 部署前请备份重要数据
echo - 建议在测试环境先验证部署流程
echo.

echo === 文件上传方式 ===
echo 方式1: 使用scp命令
echo    scp -r ./* root@your_server_ip:/tmp/csolflask/
echo.
echo 方式2: 使用SFTP工具（如FileZilla）
echo.
echo 方式3: 使用Git克隆
echo    git clone https://github.com/your-username/your-repo.git
echo.

echo === 部署完成后的验证 ===
echo 1. 检查服务状态: systemctl status csolflask
echo 2. 检查Nginx状态: systemctl status nginx
echo 3. 访问应用: http://your_server_ip
echo 4. 查看日志: journalctl -u csolflask -f
echo.

echo 准备完成！请按照上述步骤进行部署。
goto :end

:error
echo.
echo 请确保所有必要的部署文件都存在。
pause
exit /b 1

:end
echo.
pause 