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

## 代理加速抢票模式 (查票与下单分离, 星空代理 xkdaili)

票务数据接口 (`gainAllSystemConfig` / `getPriceByScheduleId`, 均为 `.../ingore/...` 免鉴权接口)
**不需要登录 / 不需要 Cookie / 不需要 token** —— 查票线程组拿着动态代理池高频轮询，
放票瞬间（如 17:00:00 主波 + 17:00:10 第二波）几百毫秒内发现场次并推送下单线程。

架构（都是后台自动，不需要命令行参数，IDE 直接运行 `main.py`）：

```
[查票线程组]  N 路代理并发轮询余票 (每个线程持 1 个代理, 背靠背狂刷)
              ├─ 代理读不到数据/被墙/超时 -> 丢弃换下一个 (池子自动续拉)
              ├─ 代理 3 分钟到期 -> 自动换新
              ├─ 池中闲置代理 < 120 -> 一次再拉 200 个, 用完继续拉
              └─ 代理断供时本地兜底线程顶上 (查票永不中断)
                 │  场次出现/消失/换场/放票(>0) 变化
                 ▼  epoch+1 推送 ctx
[下单线程]   主线程: 预热 Host-Ip/deviceToken -> getBlock + 验证码 + placeOrder
              同一场次状态内连续热抢; 场次被抢空/换场则立即切换最新场次
```

只需要修改 `config.py` 顶部的常量（全部有中文注释）：
- `XKD_APIKEY / XKD_SIGN`：代理账号（已填好）
- `XKD_FETCH_QTY = 200`：每次提取数量（一次性 200，接口上限）
- `XKD_SCAN_WORKERS = 40`：查票并发线程数（每个线程持 1 个代理轮询）。
  实际查票频率 ≈ 并发数 ÷ 单次往返耗时；40 路实测约 **50~60 次/秒**
  （远超 7~8 次/秒要求）。心跳日志每 20 秒打印「查票频率≈x.x 次/秒」，
  低于 `XKD_MIN_RPS = 8` 会红字提醒 —— 不够快就把 `XKD_SCAN_WORKERS` 调大
- `XKD_POOL_LOW = 120 / XKD_POOL_HIGH = 200 / XKD_INITIAL_FILL = 200`：
  池子水位与补货节奏（代理被墙自动换新，闲置低于 120 自动再拉 200）
- `XKD_POLL_INTERVAL = (0.0, 0.15)`：每个代理轮询间隔 ≈ 0，背靠背狂刷
- `TARGET_DATE = ""`：填 `"2026-09-15"` 只抢该日期；留空自动（日期最大）
- `ORDER_WINDOW = ("16:50:00", "18:00:00")`：只在该时段内下单，之前只查票

关键机制：

1. **Host-Ip 预加密**：下单头 `Host-Ip = AES-128-ECB(出口IP, "AyrKJRXPO3nR5Abc")`，
   出口 IP 由腾讯校时 `checktime` 返回。本机下单路径在 `api.ensure_host_ip()`
   里**启动即预热并缓存 120s**，放票瞬间 0 等待（查票走代理不需要 Host-Ip）。
2. **deviceToken 预热**：`start_device_token_refresher()` 后台每 20s 刷新，
   placeOrder 不再现场等 TDID。
3. **查票/下单分离**：查票线程永远在后台跑，不会因验证码弹窗或下单重试停摆；
   场次状态一变立刻切换下单目标（17:00:10 第二波=场次状态变化，自动重开抢）。
4. **getBlock 秒刷抢票（关键）**：没票时 getBlock 拿不到验证码（返回 550 余票不足）。
   下单线程对已武装的目标场次 **用 getBlock 自己秒刷**：550 余票不足 → 重刷等 200，
   200 → 说明此刻有票，马上识别验证码并 placeOrder —— 放票瞬间 550→200 翻转立即抢。
   ⚠ 实测限频：getBlock **每 2 秒内连发就会返回「访问太频繁，请稍后再试」**
   （同样是 code550，但 msg 不同），同秒连发会升级成 HTTP 491 WAF 封锁。
   因此程序内置：两次 getBlock 最小间隔 `HOT_MIN_GETBLOCK_GAP = 3.5s`；
   区分「550余票不足」与「550访问太频繁」，后者自动退避 `HOT_FREQ_BACKOFF`、
   WAF/491 自动退避 `HOT_BLOCK_BACKOFF`，不会硬刷把 IP 打封。
   相关参数：`HOT_MIN_GETBLOCK_GAP / HOT_EMPTY_GAP / HOT_EMPTY_CAP /
   HOT_FREQ_BACKOFF / HOT_BLOCK_BACKOFF`（配套 `test_getblock_rate.py` 可自行复测频率墙）。
5. **代理换血**：每次提取 200 个；代理被墙/慢/超时直接换；到期自动续拉。

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