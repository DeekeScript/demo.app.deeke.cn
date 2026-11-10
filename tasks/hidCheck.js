/**
 * HID 连通性探测（仅 tasks 运行时有 Hid）。
 * 页面通过 Engines.executeScript 启动，结果写入 Storage 后结束。
 */
let config = require('../common/config.js');

let resultKey = config.storagePrefix + 'hid.check';

function writeResult(ok, message) {
  Storage.putObj(resultKey, {
    done: true,
    ok: ok === true,
    message: String(message || ''),
    at: Date.now()
  });
}

Storage.putObj(resultKey, {
  done: false,
  ok: false,
  message: '探测中…',
  at: Date.now()
});

try {
  Hid.initBluetooth();
  if (!Hid.connectAndWait(true, 0)) {
    writeResult(false, '无法连接 HID。请确认设备名为 DeekeScript-*、已配对且在附近');
  } else {
    let name = String(Hid.getName() || '').trim();
    Hid.disconnect();
    writeResult(
      true,
      name ? ('可连接：' + name + '（已断开，运行时再连）') : '可连接（已断开，运行时再连）'
    );
  }
} catch (e) {
  try {
    Hid.disconnect();
  } catch (e2) {}
  writeResult(false, 'HID 检查失败：' + ((e && e.message) || e));
}

Engines.closeAll();
