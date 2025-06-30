# CSOL KZ 地图管理平台 - 注册功能隔离指南

## 📋 概述

本指南介绍如何独立运行注册功能，避免与主应用产生冲突。注册功能包含邮箱验证码验证，确保用户邮箱的真实性。

## 🚀 快速开始

### 1. 配置邮箱服务

首先需要配置邮箱发送功能，用于发送验证码：

#### 方法一：设置环境变量
```bash
# Windows PowerShell
$env:SENDER_EMAIL="your_email@qq.com"
$env:SENDER_PASSWORD="your_authorization_code"
$env:SMTP_SERVER="smtp.qq.com"
$env:SMTP_PORT="587"

# Windows CMD
set SENDER_EMAIL=your_email@qq.com
set SENDER_PASSWORD=your_authorization_code
set SMTP_SERVER=smtp.qq.com
set SMTP_PORT=587
```

#### 方法二：创建 .env 文件
在项目根目录创建 `.env` 文件：
```env
SENDER_EMAIL=your_email@qq.com
SENDER_PASSWORD=your_authorization_code
SMTP_SERVER=smtp.qq.com
SMTP_PORT=587
SENDER_NAME=CSOL KZ 地图管理平台
```

### 2. 获取邮箱授权码

#### QQ邮箱授权码获取步骤：
1. 登录QQ邮箱网页版
2. 点击"设置" → "账户"
3. 找到"POP3/IMAP/SMTP/Exchange/CardDAV/CalDAV服务"
4. 开启"POP3/SMTP服务"
5. 按照提示获取16位授权码

#### 其他邮箱服务商：
- **163邮箱**: 设置 → POP3/SMTP/IMAP → 开启服务 → 获取授权码
- **126邮箱**: 设置 → POP3/SMTP/IMAP → 开启服务 → 获取授权码
- **Gmail**: 需要开启两步验证并生成应用专用密码

### 3. 测试邮件功能

运行邮件测试工具：
```bash
python test_email.py
```

选择测试项目：
- 测试邮件配置：验证邮箱连接
- 测试邮件发送：发送测试验证码

### 4. 启动独立注册服务器

#### 方法一：使用批处理文件（推荐）
```bash
start_register.bat
```

#### 方法二：直接运行Python脚本
```bash
python run_register.py
```

### 5. 访问注册页面

打开浏览器访问：`http://localhost:5001`

## 📧 邮箱验证码功能

### 功能特点：
- ✅ 6位数字验证码
- ✅ 10分钟有效期
- ✅ 最多5次验证尝试
- ✅ 60秒发送间隔限制
- ✅ 美观的HTML邮件模板
- ✅ 自动清理过期验证码

### 注册流程：
1. 用户填写用户名和邮箱
2. 点击"发送验证码"按钮
3. 系统发送验证码到邮箱
4. 用户输入验证码
5. 填写密码并确认
6. 同意用户协议
7. 提交注册

### 安全措施：
- 验证码10分钟后自动过期
- 验证失败5次后需要重新获取
- 发送验证码有60秒冷却时间
- 验证成功后立即删除验证码
- 防止重复注册同一邮箱

## 🔧 配置说明

### 环境变量配置：

| 变量名 | 说明 | 默认值 | 必填 |
|--------|------|--------|------|
| `SENDER_EMAIL` | 发件人邮箱地址 | - | ✅ |
| `SENDER_PASSWORD` | 邮箱授权码 | - | ✅ |
| `SMTP_SERVER` | SMTP服务器 | smtp.qq.com | ❌ |
| `SMTP_PORT` | SMTP端口 | 587 | ❌ |
| `SENDER_NAME` | 发件人显示名称 | CSOL KZ 地图管理平台 | ❌ |

### 支持的邮箱服务商：

| 服务商 | SMTP服务器 | 端口 | 说明 |
|--------|------------|------|------|
| QQ邮箱 | smtp.qq.com | 587 | 推荐，稳定可靠 |
| 163邮箱 | smtp.163.com | 587 | 需要开启SMTP服务 |
| 126邮箱 | smtp.126.com | 587 | 需要开启SMTP服务 |
| Gmail | smtp.gmail.com | 587 | 需要应用专用密码 |

## 🛠️ 故障排除

### 常见问题：

#### 1. 邮件发送失败
**错误信息**: `发送邮件失败: (535, b'Error: authentication failed')`
**解决方案**: 
- 检查邮箱授权码是否正确
- 确认已开启SMTP服务
- 验证邮箱地址格式

#### 2. 连接超时
**错误信息**: `连接超时`
**解决方案**:
- 检查网络连接
- 确认防火墙设置
- 尝试更换SMTP端口（465或587）

#### 3. 验证码验证失败
**错误信息**: `验证码不存在或已过期`
**解决方案**:
- 检查验证码是否正确输入
- 确认验证码未超过10分钟
- 重新发送验证码

#### 4. 邮箱已被注册
**错误信息**: `该邮箱已被注册`
**解决方案**:
- 使用其他邮箱地址
- 联系管理员删除旧账号

### 调试步骤：

1. **测试邮件配置**：
   ```bash
   python test_email.py
   ```

2. **检查环境变量**：
   ```bash
   echo $env:SENDER_EMAIL  # PowerShell
   echo %SENDER_EMAIL%     # CMD
   ```

3. **查看服务器日志**：
   运行注册服务器时查看控制台输出

4. **检查数据库**：
   确认User表包含email字段

## 📁 文件结构

```
csolflask/
├── run_register.py              # 独立注册服务器
├── email_utils.py               # 邮件发送工具
├── test_email.py                # 邮件功能测试
├── email_config_example.txt     # 邮箱配置示例
├── start_register.bat           # 启动脚本
├── templates/
│   ├── register.html            # 注册页面
│   └── register_success.html    # 注册成功页面
└── REGISTER_ISOLATION_GUIDE.md  # 本指南
```

## 🔄 与主应用集成

注册成功后，用户可以使用新账号在主应用中登录：

1. 注册完成 → 获得用户名和密码
2. 访问主应用 → `http://localhost:5000`
3. 使用注册的账号登录
4. 开始使用地图管理功能

## 📞 技术支持

如果遇到问题，请联系：
- **管理员**: FvkoE
- **QQ**: 782074627
- **邮箱**: 通过注册页面测试邮件功能

## 📝 更新日志

### v2.0.0 (2024-12-19)
- ✅ 新增邮箱验证码功能
- ✅ 支持多种邮箱服务商
- ✅ 添加邮件发送测试工具
- ✅ 优化注册页面UI
- ✅ 增强安全验证机制

### v1.0.0 (2024-12-18)
- ✅ 基础注册功能
- ✅ 独立运行环境
- ✅ 数据库隔离
- ✅ 用户协议确认

---

**注意**: 请确保在生产环境中使用HTTPS协议，保护用户信息安全。 