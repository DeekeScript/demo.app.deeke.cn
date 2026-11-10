/**
 * 评论配图：话术图另存到相册 → 抖音评论框点「插入图片」选第一张 → 用完删除。
 * imageUploader 存的是 content://，必须走 saveContentImageToGallery，不能当文件路径 saveImage。
 */
let Common = require('../app/dy/Common.js');

module.exports = {
  PREFIX: 'deeke_del_',
  /** 写到相机目录，抖音「所有照片」才会把它排在拍照右边的第一张 */
  RELATIVE_PATH: 'DCIM/Camera',
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
   * 把话术图落到应用缓存，得到 saveImage 能读的文件路径。
   * imageUploader 存的是 content://，不能直接当文件路径。
   */
  materialize(src) {
    let srcJ = this.javaStr(src);
    let cache = '';
    try {
      cache = String(Files.getCachePath() || '');
    } catch (e) {
      cache = '';
    }
    if (!cache) {
      return '';
    }
    let temp = cache + '/' + this.PREFIX + 'src_' + Date.now() + '.jpg';
    let tempJ = this.javaStr(temp);

    if (this.isContentUri(src)) {
      let copied = false;
      try {
        copied = !!Files.copyFromUri(srcJ, tempJ);
      } catch (e1) {
        Log.log('copyFromUri 失败：' + ((e1 && e1.message) || e1));
      }
      if (copied) {
        return temp;
      }
      try {
        let real = Files.getPathFromUri(srcJ);
        if (real && Files.exists(this.javaStr(real))) {
          return String(real);
        }
      } catch (e2) {
        Log.log('getPathFromUri 失败：' + ((e2 && e2.message) || e2));
      }
      return '';
    }

    try {
      if (Files.exists(srcJ)) {
        return src;
      }
    } catch (e3) {}
    try {
      if (Files.copyFromUri(srcJ, tempJ)) {
        return temp;
      }
    } catch (e4) {}
    return '';
  },

  /** 确认新文件已经是相册里最新的一张，抖音打开时才会排在第一格 */
  waitUntilNewest(name) {
    let stem = String(name || '').replace(/\.jpg$/i, '');
    for (let i = 0; i < 8; i++) {
      let images = [];
      try {
        images = MediaStore.getImages() || [];
      } catch (e) {
        images = [];
      }
      let newestName = '';
      let newestDate = -1;
      for (let j = 0; j < images.length; j++) {
        let item = images[j] || {};
        let n = String(item.name || '');
        let d = Number(item.date || 0);
        if (d >= newestDate) {
          newestDate = d;
          newestName = n;
        }
      }
      let firstName = images.length ? String((images[0] && images[0].name) || '') : '';
      Log.log('相册核对 ' + (i + 1) + ' 最新=' + newestName + ' 首条=' + firstName + ' 目标=' + name);
      if (newestName === name || (stem && newestName.indexOf(stem) === 0)) {
        return true;
      }
      if (firstName === name || (stem && firstName.indexOf(stem) === 0)) {
        return true;
      }
      System.sleep(400);
    }
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

    let filePath = this.materialize(src);
    if (!filePath) {
      Log.log('评论图没有读到本地文件：' + src);
      return null;
    }

    let name = this.PREFIX + Date.now() + '.jpg';
    let nameJ = this.javaStr(name);
    let pathJ = this.javaStr(this.RELATIVE_PATH);
    let uri = null;
    Log.log('stageLocalImage：另存 ' + filePath + ' → DCIM/Camera/' + name);

    try {
      uri = MediaStore.saveImage(this.javaStr(filePath), nameJ, pathJ);
    } catch (e1) {
      Log.log('saveImage 三参失败：' + ((e1 && e1.message) || e1));
    }
    if (!uri) {
      try {
        uri = MediaStore.saveImage(this.javaStr(filePath));
      } catch (e2) {
        Log.log('saveImage 单参失败：' + ((e2 && e2.message) || e2));
      }
    }
    if (filePath.indexOf(this.PREFIX + 'src_') >= 0) {
      try {
        Files.delete(this.javaStr(filePath));
      } catch (e3) {}
    }

    if (!uri) {
      Log.log('stageLocalImage：入库失败，相册里不会出现评论图');
      return null;
    }

    this._lastUri = String(uri);
    this._lastName = name;
    if (!this.waitUntilNewest(name)) {
      Log.log('入库后相册最新一张不是评论图，取消选图');
      this.deleteLastStaged();
      return null;
    }
    Log.log('stageLocalImage：已保存并排到最新 uri=' + this._lastUri);
    System.sleep(800);
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
      let x = b.left + b.width() * (0.35 + Math.random() * 0.3);
      let y = b.top + b.height() * (0.35 + Math.random() * 0.3);
      return Common.tapAt(x, y);
    } catch (e) {
      return false;
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

  /**
   * 点最新一张。相册按时间倒序，第一个符合尺寸的照片 ImageView 就是刚保存的图。
   * 宽度大于屏幕 1/4 且不超过 1/3，高度大于宽度的一半，用来排除图标。
   */
  selectFirstPhoto() {
    let photo = UiSelector().className('android.widget.ImageView').isVisibleToUser(true).filter(function (v) {
      try {
        let b = v.bounds();
        let w = b.width();
        let h = b.height();
        let sw = Device.width();
        if (!(w > sw / 4 && w <= sw / 3 && h > w / 2)) {
          return false;
        }
        let p = v.parent();
        if (!p || p.className() != 'android.widget.FrameLayout' || !p.isClickable()) {
          return false;
        }
        if (p.findOne(UiSelector().text('拍照')) || p.findOne(UiSelector().text('拍摄'))) {
          return false;
        }
        return true;
      } catch (e) {
        return false;
      }
    }).findOne();

    if (!photo) {
      Log.log('选图：没有找到 ImageView');
      return false;
    }
    let b = photo.bounds();
    let x = b.centerX();
    let y = b.centerY();
    Log.log('选图：点击第一张 ' + x + ',' + y);
    return Common.tapAt(x, y);
  },

  /**
   * 抖音评论：点「插入图片」→ 必要时进相册 → 选第一张。
   * 成功后由调用方发完评论再 deleteLastStaged。
   */
  pickForComment(localPath) {
    let uri = this.stageLocalImage(localPath);
    if (!uri) {
      return false;
    }

    let entry =
      UiSelector().desc('插入图片').isVisibleToUser(true).findOne() ||
      UiSelector().descContains('插入图片').isVisibleToUser(true).findOne() ||
      UiSelector().desc('图片').isVisibleToUser(true).findOne();
    if (!entry) {
      Log.log('未找到插入图片');
      this.deleteLastStaged();
      return false;
    }

    Log.log('点击插入图片');
    this.clickNode(entry);
    System.sleep(1600 + 800 * Math.random());
    this.dismissPhotoPermission();

    let album = UiSelector().text('相册').isVisibleToUser(true).findOne();
    if (album) {
      Log.log('进入相册');
      this.clickNode(album);
      System.sleep(1200 + 400 * Math.random());
      this.dismissPhotoPermission();
    }

    if (!this.selectFirstPhoto()) {
      Log.log('未点到第一张图');
      this.deleteLastStaged();
      return false;
    }
    System.sleep(900 + 400 * Math.random());

    let done =
      UiSelector().textContains('完成').isVisibleToUser(true).findOne() ||
      UiSelector().textContains('下一步').isVisibleToUser(true).findOne();
    if (done) {
      let btnText = '';
      try {
        btnText = String(done.text() || '');
      } catch (eBtn) {}
      Log.log('选图：点击「' + btnText + '」');
      this.clickNode(done);
      System.sleep(1200 + 500 * Math.random());
    }
    return true;
  }
};
