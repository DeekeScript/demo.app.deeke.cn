let config = require('./config.js');

module.exports = {
  key: config.storagePrefix + 'params',
  configuredKey: config.storagePrefix + 'params.configured',

  hasConfigured() {
    if (Storage.getBoolean(this.configuredKey) !== true) {
      return false;
    }
    let p = this.load();
    return !!(String(p.searchTitle || '').trim() && String(p.commentKeyword || '').trim());
  },

  markConfigured() {
    Storage.putBoolean(this.configuredKey, true);
  },

  defaults() {
    return {
      videoSort: 0,
      videoTime: 0,
      videoMinute: 0,
      videoRandom: 0,
      searchTitle: '',
      commentKeyword: '',
      zanCommentRate: 0,
      replyCommentRate: 0,
      privateRate: 0,
      focusRate: 0,
      firstCommentRate: 0,
      intervalSec: 5
    };
  },

  load() {
    let d = this.defaults();
    let saved = Storage.getObj(this.key);
    if (!saved) {
      return d;
    }
    return {
      videoSort: this.num(saved.videoSort, d.videoSort),
      videoTime: this.num(saved.videoTime, d.videoTime),
      videoMinute: this.num(saved.videoMinute, d.videoMinute),
      videoRandom: this.num(saved.videoRandom, d.videoRandom),
      searchTitle: saved.searchTitle != null ? String(saved.searchTitle) : d.searchTitle,
      commentKeyword: saved.commentKeyword != null ? String(saved.commentKeyword) : d.commentKeyword,
      zanCommentRate: this.num(saved.zanCommentRate, d.zanCommentRate),
      replyCommentRate: this.num(saved.replyCommentRate, d.replyCommentRate),
      privateRate: this.num(saved.privateRate, d.privateRate),
      focusRate: this.num(saved.focusRate, d.focusRate),
      firstCommentRate: this.num(saved.firstCommentRate, d.firstCommentRate),
      intervalSec: this.num(saved.intervalSec, d.intervalSec)
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
      videoSort: this.num(src.videoSort, d.videoSort),
      videoTime: this.num(src.videoTime, d.videoTime),
      videoMinute: this.num(src.videoMinute, d.videoMinute),
      videoRandom: this.num(src.videoRandom, d.videoRandom),
      searchTitle: String(src.searchTitle != null ? src.searchTitle : ''),
      commentKeyword: String(src.commentKeyword != null ? src.commentKeyword : ''),
      zanCommentRate: this.num(src.zanCommentRate, d.zanCommentRate),
      replyCommentRate: this.num(src.replyCommentRate, d.replyCommentRate),
      privateRate: this.num(src.privateRate, d.privateRate),
      focusRate: this.num(src.focusRate, d.focusRate),
      firstCommentRate: this.num(src.firstCommentRate, d.firstCommentRate),
      intervalSec: this.num(src.intervalSec, d.intervalSec)
    });
    this.markConfigured();
  },

  filterConfig() {
    let p = this.load();
    return {
      sort: p.videoSort,
      time: p.videoTime,
      minute: p.videoMinute,
      random: p.videoRandom
    };
  },

  summary() {
    let p = this.load();
    let title = String(p.searchTitle || '').trim() || '未填搜索词';
    return title + ' · 间隔' + p.intervalSec + 's';
  }
};
