/**
 * 评论配图：话术图另存到相册 → 选第一张 → 用完删除。
 * imageUploader 存的是 content://，必须走 saveContentImageToGallery，不能当文件路径 saveImage。
 */
let Common = require('../app/xhs/Common.js');

module.exports = {
  PREFIX: 'deeke_del_',
  RELATIVE_PATH: 'Pictures',
  _lastUri: '',
  _lastName: '',

  javaStr(v) {
    let s = '' + (v == null ? '' : v);
    try {
      if (typeof java !== 'undefined' && java.lang && java.lang.String) {
        return java.lang.String.valueOf(s);
      }
    } catch (e) {}
    return String(s);
  },

  isContentUri(path) {
    return String(path || '').indexOf('content://') === 0;
  },

  ensureMediaPermission() {
    try {
      if (Access.hasMediaReadPermission()) {
        return true;
      }
    } catch (e) {
      return true;
    }
    try {
      if (Access.isMediaPermissionPermanentlyDenied()) {
        Access.openPermissionSettings();
        return false;
      }
    } catch (e2) {}
    try {
      Access.requestMediaPermissions();
    } catch (e3) {}
    return false;
  },

  /**
   * @returns {string|null} 新入库的 content uri
   */
  stageLocalImage(localPath) {
    this.deleteLastStaged();
    let src = String(localPath || '').trim();
    if (!src) {
      Log.log('stageLocalImage：路径为空');
      return null;
    }
    this.ensureMediaPermission();

    let name = this.PREFIX + Date.now() + '.jpg';
    let nameJ = this.javaStr(name);
    let pathJ = this.javaStr(this.RELATIVE_PATH);
    let uri = null;

    Log.log('stageLocalImage：' + (this.isContentUri(src) ? 'contentUri' : 'file') + ' → ' + name);

    if (this.isContentUri(src)) {
      try {
        uri = MediaStore.saveContentImageToGallery(this.javaStr(src), nameJ, pathJ);
      } catch (e1) {
        Log.log('saveContentImageToGallery 三参失败：' + ((e1 && e1.message) || e1));
      }
      if (!uri) {
        try {
          uri = MediaStore.saveContentImageToGallery(this.javaStr(src));
        } catch (e2) {
          Log.log('saveContentImageToGallery 单参失败：' + ((e2 && e2.message) || e2));
        }
      }
    } else {
      try {
        uri = MediaStore.saveImage(this.javaStr(src), nameJ, pathJ);
      } catch (e3) {
        Log.log('saveImage 三参失败：' + ((e3 && e3.message) || e3));
      }
      if (!uri) {
        try {
          uri = MediaStore.saveImage(this.javaStr(src));
        } catch (e4) {
          Log.log('saveImage 单参失败：' + ((e4 && e4.message) || e4));
        }
      }
    }

    if (!uri) {
      Log.log('stageLocalImage：入库失败');
      return null;
    }

    this._lastUri = String(uri);
    this._lastName = name;
    Log.log('stageLocalImage：成功 uri=' + this._lastUri);
    System.sleep(600);
    return this._lastUri;
  },

  deleteLastStaged() {
    let uri = this._lastUri;
    this._lastUri = '';
    this._lastName = '';
    if (!uri) {
      return;
    }
    try {
      MediaStore.deleteImage(uri);
      Log.log('已删除临时配图：' + uri);
    } catch (e) {
      Log.log('删除临时配图失败：' + ((e && e.message) || e));
    }
  },

  clickNode(tag) {
    if (!tag) {
      return false;
    }
    try {
      let b = tag.bounds();
      Common.tapAt(b.centerX(), b.centerY());
      return true;
    } catch (e) {
      try {
        tag.click();
        return true;
      } catch (e2) {
        return false;
      }
    }
  },

  dismissPhotoPermission() {
    let tips = ['允许完全访问', '允许访问全部照片', '允许访问所有照片', '始终允许', '仅在使用该应用时允许', '使用时允许', '允许'];
    for (let i = 0; i < tips.length; i++) {
      let tip = tips[i];
      let tag =
        UiSelector().text(tip).isVisibleToUser(true).findOne() ||
        UiSelector().textContains(tip).isVisibleToUser(true).findOne();
      if (!tag) {
        continue;
      }
      let label = '';
      try {
        label = String(tag.text() || tip);
      } catch (e) {
        label = tip;
      }
      if (tip === '允许' && (label.indexOf('禁止') >= 0 || label.indexOf('拒绝') >= 0 || label.indexOf('部分') >= 0)) {
        continue;
      }
      Log.log('相册权限：' + label);
      this.clickNode(tag);
      System.sleep(1200);
      return true;
    }
    return false;
  },

  /** 点首格右上勾选（当前小红书 MaterialSelect） */
  selectFirstPhoto() {
    let winW = 1080;
    try {
      winW = Device.width() || winW;
    } catch (e) {}

    let checks = UiSelector()
      .className('android.widget.FrameLayout')
      .clickable(true)
      .isVisibleToUser(true)
      .filter(function (v) {
        try {
          let b = v.bounds();
          let w = b.width();
          let h = b.height();
          return w >= 100 && w <= 220 && h >= 100 && h <= 220 && b.left() < winW * 0.4 && b.top() > 200 && b.top() < 900;
        } catch (e2) {
          return false;
        }
      })
      .find();

    if (checks && checks.length) {
      let best = null;
      let score = 1e18;
      for (let i = 0; i < checks.length; i++) {
        try {
          let b = checks[i].bounds();
          let s = b.top() * 10000 + b.left();
          if (s < score) {
            score = s;
            best = checks[i];
          }
        } catch (e3) {}
      }
      if (best) {
        Log.log('选图：点首格勾选');
        return this.clickNode(best);
      }
    }

    // 旧版空 TextView 勾选
    let emptyTv = UiSelector()
      .className('android.widget.TextView')
      .isVisibleToUser(true)
      .filter(function (v) {
        return !v.text();
      })
      .findOne();
    if (emptyTv) {
      Log.log('选图：点空 TextView');
      return this.clickNode(emptyTv);
    }

    let x = Math.floor(winW / 3 - 40);
    let y = 420;
    Log.log('选图：坐标兜底 ' + x + ',' + y);
    Common.tapAt(x, y);
    return true;
  },

  pickFirstStaged(addImageTag) {
    if (!addImageTag) {
      return false;
    }
    if (!this._lastUri) {
      Log.log('pickFirstStaged：尚未入库，取消');
      return false;
    }
    try {
      let b = addImageTag.bounds();
      Common.tapAt(b.centerX(), b.centerY());
    } catch (e) {
      try {
        addImageTag.click();
      } catch (e2) {
        return false;
      }
    }
    System.sleep(1800 + 800 * Math.random());
    this.dismissPhotoPermission();
    System.sleep(800);

    this.selectFirstPhoto();
    System.sleep(1200 + 600 * Math.random());

    // 选中后文案是「完成(1)」，不能用精确 text('完成')
    let btnTag =
      UiSelector().textContains('完成').isVisibleToUser(true).findOne() ||
      UiSelector().text('发送').isVisibleToUser(true).findOne() ||
      UiSelector().textContains('下一步').isVisibleToUser(true).findOne();
    if (!btnTag) {
      System.sleep(1500);
      btnTag =
        UiSelector().textContains('完成').isVisibleToUser(true).findOne() ||
        UiSelector().text('发送').isVisibleToUser(true).findOne();
    }
    if (!btnTag) {
      Log.log('选图：未找到完成(n)');
      return false;
    }
    let btnText = '';
    try {
      btnText = String(btnTag.text() || '');
    } catch (eBtn) {}
    Log.log('选图：点击「' + btnText + '」');
    this.clickNode(btnTag);
    System.sleep(1800 + 800 * Math.random());
    return true;
  },

  cleanupRecent() {
    try {
      let images = MediaStore.getImages() || [];
      for (let i = 0; i < images.length; i++) {
        let image = images[i] || {};
        let name = String(image.name || '');
        if (name.indexOf(this.PREFIX) !== 0) {
          continue;
        }
        try {
          MediaStore.deleteImage(image.uri);
        } catch (e) {}
      }
    } catch (e2) {}
    this._lastUri = '';
    this._lastName = '';
  }
};
