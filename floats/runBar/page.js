/**
 * 任务运行条。点「停止」通知任务线程结束。
 * 悬浮窗回调里 Engines.closeAll() 无效，这里用 FloatWindow.stopTask()。
 */
let config = require('../../common/config.js');
let TITLE_KEY = config.storagePrefix + 'runBar.title';
let STOP_KEY = config.storagePrefix + 'runBar.stop';
let TOAST_KEY = config.storagePrefix + 'runBar.toasted';

Page({
  onShow: function () {
    this.watchTitle();
  },
  onClose: function () {
    this.stopWatch();
  },
  watchTitle: function () {
    if (this._timer) {
      return;
    }
    let that = this;
    this._timer = setInterval(function () {
      let title = Storage.get(TITLE_KEY);
      if (!title) {
        return;
      }
      let bar = that.selectComponent('bar');
      if (bar && bar.setData) {
        bar.setData({ title: title });
      }
    }, 300);
  },
  stopWatch: function () {
    if (this._timer) {
      clearInterval(this._timer);
      this._timer = null;
    }
  },
  onStop: function () {
    if (this._stopped) {
      return;
    }
    this._stopped = true;
    Storage.putBoolean(STOP_KEY, true);
    Storage.put(TOAST_KEY, '1');
    this.stopWatch();
    System.toast('任务已关闭');
    FloatPage.close('runBar');
    FloatWindow.stopTask();
  }
});
