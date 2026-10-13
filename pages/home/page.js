let permission = require('../../common/permission.js');
let activation = require('../../common/activation.js');
let params = require('../../common/params.js');
let update = require('../../common/update.js');
let guide = require('../../common/guide.js');
let protocol = require('../../common/protocol.js');
let target = require('../../common/target.js');

Page({
  data: {
    statusTitle: '检测中…',
    statusDetail: '',
    statusTag: '…',
    statusTagBg: '#EEF2F1',
    statusTagColor: '#667',
    showPayEntry: false,
    showTargetCard: false,
    targetTitle: '',
    targetSummary: '',
    targetDetail: '',
    targetTag: '',
    targetTagBg: '#EEF2F1',
    targetTagColor: '#667',
    guideOpen: false,
    guideAppName: guide.appName(),
    agreeProtocol: protocol.readAgreed(),
    protocolOpen: false,
    protocolHtml: protocol.html,
    agreeTipOpen: false,
    paramsDialogOpen: false,
    payDialogOpen: false,
    payDialogText: '激活后才能正常使用本应用',
    targetDialogOpen: false,
    targetDialogText: '',
    skipTargetGate: false,
    updateOpen: false,
    updateTitle: '发现新版本',
    updateVersionLine: '',
    updateSizeLine: '',
    hasUpdateSize: false,
    updateChangelog: '',
    canSkipUpdate: true,
    updateConfirmText: '立即更新',
    pendingLatest: null
  },

  tagStyle(ok) {
    if (ok) {
      return { bg: '#E8F6F4', color: '#0B6E6A' };
    }
    return { bg: '#FFF1E8', color: '#C65A12' };
  },

  refreshTargetCard() {
    let card = target.homeCard();
    if (!card.show) {
      this.setData({ showTargetCard: false });
      return;
    }
    this.setData({
      showTargetCard: true,
      targetTitle: card.title,
      targetSummary: card.summary,
      targetDetail: card.detail,
      targetTag: card.tag,
      targetTagBg: card.tagBg,
      targetTagColor: card.tagColor
    });
  },

  refresh() {
    this.refreshTargetCard();

    let result = activation.checkOnline();
    if (!result.ok) {
      let cache = activation.formatStatus(activation.readCache());
      this.setData({
        statusTitle: cache.text,
        statusDetail: result.message || cache.detail,
        statusTag: '离线',
        statusTagBg: '#EEF2F1',
        statusTagColor: '#667',
        showPayEntry: !cache.activated
      });
      return;
    }
    let st = result.status;
    let okStyle = this.tagStyle(st.activated);
    this.setData({
      statusTitle: st.activated ? st.text : '待激活',
      statusDetail: st.activated ? st.detail : '激活后，才能正常使用本APP',
      statusTag: st.activated ? '可用' : '待支付',
      statusTagBg: okStyle.bg,
      statusTagColor: okStyle.color,
      showPayEntry: !st.activated
    });
  },

  autoCheckUpdate() {
    if (!update.shouldAutoCheck()) {
      return;
    }
    let result = update.check(false);
    if (!result.ok || !result.hasUpdate || !result.latest) {
      return;
    }
    let latest = result.latest;
    let sizeText = result.sizeText || '';
    this.setData({
      updateOpen: true,
      updateTitle: result.forceUpdate ? '需要更新后才能继续使用' : '发现新版本',
      updateVersionLine: '最新：' + (latest.version || '') + '（' + (latest.versionCode || '') + '）',
      updateSizeLine: sizeText ? ('大小：' + sizeText) : '',
      hasUpdateSize: !!sizeText,
      updateChangelog: result.changelog || '',
      canSkipUpdate: !result.forceUpdate,
      updateConfirmText: '立即更新',
      pendingLatest: latest
    });
  },

  onLoad() {
    this.setData({ agreeProtocol: protocol.readAgreed() });
    this.refresh();
    this.autoCheckUpdate();
  },

  onShow() {
    this.setData({ agreeProtocol: protocol.readAgreed() });
    this.refresh();
  },

  onSkipUpdate() {
    let latest = this.data.pendingLatest || {};
    update.skipToday(latest.versionCode);
    this.setData({ updateOpen: false });
  },

  onDoUpdate() {
    let latest = this.data.pendingLatest;
    if (!latest || !latest.downloadUrl) {
      this.toast('没有可下载的版本');
      return;
    }
    this.setData({ updateConfirmText: '下载中…' });
    let done = update.downloadAndInstall(latest);
    this.setData({
      updateConfirmText: '立即更新',
      updateOpen: this.data.canSkipUpdate ? false : !done.ok
    });
    this.toast(done.message || (done.ok ? '请按提示安装' : '更新失败'));
  },

  onGoMine() {
    this.setData({ guideOpen: false });
    this.switchTab({ page: 'pages/mine' });
  },

  onCloseGuide() {
    this.setData({ guideOpen: false });
  },

  onOpenAccessibility() {
    this.setData({ guideOpen: false });
    Access.openAccessibilityServiceSetting();
  },

  onGoPay() {
    this.setData({ payDialogOpen: false });
    this.navigate({ page: 'pages/pay' });
  },

  onClosePayDialog() {
    this.setData({ payDialogOpen: false });
  },

  onGoTarget() {
    this.setData({ targetDialogOpen: false });
    this.navigate({ page: 'pages/target' });
  },

  onContinueDespiteTarget() {
    this.setData({ targetDialogOpen: false, skipTargetGate: true });
    this.onRun();
  },

  onGoParams() {
    this.setData({ paramsDialogOpen: false });
    this.switchTab({ page: 'pages/params' });
  },

  onCloseParamsDialog() {
    this.setData({ paramsDialogOpen: false });
  },

  onAgreeChange(e) {
    let ok = !!(e && e.value);
    protocol.saveAgreed(ok);
    this.setData({ agreeProtocol: ok });
  },

  onOpenProtocol() {
    this.setData({ protocolOpen: true });
  },

  onCloseProtocol() {
    this.setData({ protocolOpen: false });
  },

  onCloseAgreeTip() {
    this.setData({ agreeTipOpen: false });
  },

  onRun() {
    if (!this.data.agreeProtocol) {
      this.setData({ agreeTipOpen: true });
      return;
    }
    if (!params.hasConfigured()) {
      this.setData({ paramsDialogOpen: true });
      return;
    }
    let paid = activation.ensurePaid();
    if (!paid.ok) {
      if (paid.needPay) {
        this.setData({
          payDialogOpen: true,
          payDialogText: '激活后才能正常使用本应用'
        });
        return;
      }
      this.toast(paid.message || '检测失败');
      return;
    }
    if (!this.data.skipTargetGate) {
      let ready = target.ensureReady();
      if (ready.hasTarget && ready.needAction) {
        let tip = ready.message || '请先安装适配的目标 App 版本';
        tip += '。安装后请关闭应用市场自动更新，防止版本被升级。';
        this.setData({
          targetDialogOpen: true,
          targetDialogText: tip
        });
        return;
      }
    } else {
      this.setData({ skipTargetGate: false });
    }
    if (!Access.isAccessibilityServiceEnabled()) {
      this.setData({ guideOpen: true });
      return;
    }
    if (!Access.isFloatWindowsEnabled()) {
      permission.ensureFloat();
      return;
    }
    permission.runScript('tasks/rpa.js');
  }
});
