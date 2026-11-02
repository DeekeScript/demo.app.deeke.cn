let permission = require('../common/permission.js');
let activation = require('../common/activation.js');
let scripts = require('../common/scripts.js');
let smart = require('../common/smartScripts.js');
let params = require('../common/params.js');
let logger = require('../common/logger.js');
let machine = require('../common/machine.js');
let statistics = require('../common/statistics.js');
let gallery = require('../common/gallery.js');
let tCommon = require('../app/xhs/Common.js');
let XhsUser = require('../app/xhs/User.js');
let XhsSearch = require('../app/xhs/Search.js');
let XhsWork = require('../app/xhs/Work.js');
let XhsIndex = require('../app/xhs/Index.js');
let XhsComment = require('../app/xhs/Comment.js');

let stopped = false;
let finished = false;
function taskStopped() { return stopped; }

function showRunBar() {
  let d = Device.width() / 360; if (d < 1) d = 1;
  let w = Math.floor(168 * d);
  if (!FloatPage.show('runBar', { x: Math.floor((Device.width() - w) / 2), y: Math.floor(6 * d), width: w, height: Math.floor(28 * d), opacity: 0, background: '#00000000', draggable: false, focusable: false, gestureTouchable: false, inStatusBar: true })) {
    logger.warn('rpa', '运行条打开失败');
    return;
  }
  FloatPage.setData('runBar', { title: '评论获客正在运行...' });
  Events.on('run_stop', function () { stopped = true; });
  Events.on('script_stop', function () { FloatPage.close('runBar'); if (!finished) System.toast('任务已关闭'); });
}

/**
 * 对齐 sampledata 评论截流主流程（task_dy_toker_video / task_xhs_search_inquiry），
 * 额外支持话术配图；笔记类型由参数固定为视频或笔记。
 */
let task = {
  contents: [],

  pickOne(list) {
    if (!list || !list.length) return null;
    return list[Math.floor(Math.random() * list.length)] || null;
  },

  /** 从启用话术里抽一张配图（仅评论） */
  pickCommentImage() {
    let list = scripts.enabledByType('comment') || [];
    let withImg = [];
    for (let i = 0; i < list.length; i++) {
      if (list[i] && list[i].image) {
        withImg.push(list[i].image);
      }
    }
    if (!withImg.length) {
      return '';
    }
    return withImg[Math.floor(Math.random() * withImg.length)] || '';
  },

  // type 0 评论，1 私信；可带 image
  getMsg(type, input) {
    let conf = smart.load();
    let useSmart = conf.mode === 'smart' && smart.ready();
    if (type === 1 && conf.dmSmart === false) useSmart = false;
    if (useSmart) {
      let payload = input;
      if (type === 1) payload = (input && typeof input === 'object') ? input : { comment: '', nickname: '', gender: '未知', age: '' };
      else if (!payload) payload = '小红书笔记评论';
      let gen = smart.generate(type === 1 ? 'dm' : 'comment', payload);
      if (gen.ok && gen.text) {
        // 智能文案也带上自定义评论话术里的配图，否则相册永远不会入库新图
        let image = type === 0 ? this.pickCommentImage() : '';
        logger.info('rpa', '智能话术' + (image ? '（含配图）' : ''));
        return { msg: gen.text, image: image };
      }
    }
    let item = this.pickOne(scripts.enabledByType(type === 1 ? 'dm' : 'comment'));
    return item ? { msg: item.content || '', image: item.image || '' } : false;
  },

  includesKw(str, kw) {
    for (let i in kw) if (str.includes(kw[i])) return true;
    return false;
  },

  workKey(nick, title) {
    let d = new Date();
    let day = '' + d.getFullYear() + ('0' + (d.getMonth() + 1)).slice(-2) + ('0' + d.getDate()).slice(-2);
    return 'note.done.' + day + '.' + Encrypt.md5(String(nick || '') + '_' + String(title || ''));
  },

  /** 永久去重：md5(博主_标题) + md5(评论人_评论内容) */
  commentKey(author, title, commentNick, content) {
    let work = Encrypt.md5(String(author || '') + '_' + String(title || ''));
    let cmt = Encrypt.md5(String(commentNick || '') + '_' + String(content || ''));
    return 'cmt.done.' + work + '.' + cmt;
  },

  noteTitle() {
    try { let c = XhsWork.getContent(); if (c) return String(c).substring(0, 120); } catch (e) { }
    try { return String(XhsWork.getNickname() || ''); } catch (e2) { return ''; }
  },

  authorNick() {
    try { return String(XhsWork.getNickname() || ''); } catch (e) { return ''; }
  },

  swipeNextVideo() {
    // 仅在确认半屏评论打开时收起；不要用系统 back，避免误退回搜索列表
    if (XhsWork.isCommentPanelOpen()) {
      logger.info('rpa', '下一个视频前评论区未关，先收起');
      try {
        XhsWork.closeCommentWindow(true);
      } catch (e) {
        try {
          tCommon.tapAt(Device.width() * 0.5, Device.height() * 0.12);
          tCommon.sleep(800);
        } catch (e2) {}
      }
    }
    let w = Device.width(), h = Device.height();
    // 距离/时长要够：HID 短滑经常不变视频
    tCommon.swipeAt(w * 0.5, h * 0.82, w * 0.5, h * 0.22, 450);
    tCommon.sleep(2500 + 1000 * Math.random());
  },

  backToList() {
    tCommon.back();
    tCommon.sleep(1200);
    for (let i = 0; i < 3; i++) {
      let tab = UiSelector().className('android.widget.TextView').text('全部').isVisibleToUser(true).filter(function (v) {
        return v.parent() && v.parent().className() == 'androidx.appcompat.app.ActionBar$Tab';
      }).findOneBy(800);
      if (tab) return true;
      tCommon.back();
      tCommon.sleep(1000);
    }
    return false;
  },

  /** 扫评论区；回复走 replyComment，可带图；视频结束关弹层 */
  comments(author, title, commentKw, sleepSecond, rates, isVideoMode) {
    let commentCount = XhsWork.getCommentCount();
    statistics.viewVideo();
    if (!commentCount) { logger.info('rpa', '无评论'); return true; }
    statistics.viewTargetVideo();
    XhsWork.openComment();
    tCommon.sleep(2000 + 1000 * Math.random());

    let maxSwipe = commentCount + 5;
    while (maxSwipe-- > 0) {
      if (taskStopped()) return false;
      let list = XhsWork.getCommenList();
      if (!list || !list.length) { logger.info('rpa', '没有评论内容'); break; }

      for (let k in list) {
        if (taskStopped()) return false;
        let c = list[k];
        if (!c) continue;
        if (c.zaned || (c.zanTag && XhsComment.isZaned(c.zanTag))) continue;

        let ctn = c.content || '', nick = c.nickname || '';
        if (!ctn || !this.includesKw(ctn, commentKw)) continue;

        let cKey = this.commentKey(author, title, nick, ctn);
        if (machine.get(cKey, 'bool')) {
          System.toast('重复');
          logger.info('rpa', '评论重复：' + nick);
          continue;
        }

        logger.info('rpa', '命中：' + ctn);
        let op = Math.random(), refresh = false;
        if (op <= rates.zan) {
          if (c.zanTag) XhsComment.clickZan(c.zanTag);
          tCommon.sleep(1000 + 1000 * Math.random());
        } else if (op <= rates.zan + rates.reply) {
          let m = this.getMsg(0, title);
          if (m) { XhsWork.replyComment(c, m.msg, m.image); logger.info('rpa', '回复'); refresh = true; }
        } else {
          if (!XhsComment.intoUserPage(c.nicknameTag)) continue;
          if (XhsUser.isPrivate()) {
            tCommon.back();
          } else {
            if (op <= rates.zan + rates.reply + rates.dm) {
              let person = { comment: ctn, nickname: XhsUser.getNickname() || nick, gender: ['女', '男', '未知'][XhsUser.getGender()] || '未知', age: String(XhsUser.getAge() || ''), video: title || '' };
              let m = this.getMsg(1, person);
              if (m) XhsUser.privateMsg(m.msg);
            } else {
              XhsUser.focus();
              logger.info('rpa', '关注');
            }
            tCommon.sleep(1000 + 1000 * Math.random());
            tCommon.back();
          }
          tCommon.sleep(800);
        }

        machine.set(cKey, true);
        tCommon.sleep(sleepSecond * 1000);
        if (refresh) { list = XhsWork.getCommenList(); refresh = false; }
      }

      if (UiSelector().textContains('- 到底了 -').isVisibleToUser(true).findOneBy(600)) { logger.info('rpa', '评论已到底'); break; }
      if (!XhsWork.commentListSwipe()) { logger.info('rpa', '评论无法继续滑动'); break; }
      tCommon.sleep(1500 + 500 * Math.random());
    }

    if (isVideoMode) {
      XhsWork.closeCommentWindow(true);
      tCommon.sleep(800);
    }
    return true;
  },

  testTask(input, sleepSecond, conf) {
    let commentKw = tCommon.splitKeyword(input);
    let isVideoMode = Number(conf.noteType) === 1;
    logger.info('rpa', '评论关键词：' + commentKw.join(',') + ' 模式=' + (isVideoMode ? '视频' : '笔记'));

    XhsIndex.intoSearchPage();
    tCommon.sleep(1500);
    XhsSearch.intoSearchList(conf.searchTitle, params.filterConfig());

    let sum = conf.privateRate + conf.focusRate + conf.zanCommentRate + conf.replyCommentRate;
    let rates = { zan: 0, reply: 0, dm: 0 };
    if (sum > 0) {
      rates.zan = conf.zanCommentRate / sum;
      rates.reply = conf.replyCommentRate / sum;
      rates.dm = conf.privateRate / sum;
    }

    // 视频：先从列表进第一条，之后流内下滑（对齐 dy toker video）
    if (isVideoMode) {
      if (!XhsSearch.intoNextNote(this.contents)) {
        FloatDialogs.show('温馨提示', '操作完成');
        return true;
      }
    }

    // 最近 3 个非空标题；连续 3 次相同说明滑不动了
    let recentTitles = [];
    while (true) {
      if (taskStopped()) return false;
      tCommon.sleep(2000 + 1000 * Math.random());

      if (isVideoMode) {
        if (XhsWork.isLiving()) { logger.info('rpa', '直播，下一个'); this.swipeNextVideo(); continue; }

        let title = this.noteTitle();
        if (title) {
          recentTitles.push(title);
          if (recentTitles.length > 3) recentTitles.shift();
          if (recentTitles.length >= 3 && recentTitles[0] === recentTitles[1] && recentTitles[1] === recentTitles[2]) {
            logger.info('rpa', '连续3次同一标题，视频流到底');
            FloatDialogs.show('温馨提示', '操作完成');
            return true;
          }
        }

        let nick = this.authorNick();
        let commentCount = XhsWork.getCommentCount();
        let done = !title || this.contents.includes(title) || machine.get(this.workKey(nick, title), 'bool');
        if (!commentCount || done) {
          if (done && title) { System.toast('该作品已操作过'); logger.info('rpa', '该作品已操作过'); }
          logger.info('rpa', '下一个视频');
          this.swipeNextVideo();
          continue;
        }

        if (!this.comments(nick, title, commentKw, sleepSecond, rates, true)) return false;
        machine.set(this.workKey(nick, title), true);
        this.contents.push(title);
        logger.info('rpa', '下一个视频');
        this.swipeNextVideo();
        continue;
      }

      // 笔记：列表进 → 扫评论 → 回列表（对齐 xhs search_inquiry）
      let title = XhsSearch.intoNextNote(this.contents);
      if (!title) { FloatDialogs.show('温馨提示', '操作完成'); return true; }
      let nick = this.authorNick();
      let workTitle = this.noteTitle() || title;
      if (machine.get(this.workKey(nick, workTitle), 'bool')) {
        System.toast('该作品已操作过');
        this.contents.push(title);
        this.backToList();
        continue;
      }
      if (!this.comments(nick, workTitle, commentKw, sleepSecond, rates, false)) return false;
      machine.set(this.workKey(nick, workTitle), true);
      this.contents.push(title);
      this.backToList();
    }
  },

  run() {
    if (!permission.ensureRun()) { logger.warn('rpa', '权限未就绪'); Engines.closeAll(); return; }
    let paid = activation.ensurePaid();
    if (!paid.ok) { logger.warn('rpa', '未开通 - ' + (paid.message || '')); Engines.closeAll(); return; }

    let conf = params.load();
    let title = String(conf.searchTitle || '').trim();
    let input = String(conf.commentKeyword || '').trim();
    if (!title) { FloatDialogs.show('请输入笔记搜索关键词'); Engines.closeAll(); return; }
    if (!input) { FloatDialogs.show('请输入评论关键词'); Engines.closeAll(); return; }

    gallery.cleanupRecent();
    logger.info('rpa', '开始 ' + params.summary());
    if (conf.hidEnabled) {
      try {
        Hid.initBluetooth();
        logger.info('rpa', Hid.connectAndWait(true, 0) ? ('HID：' + String(Hid.getName() || '')) : 'HID 失败，回退普通点击');
      } catch (e) { logger.warn('rpa', 'HID 异常'); }
    }
    showRunBar();
    System.setAccessibilityMode('fast');

    while (true) {
      if (taskStopped()) break;
      try {
        tCommon.openApp();
        try { Events.emit('rpa_app_opened'); } catch (eEmit) {}
        if (this.testTask(input, conf.intervalSec, conf)) {
          finished = true;
          gallery.cleanupRecent();
          FloatPage.close('runBar');
          FloatDialogs.show('温馨提示', '已结束');
          System.exit();
        }
        tCommon.sleep(3000);
      } catch (e) {
        if (taskStopped()) break;
        logger.error('rpa', '异常: ' + ((e && e.message) || e));
        try { tCommon.closeAlert(1); } catch (e1) { }
        try { tCommon.backHome(); } catch (e2) { }
        tCommon.sleep(2000);
      }
    }
    gallery.cleanupRecent();
    Engines.closeAll();
  }
};

task.run();
