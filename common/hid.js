/**
 * HID 连接检查：用于设置页启用开关。
 */
module.exports = {
  ensureBluetoothPermission() {
    try {
      if (typeof Access === 'undefined' || !Access.hasBluetoothConnectionPermission) {
        return true;
      }
      if (Access.hasBluetoothConnectionPermission()) {
        return true;
      }
      if (Access.isBluetoothPermissionPermanentlyDenied && Access.isBluetoothPermissionPermanentlyDenied()) {
        if (Access.openBluetoothPermissionSettings) {
          Access.openBluetoothPermissionSettings();
        }
        return false;
      }
      if (Access.requestBluetoothConnectionPermission) {
        Access.requestBluetoothConnectionPermission();
      }
      return false;
    } catch (e) {
      return false;
    }
  },

  /**
   * 检查 HID 是否已连接。
   * @returns {{ ok: boolean, message: string }}
   */
  checkConnected() {
    try {
      if (typeof Hid === 'undefined' || !Hid.getConnectState) {
        return { ok: false, message: '当前环境不支持 HID' };
      }
      if (!this.ensureBluetoothPermission()) {
        return { ok: false, message: '请先授予蓝牙权限，并连接 HID 设备' };
      }
      try {
        let ctx = typeof context !== 'undefined' ? context : null;
        if (ctx && Hid.initBluetooth) {
          Hid.initBluetooth(ctx);
        }
      } catch (e1) {}
      try {
        if (Hid.connect) {
          Hid.connect(true, 0);
        }
      } catch (e2) {}
      System.sleep(400);
      if (Hid.getConnectState()) {
        return { ok: true, message: '已连接' };
      }
      return { ok: false, message: '未检测到 HID 设备连接，请先连接后再启用' };
    } catch (e) {
      return { ok: false, message: 'HID 检查失败：' + ((e && e.message) || e) };
    }
  }
};
