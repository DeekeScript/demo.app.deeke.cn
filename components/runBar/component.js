Component({
  data: {
    title: '任务正在执行',
    dotOpacity: 1
  },
  created(props) {
    if (props && props.title) {
      this.setData({ title: props.title });
    }
    this.blink();
  },
  detached() {
    this.stopBlink();
  },
  blink() {
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
  stopBlink() {
    if (this._dotTimer) {
      clearInterval(this._dotTimer);
      this._dotTimer = null;
    }
  },
  onStop() {
    this.triggerEvent('stop');
  }
});
