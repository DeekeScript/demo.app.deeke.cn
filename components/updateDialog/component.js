let update = require('../../common/update.js');

Component({
  data: {
    updateVersionLine: '',
    updateSizeLine: '',
    hasUpdateSize: false,
    updateChangelog: '',
    canSkipUpdate: true,
    updateConfirmText: '立即更新',
    pendingLatest: null
  },

  apply(view) {
    if (!view) {
      return;
    }
    this.setData({
      updateVersionLine: view.updateVersionLine || '',
      updateSizeLine: view.updateSizeLine || '',
      hasUpdateSize: !!view.hasUpdateSize,
      updateChangelog: view.updateChangelog || '',
      canSkipUpdate: view.canSkipUpdate !== false,
      updateConfirmText: view.updateConfirmText || '立即更新',
      pendingLatest: view.pendingLatest || null
    });
  },

  onSkipUpdate() {
    let latest = this.data.pendingLatest || {};
    update.skipToday(latest.versionCode);
    this.triggerEvent('skip', { latest: latest });
  },

  onDoUpdate() {
    let latest = this.data.pendingLatest;
    let canSkip = this.data.canSkipUpdate !== false;
    if (!latest || !latest.downloadUrl) {
      let result = update.check(true);
      this.triggerEvent('checked', result);
      let view = update.dialogState(result);
      if (view && view.pendingLatest && view.pendingLatest.downloadUrl) {
        latest = view.pendingLatest;
        canSkip = view.canSkipUpdate !== false;
        this.apply(view);
      }
    }
    if (!latest || !latest.downloadUrl) {
      this.toast('没有可下载的版本');
      return;
    }
    this.setData({ updateConfirmText: '下载中…' });
    this.toast('开始下载…');
    let done = update.downloadAndInstall(latest);
    this.setData({ updateConfirmText: '立即更新' });
    this.toast(done.message || (done.ok ? '请按提示安装' : '更新失败'));
    if (done.ok || canSkip) {
      this.triggerEvent('close');
    }
  }
});
