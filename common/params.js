let config = require('./config.js');

module.exports = {
  key: config.storagePrefix + 'params',
  configuredKey: config.storagePrefix + 'params.configured',

  hasConfigured() {
    return Storage.getBoolean(this.configuredKey) === true;
  },

  markConfigured() {
    Storage.putBoolean(this.configuredKey, true);
  },

  defaults() {
    return {
      enableLike: true,
      enableComment: true,
      enableDm: true,
      likeRate: 60,
      commentRate: 30,
      dmRate: 10,
      intervalSec: 3,
      likeMax: 30,
      commentMax: 15,
      dmMax: 5,
      keywords: '涨粉\n互助\n同城',
      excludeKeywords: ''
    };
  },

  load() {
    let d = this.defaults();
    let saved = Storage.getObj(this.key);
    if (!saved) {
      return d;
    }
    return {
      enableLike: saved.enableLike !== false,
      enableComment: saved.enableComment !== false,
      enableDm: saved.enableDm !== false,
      likeRate: this.num(saved.likeRate, d.likeRate),
      commentRate: this.num(saved.commentRate, d.commentRate),
      dmRate: this.num(saved.dmRate, d.dmRate),
      intervalSec: this.num(saved.intervalSec, d.intervalSec),
      likeMax: this.num(saved.likeMax, d.likeMax),
      commentMax: this.num(saved.commentMax, d.commentMax),
      dmMax: this.num(saved.dmMax, d.dmMax),
      keywords: saved.keywords != null ? String(saved.keywords) : d.keywords,
      excludeKeywords: saved.excludeKeywords != null ? String(saved.excludeKeywords) : d.excludeKeywords
    };
  },

  num(v, fallback) {
    let n = parseInt(v, 10);
    if (isNaN(n)) {
      return fallback;
    }
    return n;
  },

  save(data) {
    let d = this.defaults();
    let src = data || {};
    Storage.putObj(this.key, {
      enableLike: src.enableLike === true,
      enableComment: src.enableComment === true,
      enableDm: src.enableDm === true,
      likeRate: this.num(src.likeRate, d.likeRate),
      commentRate: this.num(src.commentRate, d.commentRate),
      dmRate: this.num(src.dmRate, d.dmRate),
      intervalSec: this.num(src.intervalSec, d.intervalSec),
      likeMax: this.num(src.likeMax, d.likeMax),
      commentMax: this.num(src.commentMax, d.commentMax),
      dmMax: this.num(src.dmMax, d.dmMax),
      keywords: String(src.keywords != null ? src.keywords : ''),
      excludeKeywords: String(src.excludeKeywords != null ? src.excludeKeywords : '')
    });
    this.markConfigured();
  },

  lines(text) {
    let out = [];
    let arr = String(text || '').split(/\r?\n/);
    for (let i = 0; i < arr.length; i++) {
      let s = String(arr[i] || '').trim();
      if (s) {
        out.push(s);
      }
    }
    return out;
  },

  summary() {
    let p = this.load();
    let parts = [];
    if (p.enableLike) {
      parts.push('赞' + p.likeRate + '%');
    }
    if (p.enableComment) {
      parts.push('评' + p.commentRate + '%');
    }
    if (p.enableDm) {
      parts.push('信' + p.dmRate + '%');
    }
    let kw = this.lines(p.keywords).length;
    return (parts.length ? parts.join(' · ') : '功能全关') + ' · 词' + kw + '个 · 间隔' + p.intervalSec + 's';
  }
};
