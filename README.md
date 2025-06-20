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

## 技术栈

- **后端**: Flask + SQLAlchemy + MySQL
- **前端**: HTML5 + CSS3 + JavaScript
- **数据库**: MySQL
- **文件存储**: 本地文件系统

## 项目结构

```
csol-kz-platform/
├── app.py              # Flask应用主文件
├── models.py           # 数据模型定义
├── maplist.py          # 地图管理业务逻辑
├── static/             # 静态资源
│   ├── style.css       # 样式文件
│   ├── mainpage.js     # JavaScript功能
│   └── *.jpg          # 图片资源
├── templates/          # HTML模板
│   └── mainpage.html   # 主页面模板
└── README.md          # 项目说明
```

## 安装运行

### 环境要求
- Python 3.7+
- MySQL 数据库

### 安装依赖
```bash
pip install flask sqlalchemy pymysql cryptography
```

### 配置数据库
1. 创建MySQL数据库
2. 修改 `models.py` 中的数据库连接信息

### 运行应用
```bash
python app.py
```

访问 http://127.0.0.1:5000 即可使用

## 数据库结构

### MapList 表
- `id`: 主键，自增
- `name`: 地图名称
- `region`: 地图大区（电一、电二、网一、网二）
- `mapper`: 地图作者
- `level`: 地图难度（简单、中等、较难、骨灰、极限）
- `image`: 地图预览图片路径

## 开发计划

- [ ] 用户认证系统
- [ ] 地图评分功能
- [ ] 地图下载链接
- [ ] 管理员后台
- [ ] 地图评论系统
- [ ] 移动端优化

## 贡献指南

欢迎提交 Issue 和 Pull Request 来改进项目。

## 许可证

MIT License 