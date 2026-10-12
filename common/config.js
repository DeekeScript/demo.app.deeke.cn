// 生产域名固定为 https://app.deeke.cn（见 app/docs/APP_API.md）
let apiHost = 'https://app.deeke.cn';
let apiPrefix = '/api/v1';

module.exports = {
  apiHost: apiHost,
  apiPrefix: apiPrefix,
  // 完整 Base：https://app.deeke.cn/api/v1
  apiBase: apiHost + apiPrefix,
  // 与 deekeScript.json 的 name 保持一致
  appName: '嘀客Demo',
  // 后台「工具」编号，必须与已发布工具一致
  toolCode: 'D0001',
  // 与 deekeScript.json 保持一致；打包后优先读 App.currentVersionCode()
  versionCode: '100',
  versionName: '1.0.0',
  storagePrefix: 'demo.',
  // 客服微信
  supportWechat: 'DeekeScript',
  alipayPackage: 'com.eg.android.AlipayGphone',
  pollIntervalMs: 2000,
  pollMaxTimes: 20,
  httpTimeoutSec: 30
};
