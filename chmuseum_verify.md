# 国博小程序下午5点验证

## step 1. 验证设备参数

每次重新进入小程序，/jprx/1941接口的 `deviceObj['130']` 是小程序内部调用wx.pluginLogin生成的code，验证自生成的和code长度一样的值是否可用

* 将抓包/jprx/1941接口（请求体type=0）的所有参数设置到tdid_state.json和`PLUGIN_CODE`，X_WECHAT_HOSTSIGN也设置抓包值，在5点发请求验证
* 将tdid.py的`X_WECHAT_HOSTSIGN`设置空字符串测试代码自动生成参数是否可用
* config.py设置第一次登录的token、openid、unionid并删除tdid_state.json，`PLUGIN_CODE`设置自生成的值，测试能否走到placeOrder接口，再次尝试设置`X_WECHAT_HOSTSIGN`测试是否有影响


## step 2. 验证账号token是否和设备参数绑定（黑号原因）

step1测试完成后，删除tdid_state.json，然后再次跑脚本测试看getBlock是否出现预约人数过多

## step 3. 高并发测试

前面步骤完成后，删除脚本请求的延时，测试是否能正常下单