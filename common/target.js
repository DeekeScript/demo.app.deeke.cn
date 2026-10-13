let api = require('./api.js');
let config = require('./config.js');

let cacheKey = config.storagePrefix + 'targetApp';
let cacheAtKey = config.storagePrefix + 'targetAppAt';
let cacheTtlMs = 5 * 60 * 1000;

function externalUrl(url) {
  let u = String(url || '').trim();
  if (!u) {
    return '';
  }
  if (/^https?:\/\//i.test(u)) {
    return u;
  }
  return '';
}

function readCache() {
  try {
    let raw = Storage.get(cacheKey);
    if (!raw) {
      return null;
    }
    return JSON.parse(String(raw));
  } catch (e) {
    return null;
  }
}

function writeCache(target) {
  try {
    if (target) {
      Storage.put(cacheKey, JSON.stringify(target));
      Storage.put(cacheAtKey, String(Date.now()));
    } else {
      Storage.put(cacheKey, '');
      Storage.put(cacheAtKey, String(Date.now()));
    }
  } catch (e) {}
}

function cacheFresh() {
  try {
    let at = parseInt(Storage.get(cacheAtKey) || '0', 10) || 0;
    return at > 0 && Date.now() - at < cacheTtlMs;
  } catch (e) {
    return false;
  }
}

function normalize(raw) {
  if (!raw || !raw.name) {
    return null;
  }
  let versions = [];
  let list = raw.versions || [];
  for (let i = 0; i < list.length; i++) {
    let v = list[i] || {};
    if (!v.version) {
      continue;
    }
    versions.push({
      version: String(v.version),
      note: v.note ? String(v.note) : '',
      isRecommended: !!v.isRecommended,
      downloadUrl: externalUrl(v.downloadUrl),
      downloadSource: v.downloadSource ? String(v.downloadSource) : ''
    });
  }
  return {
    name: String(raw.name),
    package: raw.package ? String(raw.package) : '',
    compat: raw.compat === 'specific' ? 'specific' : 'all',
    note: raw.note ? String(raw.note) : '',
    downloadUrl: externalUrl(raw.downloadUrl),
    versions: versions
  };
}

function localInfo(pkg) {
  let packageName = String(pkg || '').trim();
  if (!packageName) {
    return { installed: false, versionName: '', versionCode: 0 };
  }
  let installed = false;
  let versionName = '';
  let versionCode = 0;
  try {
    installed = !!App.isAppInstalled(packageName);
  } catch (e) {
    installed = false;
  }
  if (installed) {
    try {
      versionName = String(App.getAppVersionName(packageName) || '');
    } catch (e2) {}
    try {
      versionCode = parseInt(App.getAppVersionCode(packageName), 10) || 0;
    } catch (e3) {}
  }
  return { installed: installed, versionName: versionName, versionCode: versionCode };
}

function versionMatched(localVersion, supported) {
  let local = String(localVersion || '').trim();
  if (!local || !supported || !supported.length) {
    return false;
  }
  for (let i = 0; i < supported.length; i++) {
    let v = String(supported[i].version || '').trim();
    if (!v) {
      continue;
    }
    if (local === v) {
      return true;
    }
    // 后台常写短版本号，本机可能更长
    if (local.indexOf(v) === 0 || v.indexOf(local) === 0) {
      return true;
    }
  }
  return false;
}

function recommended(target) {
  if (!target || !target.versions || !target.versions.length) {
    return null;
  }
  for (let i = 0; i < target.versions.length; i++) {
    if (target.versions[i].isRecommended) {
      return target.versions[i];
    }
  }
  return target.versions[0];
}

function evaluate(target) {
  if (!target) {
    return {
      ok: true,
      hasTarget: false,
      installed: false,
      versionOk: true,
      localVersion: '',
      summary: '',
      detail: '',
      tag: '',
      tagBg: '#EEF2F1',
      tagColor: '#667',
      needAction: false,
      message: ''
    };
  }
  let local = localInfo(target.package);
  let rec = recommended(target);
  let compatLabel = target.compat === 'specific' ? '仅支持指定版本' : '全版本支持';
  let summary = target.name + (rec ? (' · 推荐 ' + rec.version) : (' · ' + compatLabel));
  if (!target.package) {
    return {
      ok: true,
      hasTarget: true,
      installed: false,
      versionOk: true,
      localVersion: '',
      summary: summary,
      detail: '请按下方列表安装适配版本（后台未配置包名，无法检测本机）',
      tag: compatLabel,
      tagBg: '#E8F6F4',
      tagColor: '#0B6E6A',
      needAction: false,
      message: ''
    };
  }
  if (!local.installed) {
    return {
      ok: false,
      hasTarget: true,
      installed: false,
      versionOk: false,
      localVersion: '',
      summary: summary,
      detail: '本机未安装 ' + target.name + '，请先下载适配版本',
      tag: '未安装',
      tagBg: '#FFF1E8',
      tagColor: '#C65A12',
      needAction: true,
      message: '运行前请先安装 ' + target.name
    };
  }
  if (target.compat === 'specific' && target.versions.length > 0) {
    let matched = versionMatched(local.versionName, target.versions);
    if (!matched) {
      let tip = '本机 ' + target.name + ' ' + (local.versionName || '未知版本') + ' 不在支持列表';
      return {
        ok: false,
        hasTarget: true,
        installed: true,
        versionOk: false,
        localVersion: local.versionName,
        summary: summary,
        detail: tip + '，建议更换为推荐版本',
        tag: '版本不符',
        tagBg: '#FFF6E8',
        tagColor: '#A35B00',
        needAction: true,
        message: tip
      };
    }
  }
  return {
    ok: true,
    hasTarget: true,
    installed: true,
    versionOk: true,
    localVersion: local.versionName,
    summary: summary,
    detail: '本机已安装 ' + target.name + (local.versionName ? (' ' + local.versionName) : '') + ' · ' + compatLabel,
    tag: '已就绪',
    tagBg: '#E8F6F4',
    tagColor: '#0B6E6A',
    needAction: false,
    message: ''
  };
}

module.exports = {
  externalUrl: externalUrl,

  load(force) {
    if (!force && cacheFresh()) {
      let cached = readCache();
      // 空串缓存表示已知无 targetApp
      if (cached === null) {
        let raw = Storage.get(cacheKey);
        if (raw === '') {
          return { ok: true, target: null, fromCache: true };
        }
      } else {
        return { ok: true, target: cached, fromCache: true };
      }
    }
    let res = api.toolDetail();
    if (!res.ok) {
      let fallback = readCache();
      return {
        ok: false,
        target: fallback,
        message: res.message || '加载适配信息失败',
        fromCache: !!fallback
      };
    }
    let target = normalize((res.data && res.data.targetApp) || null);
    writeCache(target);
    return { ok: true, target: target, fromCache: false };
  },

  evaluate: evaluate,

  recommended: recommended,

  openDownload(url) {
    let u = externalUrl(url);
    if (!u) {
      return { ok: false, message: '没有可用下载链接' };
    }
    try {
      App.openUrl(u);
      return { ok: true };
    } catch (e) {
      return { ok: false, message: (e && e.message) || '打开链接失败' };
    }
  },

  /** 运行前检测：无目标 App 配置则放行 */
  ensureReady() {
    let loaded = this.load(false);
    let target = loaded.target;
    if (!target) {
      return { ok: true, hasTarget: false };
    }
    let st = evaluate(target);
    return {
      ok: st.ok,
      hasTarget: true,
      needAction: st.needAction,
      message: st.message || st.detail,
      target: target,
      status: st
    };
  },

  homeCard() {
    let loaded = this.load(false);
    let target = loaded.target;
    if (!target) {
      return { show: false };
    }
    let st = evaluate(target);
    return {
      show: true,
      title: '适配 ' + target.name,
      summary: st.summary,
      detail: st.detail,
      tag: st.tag,
      tagBg: st.tagBg,
      tagColor: st.tagColor,
      needAction: st.needAction
    };
  }
};
