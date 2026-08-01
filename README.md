# 国博余票监控 + 自动验证码识别

## 项目概述

本项目用于监控中国国家博物馆的余票，并支持自动验证码识别下单。项目提供了两种验证码识别方式：
1. **手动模式**：通过图形界面手动点选验证码
2. **自动模式**：通过本地模型API自动识别验证码（支持自动启动服务）

## 功能特性

- ✅ 自动监控国博余票
- ✅ 支持手动和自动验证码识别
- ✅ 本地模型API服务（基于ONNX）
- ✅ **自动启动服务端**：无需手动启动服务
- ✅ 命令行参数配置
- ✅ 自动保存验证码图片
- ✅ 完整的依赖管理

## 安装依赖

```bash
# 安装所有依赖
pip install -r requirements.txt

# 如果只需要主程序功能（不使用本地模型API）
pip install cycronet Pillow requests
```

## 使用方法

### 1. 自动启动本地模型API服务（推荐）

项目支持自动启动本地模型API服务。当使用自动识别模式时，如果检测到服务未运行，会自动在后台启动服务：

```bash
# 自动识别模式会自动启动服务
python main.py
```

服务将在 `http://127.0.0.1:8000` 启动，提供验证码识别API。服务只会在第一次需要时启动，程序退出时会自动停止。

### 2. 手动启动本地模型API服务（可选）

如果需要手动控制服务，也可以手动启动：

```bash
cd captcha
python app.py
```

### 3. 运行主程序

```bash
python main.py
```

## 项目结构

```
museum/
├── main.py                    # 主程序入口
├── requirements.txt           # 项目依赖
├── README.md                  # 项目说明
├── config.py                  # 配置文件
├── api.py                     # API接口封装
├── captcha/                   # 验证码相关
│   ├── app.py                # 本地模型API服务
│   ├── models/               # ONNX模型文件
│   └── 国博验证码API调用.md   # API文档
└── utils/                    # 工具模块
    ├── aes.py               # AES加密工具
    ├── captcha.py           # 手动验证码点选
    ├── captcha_auto.py      # 自动验证码识别（支持自动启动服务）
    └── tdid.py              # deviceToken生成
```

## 验证码识别流程

### 自动识别模式（推荐）
1. 检测本地模型API服务是否运行
2. 如果服务未运行，自动在后台启动服务
3. 获取验证码图片（originalImageBase64 和 jigsawImageBase64）
4. 调用本地模型API (`http://127.0.0.1:8000/CNM`)
5. API返回目标中心点坐标
6. 自动计算像素坐标并提交
7. 程序退出时自动停止服务

### 手动识别模式
1. 获取验证码图片
2. 弹出图形界面窗口
3. 用户手动点选目标图案
4. 获取点选坐标并提交

## 配置说明

### 1. API Token配置
编辑 `config.py` 文件，设置有效的 `API_TOKEN`：

```python
API_TOKEN = "你的API_TOKEN"
```

### 2. 实名信息配置
编辑 `config.py` 文件，设置下单实名信息：

```python
ORDER_USER_NAME = "你的姓名"
ORDER_CERT_INFO = "你的身份证号"
```

## 注意事项

1. **API Token有效期**：API Token有有效期限制，过期后需要重新获取
2. **验证码识别准确率**：自动识别依赖于本地模型，准确率可能不是100%
3. **网络连接**：需要稳定的网络连接访问国博API
4. **自动启动服务**：自动识别模式会自动启动服务，无需手动操作
5. **服务端口**：默认使用8000端口，如果端口被占用会自动失败

## 故障排除

### 1. 自动启动服务失败
- 检查是否安装了所有依赖：`pip install -r requirements.txt`
- 检查8000端口是否被占用：`netstat -ano | findstr :8000`
- 检查模型文件是否存在：`captcha/models/datu.onnx` 和 `captcha/models/xiaotu.onnx`
- 可以切换到手动模式：`python main.py --mode manual`

### 2. 自动识别失败
- 检查本地模型API是否正常运行
- 检查验证码图片是否完整获取
- 可以切换到手动模式：`python main.py --mode manual`

### 3. 依赖安装失败
- 使用Python 3.8+版本
- 尝试使用虚拟环境：`python -m venv venv`
- 对于Windows用户，可能需要安装Visual C++ Build Tools

## 更新日志

### v2.0 新增功能
- ✅ 自动启动本地模型API服务
- ✅ 服务只启动一次，避免重复启动
- ✅ 程序退出时自动清理服务
- ✅ 简化的API检测逻辑

## 许可证

本项目仅供学习交流使用，请遵守相关法律法规。