/**
 * 任务运行条。标题由任务通过 FloatPage.setData 写入。
 * 点停止用事件通知任务，再由 FloatWindow.stopTask 结束脚本。
 * 悬浮窗回调里 Engines.closeAll() 无效。
 */
Page({
  data: {
    title: '任务正在执行',
    dotOpacity: 1
  },

  onShow: function () {
    this.blink();
  },

  onClose: function () {
    this.stopBlink();
  },

  blink: function () {
    if (this._dotTimer) {
      return;
    }
    let that = this;
    let bright = true;
    this._dotTimer = setInterval(function () {
      bright = !bright;
      that.setData({ dotOpacity: bright ? 1 : 0.45 });
    }, 700);
  },

  stopBlink: function () {
    if (this._dotTimer) {
      clearInterval(this._dotTimer);
      this._dotTimer = null;
    }
  },

  onStop: function () {
    if (this._stopped) {
      return;
    }
    this._stopped = true;
    this.stopBlink();
    Events.emit('run_stop');
    FloatWindow.stopTask();
  }
});
