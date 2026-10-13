let permission = require('../../common/permission.js');
let activation = require('../../common/activation.js');
let config = require('../../common/config.js');
let params = require('../../common/params.js');
let update = require('../../common/update.js');
let protocol = require('../../common/protocol.js');
let target = require('../../common/target.js');
let logger = require('../../common/logger.js');

Page({
  data: {
    showTargetCard: false,
    targetTitle: '',
    targetSummary: '',
    targetDetail: '',
    targetTag: '',
    targetTagBg: '#EEF2F1',
    targetTagColor: '#667',
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
    stopHintOpen: false,
    guideOpen: false,
    updateOpen: false,
    updateTitle: '发现新版本'
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

  refreshActivation() {
    let card = this.selectComponent('activationCard');
    if (card) {
      card.call('refresh');
    }
  },

  refresh() {
    this.refreshTargetCard();
    this.refreshActivation();
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

  autoCheckUpdate() {
    if (!update.shouldAutoCheck()) {
      return;
    }
    let view = update.dialogState(update.check(false));
    if (view) {
      this.openUpdate(view);
    }
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

  onGoMine() {
    this.setData({ guideOpen: false });
    this.switchTab({ page: 'pages/mine' });
  },

  onCloseGuide() {
    this.setData({ guideOpen: false });
  },

  onSkipUpdate() {
    this.setData({ updateOpen: false });
  },

  onCloseUpdate() {
    this.setData({ updateOpen: false });
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

  hasStopHint() {
    return Storage.get(config.storagePrefix + 'run.stopHint') === '1';
  },

  onCancelStopHint() {
    this.setData({ stopHintOpen: false });
  },

  onConfirmStopHint() {
    Storage.put(config.storagePrefix + 'run.stopHint', '1');
    this.setData({ stopHintOpen: false });
    this.onRun();
  },

  onRun() {
    if (!this.data.agreeProtocol) {
      logger.warn('run', '未勾选用户协议');
      this.setData({ agreeTipOpen: true });
      return;
    }
    if (!params.hasConfigured()) {
      logger.warn('run', '首次未完成设置');
      this.setData({ paramsDialogOpen: true });
      return;
    }
    let paid = activation.ensurePaid();
    if (!paid.ok) {
      logger.warn('run', '激活检查失败: ' + (paid.message || ''));
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
        logger.warn('run', tip);
        this.setData({
          targetDialogOpen: true,
          targetDialogText: tip
        });
        return;
      }
    } else {
      logger.info('run', '用户选择仍要运行（跳过适配检测）');
      this.setData({ skipTargetGate: false });
    }
    if (!Access.isAccessibilityServiceEnabled()) {
      logger.warn('run', '无障碍未开启');
      this.setData({ guideOpen: true });
      return;
    }
    if (!Access.isFloatWindowsEnabled()) {
      logger.warn('run', '悬浮窗未开启');
      permission.ensureFloat();
      return;
    }
    if (!this.hasStopHint()) {
      logger.info('run', '首次运行，等待确认关闭方式');
      this.setData({ stopHintOpen: true });
      return;
    }
    logger.info('run', '启动 tasks/rpa.js');
    permission.runScript('tasks/rpa.js');
  }
});
