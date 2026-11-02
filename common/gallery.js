/**
 * 话术配图：发送前复制到相册（deeke_del_时间戳），发送后/起止清理近 3 天同名文件。
 */
module.exports = {
  PREFIX: 'deeke_del_',
  KEEP_MS: 3 * 24 * 60 * 60 * 1000,

  ensureMediaPermission() {
    if (typeof Access === 'undefined') {
      return true;
    }
    if (Access.hasMediaReadPermission && Access.hasMediaReadPermission()) {
      return true;
    }
    if (Access.isMediaPermissionPermanentlyDenied && Access.isMediaPermissionPermanentlyDenied()) {
      Access.openPermissionSettings();
      return false;
    }
    if (Access.requestMediaPermissions) {
      Access.requestMediaPermissions();
    }
    return false;
  },

  stageLocalImage(localPath) {
    let src = String(localPath || '').trim();
    if (!src) {
      return null;
    }
    let name = this.PREFIX + Date.now() + '.jpg';
    let uri = MediaStore.saveImage(src, name);
    return uri || null;
  },

  /**
   * 在小红书已打开选图入口后：点「添加图片」类按钮 → 选第一张 → 点发送/完成/确认。
   */
  pickFirstStaged(addImageTag) {
    if (!addImageTag) {
      return false;
    }
    try {
      if (addImageTag.click) {
        addImageTag.click();
      } else {
        Gesture.click(addImageTag.bounds().centerX(), addImageTag.bounds().centerY());
      }
    } catch (e) {
      return false;
    }
    System.sleep(2000 + 1000 * Math.random());

    let allowTag = UiSelector().text('允许').isVisibleToUser(true).findOne();
    if (allowTag) {
      try {
        allowTag.click();
      } catch (e2) {
        Gesture.click(allowTag.bounds().centerX(), allowTag.bounds().centerY());
      }
      System.sleep(1500 + 1000 * Math.random());
    }

    let selectPhotoCheckTag = UiSelector().className('android.widget.TextView').isVisibleToUser(true).filter(function (v) {
      return !v.text();
    }).findOne();
    if (!selectPhotoCheckTag) {
      selectPhotoCheckTag = UiSelector().className('android.widget.ImageView').isVisibleToUser(true).filter(function (v) {
        return v.parent() && v.parent().className() === 'android.widget.FrameLayout';
      }).findOne();
    }
    if (selectPhotoCheckTag) {
      try {
        Gesture.click(selectPhotoCheckTag.bounds().centerX(), selectPhotoCheckTag.bounds().centerY());
      } catch (e3) {
        return false;
      }
    }
    System.sleep(2000 + 1000 * Math.random());

    let btnTag =
      UiSelector().text('发送').isVisibleToUser(true).findOne() ||
      UiSelector().text('完成').isVisibleToUser(true).findOne() ||
      UiSelector().textContains('确认').isVisibleToUser(true).findOne() ||
      UiSelector().textContains('下一步').isVisibleToUser(true).findOne();
    if (!btnTag) {
      System.sleep(2000);
      btnTag =
        UiSelector().text('发送').isVisibleToUser(true).findOne() ||
        UiSelector().text('完成').isVisibleToUser(true).findOne() ||
        UiSelector().textContains('确认').isVisibleToUser(true).findOne();
    }
    if (!btnTag) {
      return false;
    }
    try {
      btnTag.click();
    } catch (e4) {
      Gesture.click(btnTag.bounds().centerX(), btnTag.bounds().centerY());
    }
    System.sleep(2000 + 1000 * Math.random());
    return true;
  },

  parseStamp(name) {
    let n = String(name || '');
    let i = n.indexOf(this.PREFIX);
    if (i !== 0) {
      return 0;
    }
    let rest = n.substring(this.PREFIX.length);
    let num = parseInt(rest, 10);
    return isNaN(num) ? 0 : num;
  },

  cleanupRecent() {
    try {
      let images = MediaStore.getImages() || [];
      let now = Date.now();
      for (let i = 0; i < images.length; i++) {
        let image = images[i] || {};
        let name = String(image.name || '');
        if (name.indexOf(this.PREFIX) !== 0) {
          continue;
        }
        let stamp = this.parseStamp(name);
        let date = image.date ? Number(image.date) : 0;
        let t = stamp || date;
        if (!t || now - t <= this.KEEP_MS) {
          try {
            MediaStore.deleteImage(image.uri);
          } catch (e) {}
        }
      }
    } catch (e2) {}
  }
};
