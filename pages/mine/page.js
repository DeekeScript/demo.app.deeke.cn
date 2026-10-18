let permission = require('../../common/permission.js');
let device = require('../../common/device.js');
let config = require('../../common/config.js');
let update = require('../../common/update.js');

Page({
  data: {
    accessText: '',
    floatText: '',
    batteryText: '',
    accessColor: '#7A8A88',
    floatColor: '#7A8A88',
    batteryColor: '#7A8A88',
    showAccessBtn: true,
    showFloatBtn: true,
    showBatteryBtn: true,
    deviceId: '',
    supportWechat: '',
    toolCode: '',
    localVersion: '',
    updateHint: '点击检查是否有新版本',
    hasUpdate: false,
    guideOpen: false,
    supportOpen: false,
    updateOpen: false,
    updateTitle: '发现新版本'
  },

  statusColor(ok) {
    return ok ? '#0B6E6A' : '#C65A12';
  },

  applyUpdateResult(result) {
    if (!result || !result.ok) {
      this.setData({
        localVersion: update.currentVersionName() + ' (' + update.currentVersionCode() + ')',
        updateHint: (result && result.message) || '检查失败',
        hasUpdate: false
      });
      return;
    }
    let latest = result.latest || null;
    let hint = result.message || '已是最新版本';
    if (result.hasUpdate && latest) {
      hint = '可更新到 ' + (latest.version || latest.versionCode);
      if (result.sizeText) {
        hint += ' · ' + result.sizeText;
      }
    }
    this.setData({
      localVersion: result.localVersion || (update.currentVersionName() + ' (' + update.currentVersionCode() + ')'),
      updateHint: hint,
      hasUpdate: !!result.hasUpdate
    });
  },

  refreshActivation() {
    let card = this.selectComponent('activationCard');
    if (card) {
      card.call('refresh');
    }
  },

  refresh() {
    let snap = permission.permissionSnapshot();
    this.setData({
      accessText: snap.accessibilityText,
      floatText: snap.floatText,
      batteryText: snap.batteryText,
      accessColor: this.statusColor(!!snap.accessibility),
      floatColor: this.statusColor(!!snap.floatWindow),
      batteryColor: this.statusColor(!!snap.battery),
      showAccessBtn: !snap.accessibility,
      showFloatBtn: !snap.floatWindow,
      showBatteryBtn: !snap.battery,
      deviceId: device.getDeviceId(),
      supportWechat: config.supportWechat || 'DeekeScript',
      toolCode: config.toolCode,
      localVersion: update.currentVersionName() + ' (' + update.currentVersionCode() + ')'
    });
    this.refreshActivation();
  },

  onLoad() {
    this.refresh();
  },

  onShow() {
    this.refresh();
  },

  openUpdate(view) {
    if (!view) {
      return;
    }
    this._updateView = view;
    this.setData({
      updateOpen: true,
      updateTitle: view.updateTitle || '发现新版本'
    });
    let that = this;
    setTimeout(function () {
      let dialog = that.selectComponent('updateDialog');
      if (dialog) {
        dialog.call('apply', that._updateView);
      }
    }, 30);
  },

  onOpenGuide() {
    this.setData({ guideOpen: true });
  },

  onCloseGuide() {
    this.setData({ guideOpen: false });
  },

  onOpenFloat() {
    Access.openFloatWindowsSetting();
  },

  onBattery() {
    permission.ensureBatteryHint();
    let that = this;
    // 从系统页返回后 onShow 会刷新；这里稍后再刷一次以覆盖确认框路径
    setTimeout(function () {
      that.refresh();
    }, 1200);
  },

  onCopyDevice() {
    System.setClip(device.getDeviceId());
    this.toast('已复制设备号');
  },

  onGoLogs() {
    this.navigate({ page: 'pages/logs' });
  },

  onOpenSupport() {
    this.setData({ supportOpen: true });
  },

  onCloseSupport() {
    this.setData({ supportOpen: false });
  },

  onCopyWechat() {
    let wx = this.data.supportWechat || config.supportWechat || 'DeekeScript';
    System.setClip(wx);
    this.toast('已复制微信号');
  },

  onCheckUpdate() {
    this.toast('正在检查…');
    let result = update.check(true);
    this.applyUpdateResult(result);
    let view = update.dialogState(result);
    if (view) {
      this.openUpdate(view);
    } else if (result && result.ok && !result.hasUpdate) {
      this.toast(result.message || '已是最新版本');
    }
  },

  onUpdateChecked(e) {
    let result = e && e.detail ? e.detail : null;
    this.applyUpdateResult(result);
    let view = update.dialogState(result);
    if (view) {
      this._updateView = view;
    }
  },

  onSkipUpdate() {
    this.setData({ updateOpen: false });
    this.toast('今日不再提醒');
  },

  onCloseUpdate() {
    this.setData({ updateOpen: false });
  },

  onDoUpdate() {
    let view = this._updateView;
    if (!view) {
      let result = update.check(true);
      this.applyUpdateResult(result);
      view = update.dialogState(result);
    }
    if (!view) {
      this.toast('没有可下载的版本');
      return;
    }
    this._updateView = view;
    this.setData({
      updateOpen: true,
      updateTitle: view.updateTitle || '发现新版本'
    });
    let that = this;
    setTimeout(function () {
      let dialog = that.selectComponent('updateDialog');
      if (!dialog) {
        return;
      }
      dialog.call('apply', that._updateView);
      dialog.call('onDoUpdate');
    }, 30);
  }
});
