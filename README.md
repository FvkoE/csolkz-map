# CSOL KZ 地图管理平台

## 项目简介

CSOL KZ 地图管理平台是一个基于 Flask 的 Web 应用，专门用于管理 Counter-Strike Online 的 KZ（连跳）地图信息。

## 功能特性

- 🗺️ **地图展示**: 网格布局展示地图卡片，支持分页浏览
- 🔍 **地图筛选**: 按大区、类型、难度、大小等多维度筛选
- ➕ **地图添加**: 支持图片上传的地图信息添加
- ✏️ **地图编辑**: 地图信息修改功能
- 📱 **响应式设计**: 支持移动端和桌面端访问
- 🎨 **现代化UI**: 美观的用户界面设计
- ☁️ **多平台部署**: 支持Render和阿里云ECS部署

## 技术栈

- **后端**: Flask + SQLAlchemy + MySQL
- **前端**: HTML5 + CSS3 + JavaScript
- **数据库**: MySQL
- **文件存储**: ImgBB云存储
- **部署平台**: Render + 阿里云ECS

## 项目结构

```
csolflask/
├── app.py                 # Flask应用主文件
├── models.py              # 数据模型定义
├── maplist.py             # 地图管理业务逻辑
├── admin.py               # 管理员功能
├── config.py              # 配置文件
├── imgbb_storage.py       # ImgBB云存储模块
├── static/                # 静态资源
│   ├── style.css          # 样式文件
│   ├── mainpage.js        # JavaScript功能
│   └── uploads/           # 上传文件目录
├── templates/             # HTML模板
│   ├── mainpage.html      # 主页面模板
│   ├── admin_home.html    # 管理员页面
│   └── admin_login.html   # 管理员登录
├── deploy_aliyun.sh       # 阿里云部署脚本
├── update_aliyun.sh       # 阿里云更新脚本
├── gunicorn.conf.py       # Gunicorn配置
├── nginx.conf             # Nginx配置
├── systemd.service        # Systemd服务配置
└── README.md              # 项目说明
```

## 部署方案

### 多平台部署支持

本项目支持两种部署方案：

#### 1. Render部署（免费版）
- **优势**: 免费、部署简单、自动SSL
- **限制**: 休眠机制、性能一般
- **适合**: 测试、演示、小型项目

#### 2. 阿里云ECS部署
- **优势**: 性能优秀、无休眠、完全控制
- **成本**: 约￥150/月
- **适合**: 生产环境、高访问量

### 快速部署

#### Render部署
1. Fork本项目到GitHub
2. 在Render创建Web Service
3. 配置环境变量
4. 自动部署完成

#### 阿里云部署
1. 购买阿里云ECS实例
2. 上传项目文件
3. 运行 `./deploy_aliyun.sh`
4. 配置域名和SSL

详细部署指南请查看：
- [Render部署指南](RENDER_DEPLOYMENT.md)
- [阿里云部署指南](ALIYUN_DEPLOYMENT.md)
- [多平台部署对比](DEPLOYMENT_COMPARISON.md)

## 本地开发

### 环境要求
- Python 3.7+
- MySQL 数据库

### 安装依赖
```bash
pip install -r requirements.txt
```

### 配置环境变量
```bash
# 创建.env文件
DEPLOYMENT_ENV=development
SECRET_KEY=your_secret_key_here
DB_USER=fvckyopue
DB_PASSWORD=d5kQa7pzXbrHUg8A
DB_HOST=mysql2.sqlpub.com
DB_PORT=3307
DB_NAME=csolkz
IMGBB_API_KEY=cbcb80fb8d641b6cc945f5797a7fab95
```

### 运行应用
```bash
python app.py
```

访问 https://www.csolkz.com 即可使用

## 数据库结构

### MapList 表
- `id`: 主键，自增
- `name`: 地图名称
- `region`: 地图大区（电一、电二、网一、网二）
- `mapper`: 地图作者
- `level`: 地图难度（简单、中等、较难、骨灰、极限）
- `image`: 地图预览图片URL

## 环境配置

### 开发环境
- `DEPLOYMENT_ENV=development`
- 调试模式开启
- 本地文件存储

### 生产环境
- `DEPLOYMENT_ENV=aliyun` 或 `render`
- 调试模式关闭
- ImgBB云存储

## 维护和更新

### Render环境
- 代码推送到GitHub自动部署
- 通过Render控制台管理

### 阿里云环境
- 运行 `./update_aliyun.sh` 更新
- 自动备份和回滚支持

## 开发计划

- [x] 用户认证系统
- [x] 地图评分功能
- [x] 管理员后台
- [x] 多平台部署支持
- [ ] 地图下载链接
- [ ] 地图评论系统
- [ ] 移动端优化
- [ ] 性能监控

## 贡献指南

欢迎提交 Issue 和 Pull Request 来改进项目。

## 许可证

MIT License 