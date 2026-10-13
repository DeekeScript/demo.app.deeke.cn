let guide = require('../../common/guide.js');

Component({
  data: {
    guideAppName: guide.appName()
  },

  attached() {
    let name = guide.appName();
    if (name) {
      this.setData({ guideAppName: name });
    }
  },

  onClose() {
    this.triggerEvent('close');
  },

  onOpenAccessibility() {
    this.triggerEvent('close');
    Access.openAccessibilityServiceSetting();
  }
});
