let permission = require('../common/permission.js');
let activation = require('../common/activation.js');
let scripts = require('../common/scripts.js');
let smart = require('../common/smartScripts.js');
let params = require('../common/params.js');
let logger = require('../common/logger.js');
let machine = require('../common/machine.js');
let statistics = require('../common/statistics.js');
let tCommon = require('../app/dy/Common.js');
let DyUser = require('../app/dy/User.js');
let DySearch = require('../app/dy/Search.js');
let DyVideo = require('../app/dy/Video.js');
let DyIndex = require('../app/dy/Index.js');
let DyComment = require('../app/dy/Comment.js');

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
  FloatPage.setData('runBar', { title: '评论截流正在执行' });
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
      return '';
    }
    let i = Math.floor(Math.random() * list.length);
    return list[i] || '';
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
        payload = '短视频评论';
      }
      let gen = smart.generate(type === 1 ? 'dm' : 'comment', payload);
      if (gen.ok && gen.text) {
        return { msg: gen.text };
      }
      logger.warn('rpa', (type === 1 ? '智能私信' : '智能评论') + '失败：' + (gen.message || '') + '，改用自定义话术');
    }
    let list = scripts.enabledByType(type === 1 ? 'dm' : 'comment');
    let msg = this.pickOne(list);
    if (!msg) {
      return false;
    }
    return { msg: msg };
  },

  includesKw(str, kw) {
    for (let i in kw) {
      if (str.includes(kw[i])) {
        return true;
      }
    }
    return false;
  },

  msgText(type, title) {
    let res = this.getMsg(type, title);
    return res && res.msg ? res.msg : '';
  },

  testTask(input, sleepSecond, conf) {
    let commentKw = tCommon.splitKeyword(input);
    logger.info('rpa', '评论关键词：' + commentKw.join(','));
    let videoConfig = params.filterConfig();
    DyIndex.intoSearchPage();
    tCommon.sleep(1500);
    DySearch.intoSearchList(conf.searchTitle, 0, videoConfig);
    DySearch.intoSearchVideo();

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

    let rps = 0;
    while (true) {
      tCommon.sleep(4000 + Math.random() * 2000);
      if (DyVideo.isLiving()) {
        logger.info('rpa', '直播，下一个');
        DyVideo.next();
        continue;
      }

      let title = DyVideo.getContent();
      let commentCount = DyVideo.getCommentCount();
      statistics.viewVideo();
      if (commentCount === 0 || this.contents.includes(title)) {
        logger.info('rpa', '下一个视频');
        if (rps++ > 3) {
          return true;
        }
        DyVideo.next();
        continue;
      }
      rps = 0;

      statistics.viewTargetVideo();
      DyVideo.openComment(!!commentCount);
      tCommon.sleep(2000 + 1000 * Math.random());

      let firstComment = true;
      while (true) {
        let comments = DyComment.getList();
        if (comments.length == 0) {
          DyComment.closeCommentWindow();
          tCommon.sleep(1000);
          logger.info('rpa', '没有评论内容');
          break;
        }

        for (let k in comments) {
          if (firstComment && Math.random() * 100 <= conf.firstCommentRate) {
            let firstMsg = this.msgText(0, title);
            if (firstMsg) {
              DyComment.backMsg(comments[k], firstMsg);
              logger.info('rpa', '首评');
              tCommon.sleep(1000);
              comments = DyComment.getList();
            }
            firstComment = false;
            continue;
          }
          firstComment = false;
          if (!comments[k]) {
            continue;
          }

          if (!comments[k]['content'] || !this.includesKw(comments[k]['content'], commentKw) || this.nicknames.includes(comments[k].nickname)) {
            continue;
          }

          if (machine.get('task_dy_toker_video_' + comments[k].nickname, 'bool')) {
            logger.info('rpa', '重复昵称，跳过');
            continue;
          }

          logger.info('rpa', '命中关键词：' + comments[k]['content']);
          let opRate = Math.random();
          let refresh = false;
          if (opRate <= zanCommentRate) {
            try {
              logger.info('rpa', '点赞评论');
              if (!DyComment.isZan()) {
                DyComment.clickZan(comments[k]);
                tCommon.sleep(1000 + 1000 * Math.random());
              }
            } catch (e) {
              logger.warn('rpa', '点赞异常：' + ((e && e.message) || e));
              continue;
            }
          } else if (opRate <= zanCommentRate + backCommentRate) {
            let reply = this.msgText(0, title);
            if (reply) {
              DyComment.backMsg(comments[k], reply);
              logger.info('rpa', '回复评论');
              refresh = true;
            }
          } else {
            DyComment.intoUserPage(comments[k]);
            if (DyUser.isPrivate()) {
              tCommon.back();
            } else {
              if (opRate <= zanCommentRate + backCommentRate + privateRate) {
                let nickname = comments[k].nickname || '';
                let age = 0;
                let gender = 2;
                try {
                  nickname = DyUser.getNickname() || nickname;
                } catch (e) {
                  logger.warn('rpa', '读取昵称失败：' + ((e && e.message) || e));
                }
                try {
                  age = DyUser.getAge() || 0;
                } catch (e) {
                  logger.warn('rpa', '读取年龄失败：' + ((e && e.message) || e));
                }
                try {
                  gender = DyUser.getGender();
                } catch (e) {
                  logger.warn('rpa', '读取性别失败：' + ((e && e.message) || e));
                }
                let person = {
                  comment: comments[k].content || '',
                  nickname: nickname,
                  gender: ['女', '男', '未知'][gender] || '未知',
                  age: age ? String(age) : '',
                  video: title || ''
                };
                logger.info('rpa', '私信依据 昵称=' + person.nickname + ' 性别=' + person.gender + ' 年龄=' + (person.age || '未知'));
                let dm = this.msgText(1, person);
                if (dm) {
                  DyUser.privateMsg(dm);
                }
              } else {
                DyUser.focus();
                logger.info('rpa', '关注');
              }
              tCommon.sleep(1000 + 1000 * Math.random());
              tCommon.back();
            }
          }

          this.nicknames.push(comments[k].nickname);
          machine.set('task_dy_toker_video_' + comments[k].nickname, true);
          tCommon.sleep(sleepSecond * 1000);
          if (refresh) {
            comments = DyComment.getList();
            refresh = false;
          }
        }

        logger.info('rpa', '下一页评论');
        if (!DyComment.swipeTop()) {
          tCommon.back();
          tCommon.sleep(1000);
          logger.info('rpa', '评论扫描完了');
          break;
        }
        tCommon.sleep(1500 + 500 * Math.random());
      }

      let retryCount = 3;
      while (retryCount-- > 0) {
        if (!UiSelector().text('搜索').findOne()) {
          logger.info('rpa', '找不到视频的搜索，返回');
          tCommon.back();
          tCommon.sleep(1500 + 500 * Math.random());
          continue;
        }
        break;
      }
      logger.info('rpa', '下一个视频');
      this.contents.push(title);
      DyVideo.next();
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
      FloatDialogs.show('请输入视频搜索关键词');
      Engines.closeAll();
      return;
    }
    if (!input) {
      FloatDialogs.show('请输入评论关键词');
      Engines.closeAll();
      return;
    }

    logger.info('rpa', '开始评论截流II');
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
    Engines.closeAll();
  }
};

task.run();
