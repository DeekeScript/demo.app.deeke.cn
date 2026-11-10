/**
 * HID 连通性探测。
 * 页面里没有 Hid 对象，必须 Engines.executeScript('tasks/hidCheck.js')，
 * 由任务完成连接探测后通过 Storage 回传结果；成功后任务内会 disconnect。
 */
let config = require('./config.js');

module.exports = {
  resultKey: config.storagePrefix + 'hid.check',

  ensureBluetoothPermission() {
    if (!Access.hasBluetoothConnectionPermission()) {
      if (Access.isBluetoothPermissionPermanentlyDenied()) {
        Access.openBluetoothPermissionSettings();
      } else {
        Access.requestBluetoothConnectionPermission();
      }
      return false;
    }
    return true;
  },

  /**
   * 探测 HID 是否可连接（页面调用）。
   * @returns {{ ok: boolean, message: string }}
   */
  checkConnected() {
    try {
      if (!this.ensureBluetoothPermission()) {
        return { ok: false, message: '请先授予蓝牙权限后再点「检查连接」' };
      }

      Storage.putObj(this.resultKey, {
        done: false,
        ok: false,
        message: '',
        at: Date.now()
      });

      Engines.executeScript('tasks/hidCheck.js');

      let deadline = Date.now() + 35000;
      while (Date.now() < deadline) {
        System.sleep(300);
        let r = Storage.getObj(this.resultKey);
        if (r && r.done) {
          return {
            ok: r.ok === true,
            message: r.message || (r.ok ? '可连接' : '不可连接')
          };
        }
      }
      return { ok: false, message: 'HID 探测超时，请重试' };
    } catch (e) {
      return { ok: false, message: 'HID 检查失败：' + ((e && e.message) || e) };
    }
  }
};
