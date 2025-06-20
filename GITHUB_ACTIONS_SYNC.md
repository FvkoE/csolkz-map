# GitHub Actions 自动同步方案

## 方案概述

使用GitHub Actions自动同步用户上传的图片到GitHub仓库，实现文件的持久化存储。

## 工作原理

1. **用户上传图片** → 保存到 `static/uploads/` 目录
2. **GitHub Actions触发** → 检测到 `static/uploads/` 目录有变化
3. **自动提交推送** → 将新文件提交到GitHub仓库
4. **文件持久化** → 图片永久保存在GitHub仓库中

## 文件结构

```
csolflask/
├── .github/
│   └── workflows/
│       └── sync-uploads.yml    # GitHub Actions工作流
├── static/
│   └── uploads/                # 用户上传的图片目录
├── maplist.py                  # 地图管理（使用本地存储）
└── ...其他文件
```

## 部署步骤

### 1. 推送代码到GitHub

确保您的代码已推送到GitHub仓库，包含以下文件：
- `.github/workflows/sync-uploads.yml`
- 所有Python应用文件

### 2. 在Render上部署

1. 在Render上创建Web Service
2. 连接您的GitHub仓库
3. 配置环境变量（数据库等）
4. 部署应用

### 3. 测试上传功能

1. 访问您的应用
2. 尝试上传图片
3. 检查GitHub仓库中是否出现新文件

## 工作流程详解

### 触发条件
```yaml
on:
  push:
    paths:
      - 'static/uploads/**'  # 当uploads目录有变化时触发
  workflow_dispatch:         # 手动触发
```

### 执行步骤
1. **检出代码**: 获取最新代码
2. **配置Git**: 设置用户信息
3. **提交更改**: 自动提交新文件
4. **推送仓库**: 将更改推送到GitHub

## 优势

### ✅ 优点
- **完全免费**: 使用GitHub免费服务
- **自动同步**: 无需手动操作
- **版本控制**: 文件有完整的提交历史
- **持久化存储**: 文件永久保存在GitHub
- **简单可靠**: 基于Git的标准工作流

### ⚠️ 注意事项
- **延迟**: 同步需要几秒钟时间
- **文件大小**: 受GitHub仓库大小限制
- **频率限制**: GitHub Actions有使用限制

## 故障排除

### 常见问题

1. **GitHub Actions未触发**
   - 检查文件路径是否正确
   - 确认仓库权限设置

2. **同步失败**
   - 查看Actions日志
   - 检查GitHub Token权限

3. **文件未显示**
   - 等待几秒钟让同步完成
   - 检查GitHub仓库中的文件

### 查看日志

1. 访问GitHub仓库
2. 点击 "Actions" 标签页
3. 查看 "Sync Uploaded Files" 工作流
4. 检查执行日志

## 配置说明

### 环境变量
无需额外配置，使用GitHub默认的 `GITHUB_TOKEN`

### 文件权限
确保 `static/uploads/` 目录存在且有写入权限

### 自动提交信息
```bash
git commit -m "Auto-sync uploaded files"
```

## 扩展功能

### 自定义提交信息
可以修改工作流文件，添加更详细的提交信息：

```yaml
- name: Commit and push changes
  run: |
    git config --local user.email "action@github.com"
    git config --local user.name "GitHub Action"
    git add static/uploads/
    git diff --quiet && git diff --staged --quiet || git commit -m "Auto-sync: $(date)"
    git push
```

### 文件过滤
可以添加文件类型过滤：

```yaml
- name: Add only image files
  run: |
    git add static/uploads/*.jpg static/uploads/*.png static/uploads/*.gif
```

## 总结

这个方案通过GitHub Actions实现了用户上传文件的自动同步，既保持了本地存储的简单性，又解决了Render文件系统临时性的问题。文件会永久保存在GitHub仓库中，可以通过GitHub Pages或其他方式访问。 