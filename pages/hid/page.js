let params = require('../../common/params.js');
let hid = require('../../common/hid.js');

Page({
  data: {
    hidEnabled: false,
    connected: false,
    statusLabel: '未检查',
    statusBg: '#EEF2F1',
    statusColor: '#5A6B69',
    statusDetail: '点击下方按钮探测 HID 是否可连接',
    enableHint: '探测未通过时不能启用。请先检查连接。',
    hidDialogOpen: false,
    hidDialogText: 'HID 不可连接，请先配对设备后再启用。',
    _checking: false,
    _ready: false
  },

  statusView(connected, detail) {
    let ok = connected === true;
    return {
      connected: ok,
      statusLabel: ok ? '可连接' : '不可连接',
      statusBg: ok ? '#E8F6F4' : '#FFF0F0',
      statusColor: ok ? '#0B6E6A' : '#C71C37',
      statusDetail: detail || (ok ? '探测通过，运行时由任务再连接' : '请先配对 HID 设备后再检查'),
      enableHint: ok
        ? '探测通过，可开启下方开关启用 HID。'
        : '探测未通过时不能启用。请先检查连接。'
    };
  },

  loadEnabled() {
    let p = params.load();
    return p.hidEnabled === true;
  },

  saveEnabled(on) {
    let p = params.load();
    p.hidEnabled = on === true;
    params.save(p);
  },

  refreshStatus(showLoading) {
    if (this.data._checking) {
      return;
    }
    this.setData({ _checking: true });
    if (showLoading) {
      this.showLoading('正在探测 HID，可能需要十几秒…');
    }
    let result = { ok: false, message: '未检测到 HID 设备连接' };
    try {
      result = hid.checkConnected() || result;
    } catch (e) {
      result = { ok: false, message: 'HID 检查失败：' + ((e && e.message) || e) };
    }
    if (showLoading) {
      this.hideLoading();
    }
    let connected = result.ok === true;
    let patch = this.statusView(connected, result.message);
    let enabled = this.loadEnabled();
    if (enabled && !connected) {
      enabled = false;
      this.saveEnabled(false);
    }
    patch.hidEnabled = enabled;
    patch._checking = false;
    this.setData(patch);
    return connected;
  },

  onLoad() {
    this.setData({
      hidEnabled: this.loadEnabled(),
      _ready: true
    });
    this.refreshStatus(false);
  },

  onShow() {
    this.setData({
      hidEnabled: this.loadEnabled(),
      _ready: true
    });
    this.refreshStatus(false);
  },

  onCheck() {
    let ok = this.refreshStatus(true);
    if (ok) {
      this.toast('HID 可连接');
    } else {
      this.toast('HID 不可连接');
    }
  },

  onHidChange(e) {
    let on = !!(e && e.value === true);
    if (this.data._checking) {
      this.setData({ hidEnabled: this.data.hidEnabled === true });
      return;
    }

    if (!on) {
      this.setData({ hidEnabled: false });
      this.saveEnabled(false);
      return;
    }

    this.setData({ _checking: true, hidEnabled: true });
    this.showLoading('正在探测 HID，可能需要十几秒…');
    let result = { ok: false, message: 'HID 不可连接，请先配对设备后再启用。' };
    try {
      result = hid.checkConnected() || result;
    } catch (err) {
      result = {
        ok: false,
        message: 'HID 检查失败：' + ((err && err.message) || err)
      };
    }
    this.hideLoading();

    let connected = result.ok === true;
    let patch = this.statusView(connected, result.message);
    patch._checking = false;

    if (!connected) {
      patch.hidEnabled = false;
      patch.hidDialogOpen = true;
      patch.hidDialogText = result.message || 'HID 不可连接，探测未通过时不能启用。';
      this.setData(patch);
      this.saveEnabled(false);
      return;
    }

    patch.hidEnabled = true;
    this.setData(patch);
    this.saveEnabled(true);
    this.toast('HID 已启用');
  },

  onCloseHidDialog() {
    this.setData({ hidDialogOpen: false });
  }
});
