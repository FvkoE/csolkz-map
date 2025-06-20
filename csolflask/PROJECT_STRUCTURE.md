# 项目结构说明

## 目录结构

```
csol-kz-platform/
├── app.py                 # Flask应用主文件
├── run.py                 # 启动脚本
├── config.py              # 配置文件
├── models.py              # 数据模型
├── maplist.py             # 地图管理业务逻辑
├── requirements.txt       # Python依赖包
├── README.md             # 项目说明文档
├── .gitignore            # Git忽略文件
├── PROJECT_STRUCTURE.md  # 项目结构说明
├── static/               # 静态资源目录
│   ├── style.css         # 样式文件
│   ├── mainpage.js       # JavaScript功能
│   ├── default_map.jpg   # 默认地图图片
│   └── uploads/          # 上传文件目录（自动创建）
└── templates/            # HTML模板目录
    └── mainpage.html     # 主页面模板
```

## 文件说明

### 核心文件

- **app.py**: Flask应用入口，使用工厂模式创建应用
- **run.py**: 启动脚本，支持开发和生产环境
- **config.py**: 配置管理，支持多环境配置
- **models.py**: 数据库模型定义
- **maplist.py**: 地图管理相关的路由和业务逻辑

### 配置文件

- **requirements.txt**: Python依赖包列表
- **.gitignore**: Git版本控制忽略文件
- **config.py**: 应用配置，包括数据库、文件上传等设置

### 静态资源

- **static/style.css**: 主样式文件
- **static/mainpage.js**: 前端JavaScript功能
- **static/uploads/**: 用户上传的图片存储目录

### 模板文件

- **templates/mainpage.html**: 主页面HTML模板

## 配置说明

### 环境变量

- `FLASK_ENV`: 运行环境（development/production）
- `SECRET_KEY`: Flask密钥（生产环境必须设置）

### 数据库配置

在 `config.py` 中配置数据库连接信息：

```python
DB_USER = 'your_username'
DB_PASSWORD = 'your_password'
DB_HOST = 'your_host'
DB_PORT = 'your_port'
DB_NAME = 'your_database'
```

### 文件上传配置

- `UPLOAD_FOLDER`: 上传文件存储目录
- `MAX_CONTENT_LENGTH`: 最大文件大小（16MB）
- `ALLOWED_EXTENSIONS`: 允许的文件类型

## 运行方式

### 开发环境
```bash
python run.py
# 或
python app.py
```

### 生产环境
```bash
export FLASK_ENV=production
python run.py
```

## 部署说明

1. 安装依赖：`pip install -r requirements.txt`
2. 配置数据库连接
3. 设置环境变量
4. 运行应用：`python run.py`

## 开发规范

- 使用工厂模式创建Flask应用
- 配置与代码分离
- 使用蓝图组织路由
- 统一的错误处理
- 清晰的代码注释 