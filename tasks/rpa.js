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

function taskStopped() {
  return stopped;
}

function showRunBar() {
  let density = Device.width() / 360;
  if (density < 1) {
    density = 1;
  }
  let w = Math.floor(168 * density);
  let shown = FloatPage.show('runBar', {
    x: Math.floor((Device.width() - w) / 2),
    y: Math.floor(6 * density),
    width: w,
    height: Math.floor(28 * density),
    opacity: 0,
    background: '#00000000',
    draggable: false,
    focusable: false,
    gestureTouchable: false,
    inStatusBar: true
  });
  if (!shown) {
    logger.warn('rpa', '运行条打开失败');
    return;
  }
  FloatPage.setData('runBar', { title: '评论获客正在运行...' });
  Events.on('run_stop', function () {
    stopped = true;
  });
  Events.on('script_stop', function () {
    FloatPage.close('runBar');
    if (!finished) {
      System.toast('任务已关闭');
    }
  });
}

let task = {
  nicknames: [],
  contents: [],

  pickOne(list) {
    if (!list || !list.length) {
      return null;
    }
    let i = Math.floor(Math.random() * list.length);
    return list[i] || null;
  },

  getMsg(type, input) {
    let smartConf = smart.load();
    let useSmart = smartConf.mode === 'smart' && smart.ready();
    if (type === 1 && smartConf.dmSmart === false) {
      useSmart = false;
    }
    if (useSmart) {
      let payload = input;
      if (type === 1) {
        payload = input && typeof input === 'object' ? input : {
          comment: '',
          nickname: '',
          gender: '未知',
          age: ''
        };
      } else if (!payload) {
        payload = '小红书笔记评论';
      }
      let gen = smart.generate(type === 1 ? 'dm' : 'comment', payload);
      if (gen.ok && gen.text) {
        return { msg: gen.text, image: '' };
      }
      logger.warn('rpa', (type === 1 ? '智能私信' : '智能评论') + '失败：' + (gen.message || '') + '，改用自定义话术');
    }
    let list = scripts.enabledByType(type === 1 ? 'dm' : 'comment');
    let item = this.pickOne(list);
    if (!item) {
      return false;
    }
    return { msg: item.content || '', image: item.image || '' };
  },

  includesKw(str, kw) {
    for (let i in kw) {
      if (str.includes(kw[i])) {
        return true;
      }
    }
    return false;
  },

  msgPayload(type, title) {
    let res = this.getMsg(type, title);
    if (!res) {
      return null;
    }
    if (!res.msg && !res.image) {
      return null;
    }
    return res;
  },

  testTask(input, sleepSecond, conf) {
    let commentKw = tCommon.splitKeyword(input);
    logger.info('rpa', '评论关键词：' + commentKw.join(','));
    let filterConfig = params.filterConfig();
    XhsIndex.intoSearchPage();
    tCommon.sleep(1500);
    XhsSearch.intoSearchList(conf.searchTitle, filterConfig);

    let rateCount = conf.privateRate + conf.focusRate + conf.zanCommentRate + conf.replyCommentRate;
    let zanCommentRate = 0;
    let focuRate = 0;
    let privateRate = 0;
    let backCommentRate = 0;
    if (rateCount > 0) {
      zanCommentRate = conf.zanCommentRate / rateCount;
      focuRate = conf.focusRate / rateCount;
      privateRate = conf.privateRate / rateCount;
      backCommentRate = conf.replyCommentRate / rateCount;
    }
    logger.info('rpa', '频率合计=' + rateCount + ' 赞评=' + zanCommentRate + ' 关注=' + focuRate + ' 回复=' + backCommentRate);

    let emptyRounds = 0;
    while (true) {
      if (taskStopped()) {
        return false;
      }
      tCommon.sleep(2000 + Math.random() * 1500);
      let title = XhsSearch.intoNextNote(this.contents);
      if (!title) {
        emptyRounds++;
        logger.info('rpa', '没有更多笔记，滑动重试 ' + emptyRounds);
        if (emptyRounds > 5) {
          return true;
        }
        continue;
      }
      emptyRounds = 0;

      if (XhsWork.isLiving && XhsWork.isLiving()) {
        logger.info('rpa', '直播，返回下一个');
        tCommon.back();
        tCommon.sleep(1200);
        this.contents.push(title);
        continue;
      }

      let commentCount = XhsWork.getCommentCount();
      statistics.viewVideo();
      if (!commentCount) {
        logger.info('rpa', '无评论，下一个笔记');
        this.contents.push(title);
        tCommon.back();
        tCommon.sleep(1200);
        continue;
      }

      statistics.viewTargetVideo();
      let isVideo = XhsWork.isVideo();
      XhsWork.openComment();
      tCommon.sleep(2000 + 1000 * Math.random());

      let firstComment = true;
      let pageGuard = commentCount + 5;
      while (pageGuard-- > 0) {
        if (taskStopped()) {
          return false;
        }
        let comments = XhsWork.getCommenList();
        if (!comments || comments.length === 0) {
          logger.info('rpa', '没有评论内容');
          break;
        }

        for (let k in comments) {
          if (firstComment && Math.random() * 100 <= conf.firstCommentRate) {
            let firstMsg = this.msgPayload(0, title);
            if (firstMsg) {
              XhsWork.replyComment(comments[k], firstMsg.msg, firstMsg.image);
              logger.info('rpa', '首评');
              tCommon.sleep(1000);
              comments = XhsWork.getCommenList();
            }
            firstComment = false;
            continue;
          }
          firstComment = false;
          if (!comments[k]) {
            continue;
          }

          let ctn = comments[k].content || '';
          let nickname = comments[k].nickname || '';
          if (!ctn || !this.includesKw(ctn, commentKw) || this.nicknames.includes(nickname)) {
            continue;
          }

          if (machine.get('task_xhs_toker_note_' + nickname, 'bool')) {
            logger.info('rpa', '重复昵称，跳过');
            continue;
          }

          logger.info('rpa', '命中关键词：' + ctn);
          let opRate = Math.random();
          let refresh = false;
          if (opRate <= zanCommentRate) {
            try {
              logger.info('rpa', '点赞评论');
              if (comments[k].zanTag) {
                XhsComment.clickZan(comments[k].zanTag);
                tCommon.sleep(1000 + 1000 * Math.random());
              }
            } catch (e) {
              logger.warn('rpa', '点赞异常：' + ((e && e.message) || e));
              continue;
            }
          } else if (opRate <= zanCommentRate + backCommentRate) {
            let reply = this.msgPayload(0, title);
            if (reply) {
              XhsWork.replyComment(comments[k], reply.msg, reply.image);
              logger.info('rpa', '回复评论');
              refresh = true;
            }
          } else {
            XhsComment.intoUserPage(comments[k].nicknameTag);
            if (XhsUser.isPrivate()) {
              tCommon.back();
            } else {
              if (opRate <= zanCommentRate + backCommentRate + privateRate) {
                let nick = nickname;
                let age = 0;
                let gender = 2;
                try {
                  nick = XhsUser.getNickname() || nick;
                } catch (e) {
                  logger.warn('rpa', '读取昵称失败：' + ((e && e.message) || e));
                }
                try {
                  age = XhsUser.getAge() || 0;
                } catch (e2) {}
                try {
                  gender = XhsUser.getGender();
                } catch (e3) {}
                let person = {
                  comment: ctn,
                  nickname: nick,
                  gender: ['女', '男', '未知'][gender] || '未知',
                  age: age ? String(age) : '',
                  video: title || ''
                };
                logger.info('rpa', '私信依据 昵称=' + person.nickname + ' 性别=' + person.gender);
                let dm = this.msgPayload(1, person);
                if (dm) {
                  XhsUser.privateMsg(dm.msg, dm.image);
                }
              } else {
                XhsUser.focus();
                logger.info('rpa', '关注');
              }
              tCommon.sleep(1000 + 1000 * Math.random());
              tCommon.back();
            }
          }

          this.nicknames.push(nickname);
          machine.set('task_xhs_toker_note_' + nickname, true);
          tCommon.sleep(sleepSecond * 1000);
          if (refresh) {
            comments = XhsWork.getCommenList();
            refresh = false;
          }
        }

        logger.info('rpa', '下一页评论');
        if (UiSelector().className('android.widget.TextView').textContains('- 到底了 -').isVisibleToUser(true).findOne()) {
          logger.info('rpa', '评论扫描完了，已到底');
          break;
        }
        if (!XhsWork.commentListSwipe()) {
          logger.info('rpa', '评论无法继续滑动');
          break;
        }
        tCommon.sleep(1500 + 500 * Math.random());
      }

      if (isVideo) {
        tCommon.back();
        tCommon.sleep(1000);
      }
      tCommon.back();
      tCommon.sleep(1500 + 500 * Math.random());

      let retryCount = 3;
      while (retryCount-- > 0) {
        if (!UiSelector().text('搜索').findOne() && !UiSelector().descContains('搜索').findOne()) {
          logger.info('rpa', '找不到搜索页，返回');
          tCommon.back();
          tCommon.sleep(1200);
          continue;
        }
        break;
      }
      logger.info('rpa', '下一个笔记');
      this.contents.push(title);
    }
  },

  run() {
    if (!permission.ensureRun()) {
      logger.warn('rpa', '权限未就绪');
      Engines.closeAll();
      return;
    }

    let paid = activation.ensurePaid();
    if (!paid.ok) {
      logger.warn('rpa', '未开通 - ' + (paid.message || ''));
      Engines.closeAll();
      return;
    }

    let conf = params.load();
    let title = String(conf.searchTitle || '').trim();
    let input = String(conf.commentKeyword || '').trim();
    if (!title) {
      FloatDialogs.show('请输入笔记搜索关键词');
      Engines.closeAll();
      return;
    }
    if (!input) {
      FloatDialogs.show('请输入评论关键词');
      Engines.closeAll();
      return;
    }

    gallery.cleanupRecent();
    logger.info('rpa', '开始小红书评论截流');
    logger.info('rpa', '参数 ' + params.summary());
    showRunBar();

    Engines.executeScript('unit/dialogClose.js');
    System.setAccessibilityMode('fast');

    while (true) {
      if (taskStopped()) {
        break;
      }
      try {
        tCommon.openApp();
        let r = this.testTask(input, conf.intervalSec, conf);
        if (taskStopped()) {
          break;
        }
        if (r) {
          finished = true;
          gallery.cleanupRecent();
          FloatPage.close('runBar');
          FloatDialogs.show('温馨提示', '已结束');
          System.exit();
        }
        tCommon.sleep(3000);
      } catch (e) {
        if (taskStopped()) {
          break;
        }
        logger.error('rpa', '异常: ' + ((e && e.message) || e));
        tCommon.closeAlert(1);
      }
    }
    gallery.cleanupRecent();
    Engines.closeAll();
  }
};

task.run();
