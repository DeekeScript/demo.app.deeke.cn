let config = require('./config.js');

module.exports = {
  listKey: config.storagePrefix + 'scripts.list.v3',
  legacyListKeyV2: config.storagePrefix + 'scripts.list.v2',
  legacyListKey: config.storagePrefix + 'scripts.list',
  dmListKey: config.storagePrefix + 'scripts.dmList',
  commentListKey: config.storagePrefix + 'scripts.commentList',

  defaults() {
    return [
      { content: '你好，刚刷到你的笔记，很有共鸣', image: '', type: 'dm', enabled: true },
      { content: '方便加个好友交流一下吗？', image: '', type: 'dm', enabled: true },
      { content: '看你做得挺专业，想请教几个细节', image: '', type: 'dm', enabled: true },
      { content: '这篇对我帮助很大，方便聊聊经验吗？', image: '', type: 'dm', enabled: true },
      { content: '你好，我对这类内容很感兴趣，想认识一下', image: '', type: 'dm', enabled: true },
      { content: '如果方便的话，后续想多交流学习', image: '', type: 'dm', enabled: true },
      { content: '学到了，感谢分享', image: '', type: 'comment', enabled: true },
      { content: '写得很清楚，支持一下', image: '', type: 'comment', enabled: true },
      { content: '这个角度很新颖，收藏了', image: '', type: 'comment', enabled: true },
      { content: '干货满满，期待更多更新', image: '', type: 'comment', enabled: true },
      { content: '讲得很实用，马上试试', image: '', type: 'comment', enabled: true },
      { content: '内容质量很高，已关注', image: '', type: 'comment', enabled: true }
    ];
  },

  normalizeItem(item) {
    if (!item) {
      return null;
    }
    let type = item.type === 'comment' ? 'comment' : 'dm';
    let content = String(item.content || '').trim();
    let image = String(item.image || item.imagePath || '').trim();
    if (Array.isArray(item.photos) && item.photos.length) {
      image = String(item.photos[0] || '').trim() || image;
    }
    if (!content && !image) {
      return null;
    }
    let hasImage = !!image;
    return {
      content: content,
      image: image,
      hasImage: hasImage,
      showImage: hasImage,
      showPlaceholder: !hasImage,
      type: type,
      typeLabel: type === 'comment' ? '评论' : '私信',
      typeBg: type === 'comment' ? '#FFF0F3' : '#FFE8EC',
      typeColor: type === 'comment' ? '#C71C37' : '#FF2442',
      enabled: item.enabled === true,
      previewText: content || '（仅图片）'
    };
  },

  migrateFromLegacy() {
    let list = [];
    let dmList = Storage.getObj(this.dmListKey) || [];
    let commentList = Storage.getObj(this.commentListKey) || [];
    for (let i = 0; i < dmList.length; i++) {
      let n = this.normalizeItem({
        content: dmList[i].content,
        image: dmList[i].image || '',
        type: 'dm',
        enabled: dmList[i].enabled !== false
      });
      if (n) {
        list.push(n);
      }
    }
    for (let j = 0; j < commentList.length; j++) {
      let n2 = this.normalizeItem({
        content: commentList[j].content,
        image: commentList[j].image || '',
        type: 'comment',
        enabled: commentList[j].enabled !== false
      });
      if (n2) {
        list.push(n2);
      }
    }
    return list;
  },

  load() {
    let raw = Storage.getObj(this.listKey);
    if (!raw || !raw.length) {
      raw = Storage.getObj(this.legacyListKeyV2) || Storage.getObj(this.legacyListKey) || [];
      if (!raw.length) {
        raw = this.migrateFromLegacy();
      }
      if (!raw.length || raw.length < 10) {
        raw = this.defaults();
      }
      this.save(raw);
    }
    let list = [];
    for (let i = 0; i < raw.length; i++) {
      let n = this.normalizeItem(raw[i]);
      if (n) {
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
      if (n) {
        out.push({
          content: n.content,
          image: n.image,
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
      if (list[i].enabled && list[i].type === type && (list[i].content || list[i].image)) {
        out.push({
          content: list[i].content,
          image: list[i].image
        });
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
      let dm = conf.dmSmart ? '智能私信' : '固定私信';
      return smart.ready() ? 'AI智能话术 · 评论智能 · ' + dm : 'AI智能话术 · 待配置 Key';
    }
    let c = this.counts();
    return '自定义话术 · 共 ' + c.total + ' 条 · 私信 ' + c.dmOn + '/' + c.dm + ' · 评论 ' + c.commentOn + '/' + c.comment;
  }
};
