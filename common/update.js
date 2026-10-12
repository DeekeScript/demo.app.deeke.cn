let api = require('./api.js');
let config = require('./config.js');

module.exports = {
  lastCheckKey: config.storagePrefix + 'update.lastCheckAt',
  skipKey: config.storagePrefix + 'update.skipVersionCode',
  skipDayKey: config.storagePrefix + 'update.skipDay',

  currentVersionCode() {
    try {
      let v = App.currentVersionCode();
      if (v != null && v !== '') {
        return parseInt(v, 10) || 0;
      }
    } catch (e) {}
    return parseInt(config.versionCode, 10) || 100;
  },

  currentVersionName() {
    try {
      let n = App.currentVersionName();
      if (n) {
        return String(n);
      }
    } catch (e) {}
    return config.versionName || '1.0.0';
  },

  formatSize(bytes) {
    let n = parseInt(bytes, 10) || 0;
    if (n <= 0) {
      return '';
    }
    if (n < 1024) {
      return n + ' B';
    }
    if (n < 1024 * 1024) {
      return (n / 1024).toFixed(1) + ' KB';
    }
    return (n / (1024 * 1024)).toFixed(1) + ' MB';
  },

  buildChangelog(data) {
    let lines = [];
    let list = (data && data.changelogs) || [];
    for (let i = 0; i < list.length; i++) {
      let c = list[i];
      if (!c) {
        continue;
      }
      let title = (c.version || '') + (c.forceUpdate ? '（强制）' : '');
      let text = c.changelog || '';
      lines.push(title ? title + '：' + text : text);
    }
    if (!lines.length && data && data.latest && data.latest.changelog) {
      lines.push(data.latest.changelog);
    }
    return lines.length ? lines.join('\n') : '修复问题并优化体验';
  },

  today() {
    let d = new Date();
    let m = d.getMonth() + 1;
    let day = d.getDate();
    return d.getFullYear() + '-' + (m < 10 ? '0' + m : m) + '-' + (day < 10 ? '0' + day : day);
  },

  shouldAutoCheck() {
    let last = Storage.get(this.lastCheckKey);
    if (!last) {
      return true;
    }
    let t = parseInt(last, 10) || 0;
    return Date.now() - t > 24 * 60 * 60 * 1000;
  },

  markChecked() {
    Storage.put(this.lastCheckKey, String(Date.now()));
  },

  skipToday(versionCode) {
    Storage.put(this.skipKey, String(versionCode || ''));
    Storage.put(this.skipDayKey, this.today());
  },

  isSkipped(versionCode) {
    let day = Storage.get(this.skipDayKey);
    let code = Storage.get(this.skipKey);
    return day === this.today() && String(code) === String(versionCode || '');
  },

  check(force) {
    let versionCode = this.currentVersionCode();
    let res = api.checkUpdate(versionCode);
    if (!res.ok) {
      return { ok: false, message: res.message || '检查更新失败' };
    }
    this.markChecked();
    let data = res.data || {};
    let latest = data.latest || null;
    let hasUpdate = !!data.hasUpdate && !!latest;
    if (hasUpdate && !force && !data.forceUpdate && this.isSkipped(latest.versionCode)) {
      return {
        ok: true,
        hasUpdate: false,
        ignored: true,
        data: data,
        message: '今日已忽略该版本'
      };
    }
    return {
      ok: true,
      hasUpdate: hasUpdate,
      forceUpdate: !!data.forceUpdate,
      data: data,
      latest: latest,
      changelog: this.buildChangelog(data),
      sizeText: latest ? this.formatSize(latest.size) : '',
      localVersion: this.currentVersionName() + ' (' + versionCode + ')',
      message: hasUpdate ? '发现新版本' : '已是最新版本'
    };
  },

  apkPath(versionCode) {
    let root = '';
    try {
      root = Files.getExternalFilesPath('update');
    } catch (e) {
      root = '';
    }
    if (!root) {
      root = Files.getCachePath();
    }
    Files.mkdirs(root);
    return root + '/update_' + versionCode + '.apk';
  },

  download(latest) {
    if (!latest || !latest.downloadUrl) {
      return { ok: false, message: '没有下载地址' };
    }
    let path = this.apkPath(latest.versionCode || 'latest');
    if (Files.exists(path) && Files.size(path) > 1024) {
      return { ok: true, path: path, reused: true, message: '已有安装包，可直接安装' };
    }
    let saved = Http.download(latest.downloadUrl, path, api.headers());
    let finalPath = saved || path;
    if (!Files.exists(finalPath) || Files.size(finalPath) <= 0) {
      return { ok: false, message: '下载失败', downloadUrl: latest.downloadUrl };
    }
    return { ok: true, path: finalPath, reused: false, message: '下载完成' };
  },

  install(path, downloadUrl) {
    if (path) {
      try {
        if (typeof DevicePolicy !== 'undefined' && DevicePolicy.isDeviceOwner && DevicePolicy.isDeviceOwner()) {
          let ok = DeviceApp.installPackage(path);
          if (ok) {
            return { ok: true, mode: 'silent', message: '已开始静默安装' };
          }
        }
      } catch (e) {}
      try {
        App.openUrl('file://' + path);
        return { ok: true, mode: 'file', message: '已调起系统安装，请按提示完成' };
      } catch (e2) {}
    }
    if (downloadUrl) {
      App.openUrl(downloadUrl);
      return { ok: true, mode: 'url', message: '已打开下载链接，请下载后安装' };
    }
    return { ok: false, message: '无法安装，请稍后重试' };
  },

  downloadAndInstall(latest) {
    let dl = this.download(latest);
    if (!dl.ok) {
      if (latest && latest.downloadUrl) {
        App.openUrl(latest.downloadUrl);
        return { ok: true, message: '下载失败，已改用浏览器打开安装包链接' };
      }
      return dl;
    }
    let ins = this.install(dl.path, latest.downloadUrl);
    if (!ins.ok) {
      return ins;
    }
    return {
      ok: true,
      path: dl.path,
      message: (dl.reused ? '复用本地包，' : '') + ins.message
    };
  }
};
