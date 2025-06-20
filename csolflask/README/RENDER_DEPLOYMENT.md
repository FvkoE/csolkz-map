# Render部署指南

## 部署步骤

### 1. 准备代码
确保您的代码已推送到GitHub仓库，包含以下文件：
- `app.py` - Flask应用主文件
- `requirements.txt` - Python依赖
- `render.yaml` - Render配置文件
- `render_start.sh` - 启动脚本

### 2. 注册Render账号
1. 访问 [render.com](https://render.com)
2. 使用GitHub账号注册
3. 验证邮箱

### 3. 创建Web Service
1. 点击 "New +" 按钮
2. 选择 "Web Service"
3. 连接您的GitHub仓库
4. 选择包含Flask代码的仓库

### 4. 配置部署设置
- **Name**: csolflask-app (或您喜欢的名称)
- **Environment**: Python 3
- **Build Command**: `pip install -r requirements.txt`
- **Start Command**: `gunicorn app:app --bind 0.0.0.0:$PORT`
- **Plan**: Free

### 5. 配置环境变量
在 "Environment" 标签页中添加：
```
SECRET_KEY=your_secret_key_here
DB_USER=fvckyopue
DB_PASSWORD=d5kQa7pzXbrHUg8A
DB_HOST=mysql2.sqlpub.com
DB_PORT=3307
DB_NAME=csolkz
```

### 6. 部署应用
1. 点击 "Create Web Service"
2. Render会自动开始构建和部署
3. 等待部署完成（通常需要2-5分钟）

### 7. 获取访问地址
部署完成后，您会得到一个类似这样的URL：
`https://your-app-name.onrender.com`

## 注意事项

### 免费版限制
- **休眠机制**: 15分钟无访问会自动休眠
- **唤醒时间**: 首次访问需要等待30秒-2分钟唤醒
- **运行时间**: 每月750小时免费额度

### 性能优化
- 使用单worker模式（免费版限制）
- 设置合理的超时时间
- 启用健康检查

### 数据库连接
- 确保数据库服务器允许外部连接
- 检查防火墙设置
- 验证数据库凭据

## 故障排除

### 常见问题
1. **构建失败**: 检查requirements.txt格式
2. **启动失败**: 检查环境变量配置
3. **数据库连接失败**: 验证数据库配置
4. **应用休眠**: 这是正常现象，等待唤醒即可

### 查看日志
在Render控制台的 "Logs" 标签页查看详细日志信息。

## 更新部署
每次推送到GitHub主分支，Render会自动重新部署。 