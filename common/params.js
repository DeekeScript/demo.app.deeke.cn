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
      noteSort: 0,
      // 只能选视频(1)或笔记(2)，默认笔记
      noteType: 2,
      noteTime: 0,
      noteRange: 0,
      noteDistance: 0,
      hidEnabled: false,
      searchTitle: '',
      commentKeyword: '',
      zanCommentRate: 0,
      replyCommentRate: 0,
      privateRate: 0,
      focusRate: 0,
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
      noteSort: this.num(saved.noteSort != null ? saved.noteSort : saved.videoSort, d.noteSort),
      noteType: this.normalizeNoteType(saved.noteType, d.noteType),
      noteTime: this.num(saved.noteTime != null ? saved.noteTime : saved.videoTime, d.noteTime),
      noteRange: this.num(saved.noteRange != null ? saved.noteRange : saved.videoRandom, d.noteRange),
      noteDistance: this.num(saved.noteDistance, d.noteDistance),
      hidEnabled: saved.hidEnabled === true,
      searchTitle: saved.searchTitle != null ? String(saved.searchTitle) : d.searchTitle,
      commentKeyword: saved.commentKeyword != null ? String(saved.commentKeyword) : d.commentKeyword,
      zanCommentRate: this.num(saved.zanCommentRate, d.zanCommentRate),
      replyCommentRate: this.num(saved.replyCommentRate, d.replyCommentRate),
      privateRate: this.num(saved.privateRate, d.privateRate),
      focusRate: this.num(saved.focusRate, d.focusRate),
      intervalSec: this.normalizeIntervalSec(saved.intervalSec, d.intervalSec)
    };
  },

  num(v, fallback) {
    let n = parseInt(v, 10);
    if (isNaN(n)) {
      return fallback;
    }
    return n;
  },

  /** 笔记类型仅允许 1视频 / 2笔记；旧「不限」等一律落到笔记 */
  normalizeNoteType(v, fallback) {
    let n = this.num(v, fallback);
    if (n === 1 || n === 2) {
      return n;
    }
    return 2;
  },

  /** 操作间隔 5~60 秒 */
  normalizeIntervalSec(v, fallback) {
    let n = this.num(v, fallback);
    if (n < 5) return 5;
    if (n > 60) return 60;
    return n;
  },

  save(data) {
    let d = this.defaults();
    let src = data || {};
    Storage.putObj(this.key, {
      noteSort: this.num(src.noteSort, d.noteSort),
      noteType: this.normalizeNoteType(src.noteType, d.noteType),
      noteTime: this.num(src.noteTime, d.noteTime),
      noteRange: this.num(src.noteRange, d.noteRange),
      noteDistance: this.num(src.noteDistance, d.noteDistance),
      hidEnabled: src.hidEnabled === true,
      searchTitle: String(src.searchTitle != null ? src.searchTitle : ''),
      commentKeyword: String(src.commentKeyword != null ? src.commentKeyword : ''),
      zanCommentRate: this.num(src.zanCommentRate, d.zanCommentRate),
      replyCommentRate: this.num(src.replyCommentRate, d.replyCommentRate),
      privateRate: this.num(src.privateRate, d.privateRate),
      focusRate: this.num(src.focusRate, d.focusRate),
      intervalSec: this.normalizeIntervalSec(src.intervalSec, d.intervalSec)
    });
    this.markConfigured();
  },

  filterConfig() {
    let p = this.load();
    return {
      sort: p.noteSort,
      type: this.normalizeNoteType(p.noteType, 2),
      time: p.noteTime,
      range: p.noteRange,
      distance: p.noteDistance
    };
  },

  /** 是否视频模式（否则为笔记/图文模式） */
  isVideoMode() {
    return this.load().noteType === 1;
  },

  summary() {
    let p = this.load();
    let title = String(p.searchTitle || '').trim() || '未填搜索词';
    let typeLabel = p.noteType === 1 ? '视频' : '笔记';
    return title + ' · ' + typeLabel + ' · 间隔' + p.intervalSec + 's';
  }
};
