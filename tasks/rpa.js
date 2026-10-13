let permission = require('../common/permission.js');
let activation = require('../common/activation.js');
let scripts = require('../common/scripts.js');
let smart = require('../common/smartScripts.js');
let params = require('../common/params.js');
let logger = require('../common/logger.js');

let task = {
  pickOne(list) {
    if (!list || !list.length) {
      return '';
    }
    let i = Math.floor(Math.random() * list.length);
    return list[i] || '';
  },

  hit(rate) {
    let r = parseInt(rate, 10) || 0;
    if (r <= 0) {
      return false;
    }
    if (r >= 100) {
      return true;
    }
    return Math.floor(Math.random() * 100) < r;
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
    let smartConf = smart.load();
    let dmTexts = scripts.enabledByType('dm');
    let commentTexts = scripts.enabledByType('comment');
    let keywords = params.lines(conf.keywords);
    let excludes = params.lines(conf.excludeKeywords);
    let waitMs = Math.max(1, conf.intervalSec || 1) * 1000;
    let scene = keywords.length ? keywords.join('、') : '短视频获客';
    let useSmart = smartConf.mode === 'smart';
    let smartOk = useSmart && smart.ready();
    let useSmartComment = smartOk;
    let useSmartDm = smartOk && smartConf.dmSmart !== false;

    logger.info('rpa', '开始（demo 占位）');
    logger.info('rpa', '参数 ' + params.summary());
    logger.info('rpa', '关键词=' + keywords.length + ' 排除=' + excludes.length);
    if (useSmart) {
      logger.info('rpa', smartOk
        ? ('话术=智能 · 评论智能 · 私信' + (useSmartDm ? '智能' : '平台库'))
        : '话术=智能但未配置 Key，回退平台库');
    } else {
      logger.info('rpa', '私信话术=' + dmTexts.length + ' 评论话术=' + commentTexts.length);
    }

    try {
      if (conf.enableLike && this.hit(conf.likeRate)) {
        logger.info('rpa', '点赞（上限 ' + conf.likeMax + '）');
        System.sleep(waitMs);
      } else {
        logger.info('rpa', '跳过点赞');
      }

      if (conf.enableComment && this.hit(conf.commentRate)) {
        let comment = '';
        if (useSmartComment) {
          let gen = smart.generate('comment', scene);
          if (gen.ok) {
            comment = gen.text;
          } else {
            logger.warn('rpa', '智能评论失败：' + (gen.message || '') + '，改用自定义话术');
          }
        }
        if (!comment) {
          comment = this.pickOne(commentTexts);
        }
        if (comment) {
          logger.info('rpa', '评论 → ' + comment + '（上限 ' + conf.commentMax + '）');
          System.sleep(waitMs);
        } else {
          logger.info('rpa', '跳过评论（无可用话术）');
        }
      } else {
        logger.info('rpa', '跳过评论');
      }

      if (conf.enableDm && this.hit(conf.dmRate)) {
        let dm = '';
        if (useSmartDm) {
          let genDm = smart.generate('dm', scene);
          if (genDm.ok) {
            dm = genDm.text;
          } else {
            logger.warn('rpa', '智能私信失败：' + (genDm.message || '') + '，改用自定义话术');
          }
        }
        if (!dm) {
          dm = this.pickOne(dmTexts);
        }
        if (dm) {
          logger.info('rpa', '私信 → ' + dm + '（上限 ' + conf.dmMax + '）');
          System.sleep(waitMs);
        } else {
          logger.info('rpa', '跳过私信（无可用话术）');
        }
      } else {
        logger.info('rpa', '跳过私信');
      }

      logger.info('rpa', 'demo 结束');
    } catch (e) {
      logger.error('rpa', '异常: ' + ((e && e.message) || e));
    }
    Engines.closeAll();
  }
};

task.run();
