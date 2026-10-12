let params = require('../../common/params.js');

Page({
  data: {
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
    keywords: '',
    excludeKeywords: '',
    _ready: false
  },

  apply(p) {
    this.setData({
      enableLike: p.enableLike,
      enableComment: p.enableComment,
      enableDm: p.enableDm,
      likeRate: p.likeRate,
      commentRate: p.commentRate,
      dmRate: p.dmRate,
      intervalSec: p.intervalSec,
      likeMax: p.likeMax,
      commentMax: p.commentMax,
      dmMax: p.dmMax,
      keywords: p.keywords,
      excludeKeywords: p.excludeKeywords
    });
  },

  snapshot(extra) {
    // 不要写 this.data || {}：空对象会冲掉 data 字段类型，导致 enableLike 等被划线
    let d = this.data;
    let src = extra ? extra : {};
    return {
      enableLike: src.enableLike != null ? src.enableLike === true : d.enableLike === true,
      enableComment: src.enableComment != null ? src.enableComment === true : d.enableComment === true,
      enableDm: src.enableDm != null ? src.enableDm === true : d.enableDm === true,
      likeRate: src.likeRate != null ? src.likeRate : d.likeRate,
      commentRate: src.commentRate != null ? src.commentRate : d.commentRate,
      dmRate: src.dmRate != null ? src.dmRate : d.dmRate,
      intervalSec: src.intervalSec != null ? src.intervalSec : d.intervalSec,
      likeMax: src.likeMax != null ? src.likeMax : d.likeMax,
      commentMax: src.commentMax != null ? src.commentMax : d.commentMax,
      dmMax: src.dmMax != null ? src.dmMax : d.dmMax,
      keywords: src.keywords != null ? src.keywords : d.keywords,
      excludeKeywords: src.excludeKeywords != null ? src.excludeKeywords : d.excludeKeywords
    };
  },

  persist(extra) {
    if (!this.data._ready) {
      return;
    }
    params.save(this.snapshot(extra));
  },

  onLoad() {
    this.apply(params.load());
    this.setData({ _ready: true });
  },

  onShow() {
    this.apply(params.load());
    this.setData({ _ready: true });
  },

  onHide() {
    this.persist();
  },

  onAutoSave(e) {
    let extra = {};
    if (e && e.name) {
      extra[e.name] = e.value;
      let patch = {};
      patch[e.name] = e.value;
      this.setData(patch);
    }
    this.persist(extra);
  }
});
