Page({
  openLink(url) {
    try {
      App.openUrl(url);
    } catch (e) {
      this.toast('打开失败');
    }
  },

  copy(url) {
    System.setClip(url);
    this.toast('已复制');
  },

  onOpenSign() {
    this.openLink('https://platform.deepseek.com');
  },

  onCopySign() {
    this.copy('https://platform.deepseek.com');
  },

  onOpenTopUp() {
    this.openLink('https://platform.deepseek.com/top_up');
  },

  onCopyTopUp() {
    this.copy('https://platform.deepseek.com/top_up');
  },

  onOpenKeys() {
    this.openLink('https://platform.deepseek.com/api_keys');
  },

  onCopyKeys() {
    this.copy('https://platform.deepseek.com/api_keys');
  }
});
