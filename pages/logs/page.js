let logger = require('../../common/logger.js');

Page({
  data: {
    files: [],
    empty: true,
    summaryText: '',
    hint: '',
    clearConfirmOpen: false
  },

  refresh() {
    let files = logger.listFiles();
    this.setData({
      files: files,
      empty: !files.length,
      summaryText: files.length
        ? '共 ' + files.length + ' 个文件（最多保留 ' + logger.maxFiles + ' 天）'
        : '暂无日志文件'
    });
  },

  onLoad() {
    logger.info('logs', '打开诊断日志页');
    this.refresh();
  },

  onShow() {
    this.refresh();
  },

  onBack() {
    this.back();
  },

  onShareFile(e) {
    let item = (e && e.item) || {};
    let name = item.name || '';
    if (!name && e && e.index != null) {
      let list = this.data.files || [];
      let i = parseInt(e.index, 10);
      if (!isNaN(i) && list[i]) {
        name = list[i].name;
        item = list[i];
      }
    }
    if (!name) {
      this.toast('未找到日志文件');
      return;
    }
    let res = logger.shareByName(name);
    if (!res.ok) {
      let msg = res.message || '当前环境不支持分享';
      this.setData({ hint: msg });
      this.toast({ text: msg, duration: 'long' });
      return;
    }
    this.setData({ hint: '' });
    this.toast('请选择要分享到的应用');
  },

  onClear() {
    if (!this.data.files || !this.data.files.length) {
      this.toast('暂无日志可清空');
      return;
    }
    this.setData({ clearConfirmOpen: true });
  },

  onCancelClear() {
    this.setData({ clearConfirmOpen: false });
  },

  onConfirmClear() {
    this.setData({ clearConfirmOpen: false, hint: '' });
    logger.clear();
    this.refresh();
    this.toast('已清空');
  }
});
