let params = require('../../common/params.js');

let FIELDS = [
  'noteSort',
  'noteType',
  'noteTime',
  'noteRange',
  'noteDistance',
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
    field: 'noteSort',
    bind: 'sortOpts',
    options: [
      { label: '综合', value: '0' },
      { label: '最新', value: '1' },
      { label: '最多点赞', value: '2' },
      { label: '最多评论', value: '3' },
      { label: '最多收藏', value: '4' }
    ]
  },
  {
    field: 'noteType',
    bind: 'typeOpts',
    options: [
      { label: '不限', value: '0' },
      { label: '视频', value: '1' },
      { label: '图文', value: '2' }
    ]
  },
  {
    field: 'noteTime',
    bind: 'timeOpts',
    options: [
      { label: '不限', value: '0' },
      { label: '一天内', value: '1' },
      { label: '一周内', value: '2' },
      { label: '半年内', value: '3' }
    ]
  },
  {
    field: 'noteRange',
    bind: 'rangeOpts',
    options: [
      { label: '不限', value: '0' },
      { label: '已看过', value: '1' },
      { label: '未看过', value: '2' },
      { label: '已关注', value: '3' }
    ]
  },
  {
    field: 'noteDistance',
    bind: 'distanceOpts',
    options: [
      { label: '不限', value: '0' },
      { label: '同城', value: '1' },
      { label: '附近', value: '2' }
    ]
  }
];

Page({
  data: {
    noteSort: '0',
    noteType: '0',
    noteTime: '0',
    noteRange: '0',
    noteDistance: '0',
    searchTitle: '',
    commentKeyword: '',
    zanCommentRate: 0,
    replyCommentRate: 0,
    privateRate: 0,
    focusRate: 0,
    firstCommentRate: 0,
    intervalSec: 5,
    sortOpts: [],
    typeOpts: [],
    timeOpts: [],
    rangeOpts: [],
    distanceOpts: [],
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
        bg: on ? '#FF2442' : '#FFFFFF',
        border: '#FF2442',
        color: on ? '#FFFFFF' : '#553333'
      });
    }
    return list;
  },

  viewOf(p) {
    let view = {
      noteSort: String(p.noteSort),
      noteType: String(p.noteType),
      noteTime: String(p.noteTime),
      noteRange: String(p.noteRange),
      noteDistance: String(p.noteDistance),
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
