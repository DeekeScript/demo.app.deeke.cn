let scripts = require('../../common/scripts.js');

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
    filterCommentColor: '#556'
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
    this.refresh();
  },

  onShow() {
    this.refresh();
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


