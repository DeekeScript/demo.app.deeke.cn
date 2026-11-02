let params = require('../../common/params.js');
let hid = require('../../common/hid.js');

Page({
  data: {
    hidEnabled: false,
    connected: false,
    statusLabel: '未检查',
    statusBg: '#FFF0F0',
    statusColor: '#8A6A6A',
    statusDetail: '点击下方按钮检查 HID 连接',
    enableHint: '未连接时不能启用。请先检查连接状态。',
    hidDialogOpen: false,
    hidDialogText: '未检测到 HID 设备连接，请先连接后再启用。',
    _checking: false,
    _ready: false
  },

  statusView(connected, detail) {
    let ok = connected === true;
    return {
      connected: ok,
      statusLabel: ok ? '已连接' : '未连接',
      statusBg: ok ? '#E8F8EF' : '#FFF0F0',
      statusColor: ok ? '#1B7A45' : '#C71C37',
      statusDetail: detail || (ok ? '可以启用 HID' : '请先连接 HID 设备'),
      enableHint: ok
        ? '已连接，可开启下方开关启用 HID。'
        : '未连接时不能启用。请先检查连接状态。'
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
      this.showLoading('正在检查 HID…');
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
      this.toast('HID 已连接');
    } else {
      this.toast('HID 未连接');
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

    // 启用前必须已连接；再复查一次
    this.setData({ _checking: true, hidEnabled: true });
    this.showLoading('正在检查 HID…');
    let result = { ok: false, message: '未检测到 HID 设备连接，请先连接后再启用。' };
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
      patch.hidDialogText = result.message || '未检测到 HID 设备连接，未连接时不能启用。';
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
