let permission = require('../../common/permission.js');
let activation = require('../../common/activation.js');
let device = require('../../common/device.js');
let config = require('../../common/config.js');
let update = require('../../common/update.js');
let guide = require('../../common/guide.js');

Page({
  data: {
    statusTitle: '',
    statusDetail: '',
    accessText: '',
    floatText: '',
    accessBg: '#EEF2F1',
    accessColor: '#667',
    floatBg: '#EEF2F1',
    floatColor: '#667',
    deviceId: '',
    supportWechat: '',
    toolCode: '',
    localVersion: '',
    updateHint: '点击检查是否有新版本',
    hasUpdate: false,
    updateOpen: false,
    updateTitle: '发现新版本',
    updateVersionLine: '',
    updateSizeLine: '',
    hasUpdateSize: false,
    updateChangelog: '',
    canSkipUpdate: true,
    updateConfirmText: '立即更新',
    pendingLatest: null,
    guideOpen: false,
    guideAppName: guide.appName()
  },

  tagStyle(ok) {
    if (ok) {
      return { bg: '#E8F6F4', color: '#0B6E6A' };
    }
    return { bg: '#FFF1E8', color: '#C65A12' };
  },

  applyUpdateResult(result, silent) {
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
      hasUpdate: !!result.hasUpdate,
      pendingLatest: latest
    });
    if (result.hasUpdate && latest && !silent) {
      let sizeText = result.sizeText || update.formatSize(latest.size);
      this.setData({
        updateOpen: true,
        updateTitle: result.forceUpdate ? '需要更新后才能继续使用' : '发现新版本',
        updateVersionLine: '最新：' + (latest.version || '') + '（' + (latest.versionCode || '') + '）',
        updateSizeLine: sizeText ? ('大小：' + sizeText) : '',
        hasUpdateSize: !!sizeText,
        updateChangelog: result.changelog || '',
        canSkipUpdate: !result.forceUpdate,
        updateConfirmText: '立即更新'
      });
    }
  },

  refresh() {
    let snap = permission.permissionSnapshot();
    let a = this.tagStyle(snap.accessibility);
    let f = this.tagStyle(snap.floatWindow);
    let online = activation.checkOnline();
    let st = online.status || activation.formatStatus(activation.readCache());
    this.setData({
      statusTitle: st.text,
      statusDetail: online.ok ? st.detail : (online.message || st.detail),
      accessText: snap.accessibilityText,
      floatText: snap.floatText,
      accessBg: a.bg,
      accessColor: a.color,
      floatBg: f.bg,
      floatColor: f.color,
      deviceId: device.getDeviceId(),
      supportWechat: config.supportWechat || 'DeekeScript',
      toolCode: config.toolCode,
      localVersion: update.currentVersionName() + ' (' + update.currentVersionCode() + ')'
    });
  },

  onLoad() {
    this.refresh();
  },

  onShow() {
    this.refresh();
  },

  onGoPay() {
    this.navigate({ page: 'pages/pay' });
  },

  onOpenGuide() {
    this.setData({ guideOpen: true });
  },

  onCloseGuide() {
    this.setData({ guideOpen: false });
  },

  onOpenAccessibility() {
    this.setData({ guideOpen: false });
    Access.openAccessibilityServiceSetting();
  },

  onOpenFloat() {
    permission.ensureFloat();
  },

  onBattery() {
    permission.ensureBatteryHint();
  },

  onCopyDevice() {
    System.setClip(device.getDeviceId());
    this.toast('已复制设备号');
  },

  onCopyWechat() {
    let wx = this.data.supportWechat || config.supportWechat || 'DeekeScript';
    System.setClip(wx);
    this.toast('已复制微信号');
  },

  onCheckUpdate() {
    this.toast('正在检查…');
    let result = update.check(true);
    this.applyUpdateResult(result, false);
    if (result.ok && !result.hasUpdate) {
      this.toast(result.message || '已是最新版本');
    }
  },

  onSkipUpdate() {
    let latest = this.data.pendingLatest || {};
    update.skipToday(latest.versionCode);
    this.setData({ updateOpen: false });
    this.toast('今日不再提醒');
  },

  onDoUpdate() {
    let latest = this.data.pendingLatest;
    if (!latest || !latest.downloadUrl) {
      let result = update.check(true);
      this.applyUpdateResult(result, true);
      latest = this.data.pendingLatest;
    }
    if (!latest || !latest.downloadUrl) {
      this.toast('没有可下载的版本');
      return;
    }
    this.setData({ updateConfirmText: '下载中…' });
    this.toast('开始下载…');
    let done = update.downloadAndInstall(latest);
    this.setData({
      updateConfirmText: '立即更新',
      updateOpen: done.ok ? false : this.data.updateOpen
    });
    this.toast(done.message || (done.ok ? '请按提示安装' : '更新失败'));
  }
});
