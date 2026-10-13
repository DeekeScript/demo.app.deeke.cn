let activation = require('../../common/activation.js');

function statusView(st) {
  let activated = !!(st && st.activated);
  return {
    statusTitle: activated ? (st.text || '已开通') : '待激活',
    statusDetail: activated ? (st.detail || '') : '激活后才能正常使用本应用',
    showPayEntry: !activated
  };
}

Component({
  data: {
    statusTitle: '待激活',
    statusDetail: '激活后才能正常使用本应用',
    showPayEntry: true,
    paintTick: 0
  },

  attached() {
    this.refresh();
  },

  paint(next) {
    if (!next) {
      return;
    }
    this._paint = (this._paint || 0) + 1;
    next.paintTick = this._paint;
    this.setData(next);
  },

  refresh() {
    let now = Date.now();
    if (this._refreshAt && now - this._refreshAt < 800) {
      this.paint({
        statusTitle: this.data.statusTitle || '待激活',
        statusDetail: this.data.statusDetail || '激活后才能正常使用本应用',
        showPayEntry: this.data.showPayEntry !== false
      });
      return;
    }
    this._refreshAt = now;
    let online = activation.checkOnline();
    if (!online.ok) {
      let view = statusView(activation.formatStatus(activation.readCache()));
      if (online.message) {
        view.statusDetail = online.message;
      }
      this.paint(view);
      return;
    }
    this.paint(statusView(online.status));
  },

  onGoPay() {
    this.navigate({ page: 'pages/pay' });
  }
});
