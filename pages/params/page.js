let params = require('../../common/params.js');

let FIELDS = [
  'videoSort',
  'videoTime',
  'videoMinute',
  'videoRandom',
  'searchTitle',
  'commentKeyword',
  'zanCommentRate',
  'replyCommentRate',
  'privateRate',
  'focusRate',
  'firstCommentRate',
  'intervalSec'
];

let FILTERS = [
  {
    field: 'videoSort',
    bind: 'sortOpts',
    options: [
      { label: '综合排序', value: '0' },
      { label: '最新发布', value: '1' },
      { label: '最多点赞', value: '2' }
    ]
  },
  {
    field: 'videoTime',
    bind: 'timeOpts',
    options: [
      { label: '不限', value: '0' },
      { label: '一天内', value: '1' },
      { label: '一周内', value: '2' },
      { label: '半年内', value: '3' }
    ]
  },
  {
    field: 'videoMinute',
    bind: 'minuteOpts',
    options: [
      { label: '不限', value: '0' },
      { label: '1分钟以下', value: '1' },
      { label: '1-5分钟', value: '2' },
      { label: '5分钟以上', value: '3' }
    ]
  },
  {
    field: 'videoRandom',
    bind: 'randomOpts',
    options: [
      { label: '不限', value: '0' },
      { label: '关注的人', value: '1' },
      { label: '最近看过', value: '2' },
      { label: '还未看过', value: '3' }
    ]
  }
];

Page({
  data: {
    videoSort: '0',
    videoTime: '0',
    videoMinute: '0',
    videoRandom: '0',
    searchTitle: '',
    commentKeyword: '',
    zanCommentRate: 0,
    replyCommentRate: 0,
    privateRate: 0,
    focusRate: 0,
    firstCommentRate: 0,
    intervalSec: 5,
    sortOpts: [],
    timeOpts: [],
    minuteOpts: [],
    randomOpts: [],
    _ready: false
  },

  chipList(options, field, selected) {
    let list = [];
    let sel = String(selected == null ? '0' : selected);
    for (let i = 0; i < options.length; i++) {
      let on = options[i].value === sel;
      list.push({
        field: field,
        value: options[i].value,
        label: options[i].label,
        bg: on ? '#0B6E6A' : '#FFFFFF',
        border: '#0B6E6A',
        color: on ? '#FFFFFF' : '#334443'
      });
    }
    return list;
  },

  viewOf(p) {
    let view = {
      videoSort: String(p.videoSort),
      videoTime: String(p.videoTime),
      videoMinute: String(p.videoMinute),
      videoRandom: String(p.videoRandom),
      searchTitle: p.searchTitle,
      commentKeyword: p.commentKeyword,
      zanCommentRate: p.zanCommentRate,
      replyCommentRate: p.replyCommentRate,
      privateRate: p.privateRate,
      focusRate: p.focusRate,
      firstCommentRate: p.firstCommentRate,
      intervalSec: p.intervalSec
    };
    for (let i = 0; i < FILTERS.length; i++) {
      let f = FILTERS[i];
      view[f.bind] = this.chipList(f.options, f.field, view[f.field]);
    }
    return view;
  },

  apply(p) {
    this.setData(this.viewOf(p));
  },

  snapshot(extra) {
    let d = this.data;
    let src = extra ? extra : {};
    let out = {};
    for (let i = 0; i < FIELDS.length; i++) {
      let k = FIELDS[i];
      out[k] = src[k] != null ? src[k] : d[k];
    }
    return out;
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

  onPickFilter(e) {
    let item = e && e.item ? e.item : null;
    if (!item || !item.field) {
      return;
    }
    let extra = {};
    extra[item.field] = item.value;
    this.setData(this.viewOf(this.snapshot(extra)));
    this.persist(extra);
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
