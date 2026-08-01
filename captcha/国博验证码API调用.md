# 国博验证码API调用

获取中心点

```
curl -L -X POST 'http://127.0.0.1:8000/CNM' ^
-H 'Content-Type: application/json' ^
-d '{
  "mode": 1,
  "data": {
    "secretKey": "YhoWBYYGw74Jtnpc",验证码定位防止高速请求的时候验证码返回错乱就是防止返回其他人的验证码坐标
    "originalImageBase64": "目标图的Base64",
    "jigsawImageBase64": "提示图的Base64",
  }'
```

获取中心点返回内容

```
{
  "code": 0,
  "secretKey": "YhoWBYYGw74Jtnpc",
  "data": {
    "x": 115,
    "y": 94
  }
}
```

获取四边框坐标

```
curl -L -X POST 'http://127.0.0.1:8000/CNM' ^
-H 'Content-Type: application/json' ^
-d '{
  "mode": 2,
  "data": {
    "secretKey": "YhoWBYYGw74Jtnpc",验证码定位防止高速请求的时候验证码返回错乱就是防止返回其他人的验证码坐标
    "originalImageBase64": "目标图的Base64",
    "jigsawImageBase64": "提示图的Base64",
  }'
```

获取四边框坐标返回内容

```
{
  "code": 0,
  "secretKey": "YhoWBYYGw74Jtnpc",
  "data": {
    "x1": 96,
    "y1": 77,
    "x2": 134,
    "y2": 112
  }
}
```

