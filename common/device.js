let config = require('./config.js');

let DY_PACKAGE = 'com.ss.android.ugc.aweme';

function safeCall(fn, fallback) {
  try {
    let v = fn();
    if (v == null || v === '') {
      return fallback;
    }
    return v;
  } catch (e) {
    return fallback;
  }
}

module.exports = {
  getDeviceId() {
    let key = config.storagePrefix + 'deviceId';
    let saved = Storage.get(key);
    if (saved) {
      return saved;
    }
    let id = '';
    try {
      id = Device.getUuid() || '';
    } catch (e) {
      id = '';
    }
    if (!id) {
      id = 'a-' + String(Date.now()) + Math.floor(Math.random() * 100000);
    }
    Storage.put(key, id);
    return id;
  },

  /** 机型 / Android / 抖音版本，供诊断日志 */
  runtimeInfo() {
    let brand = String(safeCall(function () { return Device.brand(); }, ''));
    let model = String(safeCall(function () { return Device.model(); }, ''));
    let android = String(safeCall(function () { return Device.androidVersion(); }, ''));
    let sdk = safeCall(function () { return Device.sdkInt(); }, 0);
    let dyName = '';
    let dyCode = 0;
    let dyInstalled = false;
    try {
      dyInstalled = !!App.isAppInstalled(DY_PACKAGE);
    } catch (e) {
      dyInstalled = false;
    }
    if (dyInstalled) {
      dyName = String(safeCall(function () { return App.getAppVersionName(DY_PACKAGE); }, ''));
      dyCode = parseInt(safeCall(function () { return App.getAppVersionCode(DY_PACKAGE); }, 0), 10) || 0;
    }
    let phone = (brand + ' ' + model).trim() || '未知机型';
    let androidText = android
      ? ('Android ' + android + (sdk ? (' (SDK ' + sdk + ')') : ''))
      : (sdk ? ('SDK ' + sdk) : '未知 Android');
    let dyText = dyInstalled
      ? (dyName ? (dyName + (dyCode ? (' (' + dyCode + ')') : '')) : ('已安装' + (dyCode ? (' (' + dyCode + ')') : '')))
      : '未安装';
    return {
      brand: brand,
      model: model,
      androidVersion: android,
      sdkInt: sdk,
      douyinInstalled: dyInstalled,
      douyinVersionName: dyName,
      douyinVersionCode: dyCode,
      phoneText: phone,
      androidText: androidText,
      douyinText: dyText,
      summary: phone + ' · ' + androidText + ' · 抖音 ' + dyText
    };
  }
};
