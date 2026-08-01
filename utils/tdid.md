# TDID / 无痕验证 SDK 说明 (`tdid.py`)

腾讯 TDID（无痕验证）SDK 的纯 Python 实现，把 `tdid_xxtea.js` +
`tdid_client.js` 的核心算法翻译过来，**无需本地 node 环境**即可获取
`deviceToken`（下单 `placeOrder` 用）。

依赖：仅 Python 标准库（`http.client` / `json` / `os` / `uuid` / `time` / `hashlib`）。

---

## 1. 请求概览

接口：`POST https://browsertdidticket.m.qq.com/jprx/1941`

**请求体**

```jsonc
{
  "req": {
    "content":   "<设备指纹业务对象密文, base64>",
    "channel":   "109045",
    "token":     "<风控 token>",
    "version":   "1",
    "type":      "0" | "1",      // 0 = 首包；1 = 换取最终 msgBlock
    "timestamp": "<毫秒时间戳>"
  }
}
```

**响应体**

```jsonc
{
  "data": {
    "resp": {
      "ret": 0,                    // 0 = 成功
      "msgBlock": "v2:...",        // ★ type=1 时即下单用的 deviceToken
      "token": "...",              // 风控 riskToken（作为下次请求的 req.token）
      "dfp": { "ticketID": "..." } // 设备指纹票据（作为下次 deviceObj["2"]）
    }
  }
}
```

---

## 2. 加解密算法链

对照反编译后的 `app-service.js`，本文件把混淆函数名都换成了**可读的函数名**：

| 反编译里的名字 | 本文件函数            | 算法 / 说明 |
| -------------- | --------------------- | ----------- |
| `s(...)`       | `s_encrypt(...)`      | 核心加密：`base64_encode( xxtea_encrypt(明文, 密钥) )` |
| （逆运算）     | `s_decrypt(...)`      | 核心解密：`xxtea_decrypt( base64_decode(密文), 密钥 )` |
| module 6699    | `xxtea_encrypt` / `xxtea_decrypt` | **XXTEA**（带长度头变体，`delta = 0x9E3779B9`） |
| module 6776    | `_base64_encode` / `_base64_decode` | **Base64**（标准表 `A-Za-z0-9+/=`） |
| module 737     | `hash32(...)`         | **MurmurHash2**（32 位，seed 常用 256） |
| module 8898    | `sign(...)`           | 生成 `statisticsInfo["10"]`（基于 LCG + MurmurHash2） |
| `deriveU(...)` | `derive_u(...)`       | 派生 content 的加密密钥（见下） |
| `PB89649DE`    | `PB89649DE` 常量      | 固定密钥字符串 `"01303975070694866490574863106155"` |

### 核心加密函数 `s_encrypt`

```python
s_encrypt(明文, 密钥, with_ts=False)
    = base64_encode( xxtea_encrypt(明文 [+ "_" + 毫秒时间戳], 密钥) )
```

- `with_ts=True` 时，先把明文改成 `明文 + "_" + 毫秒时间戳` 再加密（防重放）。
- 它的逆运算是 `s_decrypt(密文base64, 密钥)`。

---

## 3. `content` 与 `token` 的生成流程

设备首次运行时生成一个随机 `uuid`（32 位十六进制），并**永久保存**。

### 3.1 派生 content 的加密密钥 `content_key`

```python
content_key = s_encrypt(uuid, PB89649DE)   # 即 derive_u(uuid)
            = base64_encode( xxtea_encrypt(uuid, PB89649DE) )
```

> 说明：反编译里这个中间密钥叫 `u`，本文档统一称 **`content_key`**。
> 因为 `PB89649DE` 是源码里的固定常量，`content_key` 完全由 `uuid` 决定。

### 3.2 生成 `content`

```python
content = s_encrypt( JSON字符串(设备指纹业务对象), content_key )
        = base64_encode( xxtea_encrypt(JSON字符串, content_key) )
```

### 3.3 生成 `token`（分两种情况）

- **`type = "0"`（首包，本地还没有 riskToken）：**

  ```python
  当天0点毫秒 = c - (c + 288e5) % 864e5     # c = 当前毫秒；北京时区 UTC+8
  token = s_encrypt(content_key, str(当天0点毫秒))
        = base64_encode( xxtea_encrypt(content_key, str(当天0点毫秒)) )
  ```

  > ★ 关键点：`token` 是用 **“当天0点毫秒”** 这个**已知值**作 XXTEA 密钥，
  > 把 `content_key` 加密而成。因此可以**离线反解出 `content_key`**（见第 5 节）。

- **`type = "1"`（已有 riskToken）：**

  ```python
  token = 上一次响应的 resp.token   # 服务端下发的风控密文，本地无密钥，不可解
  ```

### 3.4 设备指纹业务对象的关键字段

```python
timestamp            = req.timestamp - 9                 # 真实抓包内外层差 9ms
deviceObj["1"]       = s_encrypt(uuid, PB89649DE, with_ts=True)  # 设备指纹主字段
deviceObj["2"]       = ""（type=0）或 上次响应的 dfp.ticketID（type=1）
deviceObj[其余]      = 系统 / 网络 / 授权等设备特征（见代码 _DEV 表）
statisticsInfo["10"] = sign(timestamp, deviceObj)        # 离线可复算
statisticsInfo["11"] = 随机 UUID（reqId）
```

#### 设备指纹字段详解（`_DEV` 表）

| 字段 | 值 | 含义 |
|------|-----|------|
| `"4"` | `"windows"` | 操作系统平台 |
| `"43"` | `"wifi"` | 网络类型 |
| `"101"` | `"osPfN4seDJhyEgrFmC_DME8Bq3bc"` | 操作系统指纹（可能是混淆的硬件/系统标识） |
| `"103"` | `"3.17.0"` | 小程序 SDK 版本 |
| `"104"` | `"microsoft"` | 设备厂商 |
| `"105"` | `"microsoft"` | 设备品牌 |
| `"106"` | `"780*414"` | 屏幕分辨率（宽*高） |
| `"107"` | `"Windows Unknown x64"` | 操作系统详细描述 |
| `"108"` | `"zh_CN"` | 系统语言/地区 |
| `"109"` | `""` | 预留字段 |
| `"110"` | `""` | 预留字段 |
| `"111"` | `"4.1.11.55"` | 微信版本号 |
| `"112"` | `""` | 预留字段 |
| `"113"` | `""` | 预留字段 |
| `"114"` | `""` | 预留字段 |
| `"115"` | `""` | 预留字段 |
| `"116"` | `"20"` | 设备 API 级别（Android 概念，Windows 模拟为 20） |
| `"117"` | `"-1"` | 设备电池电量（-1 表示未知） |
| `"118"` | `"1:1:1:1:1:0:1:1"` | 设备权限/功能开关位掩码（如相机、定位、通知等） |
| `"119"` | `""` | 预留字段 |
| `"121"` | `""` | 预留字段 |
| `"122"` | `""` | 预留字段 |
| `"123"` | `""` | 预留字段 |
| `"124"` | `"false"` | 是否模拟器（false 表示非模拟器） |
| `"126"` | `"15"` | 设备内存大小（GB） |
| `"127"` | `"20260715"` | 系统构建日期（YYYYMMDD） |
| `"128"` | `"198.18.0.1"` | 设备 IP 地址（内网保留地址） |
| `"129"` | `"release"` | 构建类型（release / debug） |
| `"130"` | `"4ecfb0c75f2767522744b9ddd683989f765a189ee9391b8338ba0f3dcec7b89e"` | 设备唯一标识哈希（可能是硬件指纹的 SHA-256） |

> 注：这些字段值来自 `tdid_client.js` 的 `DEV` 表，是 SDK 为 Windows 平台预设的静态值。实际抓包中，服务端会结合这些字段与动态的 `deviceObj["1"]`、`deviceObj["2"]` 等生成设备指纹。

---

## 4. 两阶段流程 `get_device_token()`

1. **阶段一**：本地没有 `riskToken` → 发 `type=0` 首包
   → 把响应的 `resp.token` 存为 `riskToken`、`resp.dfp.ticketID` 存为 `ticketID`。
2. **阶段二**：带上 `riskToken` + `ticketID` → 发 `type=1`
   → 得到最终的 `resp.msgBlock`（即 `placeOrder` 用的 `deviceToken`）。

`uuid` / `riskToken` / `ticketID` 落盘到 `cache/tdid_state.json`，下次复用。

---

## 5. 如何手动抓取密钥并解密 `content` / `token`

以文件底部两段真实抓包会话 `SESSION_STAGE1`（type=0）、`SESSION_STAGE2`（type=1）为例。

**前提**：`content_key = s_encrypt(uuid, PB89649DE)`，而 `PB89649DE` 是已知常量，
所以只要拿到 `uuid` 就能算出 `content_key`，进而解密任意 `content`；
而 `uuid` 又能从 `type=0` 的 `token` 反解出来。

### 步骤 1：抓一包 `type="0"` 的请求

记下它的 `token` 和 `timestamp`，例如：

```
timestamp = 1785474711109
token     = "tsSnodWMjtl2j78PwxDd1Wnw4VD7SQCw+O5FPzwrdBJu2QL6..."
```

### 步骤 2：从 `token` 反解出 `content_key`

`token` 是用「当天0点毫秒」作 XXTEA 密钥加密 `content_key` 得到的，密钥已知：

```python
当天0点毫秒 = c - (c + 288e5) % 864e5          # c = timestamp
content_key = s_decrypt(token, str(int(当天0点毫秒)))
```

对应函数：`recover_u_from_type0_token(token, timestamp)` → 返回 `(content_key, 当天0点毫秒)`。

### 步骤 3：从 `content_key` 反查设备 `uuid`

因为 `content_key = base64_encode( xxtea_encrypt(uuid, PB89649DE) )`，且 `PB89649DE` 已知：

```python
uuid = s_decrypt(content_key, PB89649DE)
```

对应函数：`recover_uuid_from_u(content_key)`。
可回代校验：`derive_u(uuid) == content_key` 应成立（闭环验证密钥正确）。

### 步骤 4：用 `content_key` 解密 `content`

```python
明文 = s_decrypt(content, content_key)
```

对应函数：`decrypt_content_by_u(content, content_key)`。
解出的是完整业务对象 JSON（含 `deviceObj` / `statisticsInfo`），可用于分析设备指纹字段。

### 步骤 5：`type="1"` 的会话

`type=1` 的 `token` 是服务端风控密文，**无法离线解密**（需服务端密钥）；
但它的 `content` 仍可用**同一设备的 `content_key`** 解密（复用步骤 2 的结果即可）。

### 一键演示

```bash
python utils/tdid.py --demo
```

会依次打印：反解出的 `content_key`、反查出的 `uuid`、闭环校验结果、以及两段 `content` 的解密明文。
