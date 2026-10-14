let scripts = require('../../common/scripts.js');
let smart = require('../../common/smartScripts.js');

Page({
  data: {
    newType: 'dm',
    newContent: '',
    newEnabled: true,
    filter: 'all',
    rows: [],
    empty: false,
    addOpen: false,
    menuOpenEnabled: false,
    menuOpenDisabled: false,
    menuIndex: -1,
    filterAllBg: '#0B6E6A',
    filterAllColor: '#FFFFFF',
    filterDmBg: '#EEF2F1',
    filterDmColor: '#556',
    filterCommentBg: '#EEF2F1',
    filterCommentColor: '#556',
    mode: 'platform',
    showPlatform: true,
    showSmart: false,
    modePlatformBg: '#FFFFFF',
    modePlatformColor: '#0B6E6A',
    modePlatformSub: '#7A8A88',
    modeSmartBg: '#E4EEEC',
    modeSmartColor: '#667',
    modeSmartSub: '#99A8A6',
    dmSmart: true,
    provider: 'deepseek',
    apiKey: '',
    model: '',
    baseUrl: '',
    industry: 'general',
    industryCustom: '',
    showIndustryCustom: false,
    industryOpts: [],
    sentenceOpts: [],
    toneOpts: [],
    goalOpts: [],
    personOpts: [],
    lengthOpts: [],
    addressOpts: [],
    emojiOpts: [],
    approachOpts: [],
    focusOpts: [],
    sentence: 'statement',
    tone: 'sincere',
    goal: 'interact',
    person: 'fan',
    length: 'one',
    address: 'none',
    emoji: 'none',
    approach: 'soft',
    focus: 'content',
    showCustomUrl: false,
    trialInput: '',
    trialKind: '',
    trialText: '',
    showTrial: false,
    _ready: false
  },

  modeStyle(mode) {
    let smartOn = mode === 'smart';
    return {
      mode: smartOn ? 'smart' : 'platform',
      showPlatform: !smartOn,
      showSmart: smartOn,
      modePlatformBg: smartOn ? '#E4EEEC' : '#FFFFFF',
      modePlatformColor: smartOn ? '#667' : '#0B6E6A',
      modePlatformSub: smartOn ? '#99A8A6' : '#7A8A88',
      modeSmartBg: smartOn ? '#FFFFFF' : '#E4EEEC',
      modeSmartColor: smartOn ? '#0B6E6A' : '#667',
      modeSmartSub: smartOn ? '#7A8A88' : '#99A8A6'
    };
  },

  chipList(field, selected) {
    let list = [];
    let styles = smart.styles || [];
    let fieldDef = null;
    for (let i = 0; i < styles.length; i++) {
      if (styles[i].key === field) {
        fieldDef = styles[i];
        break;
      }
    }
    if (!fieldDef) {
      return list;
    }
    let opts = fieldDef.options || [];
    for (let i = 0; i < opts.length; i++) {
      let on = opts[i].value === selected;
      list.push({
        field: field,
        value: opts[i].value,
        label: opts[i].label,
        bg: on ? '#0B6E6A' : '#FFFFFF',
        border: '#0B6E6A',
        color: on ? '#FFFFFF' : '#334443'
      });
    }
    return list;
  },

  applySmart(conf) {
    let c = conf || smart.load();
    let st = this.modeStyle(c.mode);
    this.setData({
      mode: st.mode,
      showPlatform: st.showPlatform,
      showSmart: st.showSmart,
      modePlatformBg: st.modePlatformBg,
      modePlatformColor: st.modePlatformColor,
      modePlatformSub: st.modePlatformSub,
      modeSmartBg: st.modeSmartBg,
      modeSmartColor: st.modeSmartColor,
      modeSmartSub: st.modeSmartSub,
      dmSmart: c.dmSmart !== false,
      provider: c.provider,
      apiKey: c.apiKey,
      model: c.model,
      baseUrl: c.baseUrl,
      industry: c.industry,
      industryCustom: c.industryCustom,
      showIndustryCustom: c.industry === 'custom',
      industryOpts: this.chipList('industry', c.industry),
      sentenceOpts: this.chipList('sentence', c.sentence),
      toneOpts: this.chipList('tone', c.tone),
      goalOpts: this.chipList('goal', c.goal),
      personOpts: this.chipList('person', c.person),
      lengthOpts: this.chipList('length', c.length),
      addressOpts: this.chipList('address', c.address),
      emojiOpts: this.chipList('emoji', c.emoji),
      approachOpts: this.chipList('approach', c.approach),
      focusOpts: this.chipList('focus', c.focus),
      sentence: c.sentence,
      tone: c.tone,
      goal: c.goal,
      person: c.person,
      length: c.length,
      address: c.address,
      emoji: c.emoji,
      approach: c.approach,
      focus: c.focus,
      showCustomUrl: c.provider === 'custom'
    });
  },

  snapshotSmart(extra) {
    let d = this.data;
    let src = extra || {};
    return {
      mode: src.mode != null ? src.mode : d.mode,
      dmSmart: src.dmSmart != null ? src.dmSmart === true : d.dmSmart === true,
      provider: src.provider != null ? src.provider : d.provider,
      apiKey: src.apiKey != null ? src.apiKey : d.apiKey,
      model: src.model != null ? src.model : d.model,
      baseUrl: src.baseUrl != null ? src.baseUrl : d.baseUrl,
      agent: '',
      industry: src.industry != null ? src.industry : d.industry,
      industryCustom: src.industryCustom != null ? src.industryCustom : d.industryCustom,
      sentence: src.sentence != null ? src.sentence : d.sentence,
      tone: src.tone != null ? src.tone : d.tone,
      goal: src.goal != null ? src.goal : d.goal,
      person: src.person != null ? src.person : d.person,
      length: src.length != null ? src.length : d.length,
      address: src.address != null ? src.address : d.address,
      emoji: src.emoji != null ? src.emoji : d.emoji,
      approach: src.approach != null ? src.approach : d.approach,
      focus: src.focus != null ? src.focus : d.focus
    };
  },

  persistSmart(extra) {
    if (!this.data._ready) {
      return smart.load();
    }
    let next = smart.save(this.snapshotSmart(extra));
    this.applySmart(next);
    return next;
  },

  filterStyle(active) {
    return {
      allBg: active === 'all' ? '#0B6E6A' : '#EEF2F1',
      allColor: active === 'all' ? '#FFFFFF' : '#556',
      dmBg: active === 'dm' ? '#0B6E6A' : '#EEF2F1',
      dmColor: active === 'dm' ? '#FFFFFF' : '#556',
      commentBg: active === 'comment' ? '#0B6E6A' : '#EEF2F1',
      commentColor: active === 'comment' ? '#FFFFFF' : '#556'
    };
  },

  refresh() {
    let all = scripts.load();
    let filter = this.data.filter || 'all';
    let shown = [];
    for (let i = all.length - 1; i >= 0; i--) {
      if (filter !== 'all' && all[i].type !== filter) {
        continue;
      }
      shown.push({
        content: all[i].content,
        type: all[i].type,
        typeLabel: all[i].typeLabel,
        typeBg: all[i].typeBg,
        typeColor: all[i].typeColor,
        enabled: all[i].enabled,
        statusText: all[i].enabled ? '已启用' : '已停用',
        index: i
      });
    }
    let st = this.filterStyle(filter);
    this.setData({
      rows: shown,
      empty: shown.length === 0,
      filterAllBg: st.allBg,
      filterAllColor: st.allColor,
      filterDmBg: st.dmBg,
      filterDmColor: st.dmColor,
      filterCommentBg: st.commentBg,
      filterCommentColor: st.commentColor
    });
  },

  onLoad() {
    this.applySmart(smart.load());
    this.setData({ _ready: true });
    this.refresh();
  },

  onShow() {
    this.applySmart(smart.load());
    this.setData({ _ready: true });
    this.refresh();
  },

  onHide() {
    this.persistSmart();
  },

  onModePlatform() {
    if (this.data.mode === 'platform') {
      return;
    }
    this.persistSmart({ mode: 'platform' });
    this.toast('当前已切换到自定义话术');
  },

  onModeSmart() {
    if (this.data.mode === 'smart') {
      return;
    }
    this.persistSmart({ mode: 'smart' });
    this.toast('当前已切换到AI智能话术');
  },

  onSmartSave(e) {
    let extra = {};
    if (e && e.name) {
      extra[e.name] = e.value;
    }
    this.persistSmart(extra);
  },

  onPickChip(e) {
    let item = e && e.item ? e.item : null;
    if (!item || !item.field) {
      return;
    }
    let extra = {};
    extra[item.field] = item.value;
    this.persistSmart(extra);
  },

  onProviderChange(e) {
    let id = e && e.value != null ? String(e.value) : this.data.provider;
    let spec = smart.providerOf(id);
    let extra = { provider: id };
    if (id !== 'custom' && spec.model) {
      extra.model = spec.model;
    }
    this.persistSmart(extra);
  },

  trial(kind) {
    this.persistSmart();
    if (!smart.ready()) {
      this.toast('请先填写 API Key 和模型');
      return;
    }
    this.showLoading('正在生成…');
    let res = smart.generate(kind, this.data.trialInput);
    this.hideLoading();
    if (!res.ok) {
      this.setData({ showTrial: false });
      this.toast(res.message || '生成失败');
      return;
    }
    this.setData({
      showTrial: true,
      trialKind: kind === 'dm' ? '私信预览' : '评论预览',
      trialText: res.text
    });
  },

  onTrialComment() {
    this.trial('comment');
  },

  onTrialDm() {
    this.trial('dm');
  },

  onFilterAll() {
    this.setData({ filter: 'all' });
    this.refresh();
  },

  onFilterDm() {
    this.setData({ filter: 'dm' });
    this.refresh();
  },

  onFilterComment() {
    this.setData({ filter: 'comment' });
    this.refresh();
  },

  onOpenAdd() {
    if (this.data.mode === 'smart') {
      this.toast('AI智能话术按场景生成，添加固定文案请切回自定义话术');
      return;
    }
    this.setData({
      addOpen: true,
      newType: 'dm',
      newContent: '',
      newEnabled: true
    });
  },

  onCloseAdd() {
    this.setData({ addOpen: false });
  },

  onAdd() {
    let text = (this.data.newContent || '').trim();
    if (!text) {
      this.toast('请输入话术内容');
      return;
    }
    let type = this.data.newType === 'comment' ? 'comment' : 'dm';
    let enabled = this.data.newEnabled !== false;
    let list = scripts.load();
    list.push({ content: text, type: type, enabled: enabled });
    scripts.save(list);
    this.setData({ addOpen: false, newContent: '', newEnabled: true });
    this.refresh();
    this.toast(enabled ? '已添加' : '已添加（停用）');
  },

  resolveIndex(e) {
    let item = e && e.item ? e.item : null;
    if (item && item.index != null) {
      return parseInt(item.index, 10);
    }
    let i = e && e.index != null ? parseInt(e.index, 10) : -1;
    let rows = this.data.rows || [];
    if (!isNaN(i) && i >= 0 && i < rows.length && rows[i] && rows[i].index != null) {
      return parseInt(rows[i].index, 10);
    }
    return -1;
  },

  onMore(e) {
    let idx = this.resolveIndex(e);
    let list = scripts.load();
    if (isNaN(idx) || idx < 0 || idx >= list.length) {
      this.toast('未找到该话术');
      return;
    }
    let enabled = list[idx].enabled === true;
    this.setData({
      menuIndex: idx,
      menuOpenEnabled: enabled,
      menuOpenDisabled: !enabled
    });
  },

  onMenuAction(e) {
    let action = e && e.value != null ? String(e.value) : '';
    let idx = this.data.menuIndex;
    let list = scripts.load();
    this.setData({
      menuOpenEnabled: false,
      menuOpenDisabled: false,
      menuIndex: -1
    });
    if (isNaN(idx) || idx < 0 || idx >= list.length || !action) {
      return;
    }
    if (action === 'enable') {
      list[idx].enabled = true;
      scripts.save(list);
      this.refresh();
      this.toast('已启用');
      return;
    }
    if (action === 'disable') {
      list[idx].enabled = false;
      scripts.save(list);
      this.refresh();
      this.toast('已停用');
      return;
    }
    if (action === 'delete') {
      list.splice(idx, 1);
      scripts.save(list);
      this.refresh();
      this.toast('已删除');
    }
  }
});
