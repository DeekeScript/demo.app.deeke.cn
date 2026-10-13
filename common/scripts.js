let config = require('./config.js');

module.exports = {
  listKey: config.storagePrefix + 'scripts.list.v2',
  // 兼容旧版双列表 / 旧单列表
  legacyListKey: config.storagePrefix + 'scripts.list',
  dmListKey: config.storagePrefix + 'scripts.dmList',
  commentListKey: config.storagePrefix + 'scripts.commentList',

  defaults() {
    return [
      { content: '你好，刚刷到你的内容，很有共鸣', type: 'dm', enabled: true },
      { content: '方便加个好友交流一下吗？', type: 'dm', enabled: true },
      { content: '看你做得挺专业，想请教几个细节', type: 'dm', enabled: true },
      { content: '这篇对我帮助很大，方便聊聊经验吗？', type: 'dm', enabled: true },
      { content: '你好，我对这类内容很感兴趣，想认识一下', type: 'dm', enabled: true },
      { content: '如果方便的话，后续想多交流学习', type: 'dm', enabled: true },
      { content: '学到了，感谢分享', type: 'comment', enabled: true },
      { content: '写得很清楚，支持一下', type: 'comment', enabled: true },
      { content: '这个角度很新颖，收藏了', type: 'comment', enabled: true },
      { content: '干货满满，期待更多更新', type: 'comment', enabled: true },
      { content: '讲得很实用，马上试试', type: 'comment', enabled: true },
      { content: '内容质量很高，已关注', type: 'comment', enabled: true }
    ];
  },

  normalizeItem(item) {
    if (!item) {
      return null;
    }
    let type = item.type === 'comment' ? 'comment' : 'dm';
    return {
      content: String(item.content || '').trim(),
      type: type,
      typeLabel: type === 'comment' ? '评论' : '私信',
      typeBg: type === 'comment' ? '#EEF2FF' : '#E8F6F4',
      typeColor: type === 'comment' ? '#3D5AFE' : '#0B6E6A',
      enabled: item.enabled === true
    };
  },

  migrateFromLegacy() {
    let list = [];
    let dmList = Storage.getObj(this.dmListKey) || [];
    let commentList = Storage.getObj(this.commentListKey) || [];
    for (let i = 0; i < dmList.length; i++) {
      let n = this.normalizeItem({
        content: dmList[i].content,
        type: 'dm',
        enabled: dmList[i].enabled !== false
      });
      if (n && n.content) {
        list.push(n);
      }
    }
    for (let j = 0; j < commentList.length; j++) {
      let n2 = this.normalizeItem({
        content: commentList[j].content,
        type: 'comment',
        enabled: commentList[j].enabled !== false
      });
      if (n2 && n2.content) {
        list.push(n2);
      }
    }
    return list;
  },

  load() {
    let raw = Storage.getObj(this.listKey);
    if (!raw || !raw.length) {
      raw = Storage.getObj(this.legacyListKey) || [];
      if (!raw.length) {
        raw = this.migrateFromLegacy();
      }
      // 旧默认只有 4 条，升级为更完整的默认库
      if (!raw.length || raw.length < 10) {
        raw = this.defaults();
      }
      this.save(raw);
    }
    let list = [];
    for (let i = 0; i < raw.length; i++) {
      let n = this.normalizeItem(raw[i]);
      if (n && n.content) {
        list.push(n);
      }
    }
    return list;
  },

  save(list) {
    let out = [];
    let arr = list || [];
    for (let i = 0; i < arr.length; i++) {
      let n = this.normalizeItem(arr[i]);
      if (n && n.content) {
        out.push({
          content: n.content,
          type: n.type,
          enabled: n.enabled
        });
      }
    }
    Storage.putObj(this.listKey, out);
  },

  filter(list, filterType) {
    let arr = list || [];
    if (!filterType || filterType === 'all') {
      return arr;
    }
    let out = [];
    for (let i = 0; i < arr.length; i++) {
      if (arr[i].type === filterType) {
        out.push(arr[i]);
      }
    }
    return out;
  },

  enabledByType(type) {
    let list = this.load();
    let out = [];
    for (let i = 0; i < list.length; i++) {
      if (list[i].enabled && list[i].type === type && list[i].content) {
        out.push(list[i].content);
      }
    }
    return out;
  },

  counts(list) {
    let arr = list || this.load();
    let dm = 0;
    let comment = 0;
    let dmOn = 0;
    let commentOn = 0;
    for (let i = 0; i < arr.length; i++) {
      if (arr[i].type === 'comment') {
        comment++;
        if (arr[i].enabled) {
          commentOn++;
        }
      } else {
        dm++;
        if (arr[i].enabled) {
          dmOn++;
        }
      }
    }
    return { total: arr.length, dm: dm, comment: comment, dmOn: dmOn, commentOn: commentOn };
  },

  summary() {
    let smart = require('./smartScripts.js');
    let conf = smart.load();
    if (conf.mode === 'smart') {
      let dm = conf.dmSmart ? '智能私信' : '平台私信';
      return smart.ready() ? 'AI智能话术 · 评论智能 · ' + dm : 'AI智能话术 · 待配置 Key';
    }
    let c = this.counts();
    return '自定义话术 · 共 ' + c.total + ' 条 · 私信 ' + c.dmOn + '/' + c.dm + ' · 评论 ' + c.commentOn + '/' + c.comment;
  }
};
