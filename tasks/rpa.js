let permission = require('../common/permission.js');
let activation = require('../common/activation.js');
let scripts = require('../common/scripts.js');
let params = require('../common/params.js');

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
      console.log('rpa: 权限未就绪');
      Engines.closeAll();
      return;
    }

    let paid = activation.ensurePaid();
    if (!paid.ok) {
      console.log('rpa: 未开通 - ' + (paid.message || ''));
      Engines.closeAll();
      return;
    }

    let conf = params.load();
    let dmTexts = scripts.enabledByType('dm');
    let commentTexts = scripts.enabledByType('comment');
    let keywords = params.lines(conf.keywords);
    let excludes = params.lines(conf.excludeKeywords);
    let waitMs = Math.max(1, conf.intervalSec || 1) * 1000;

    console.log('rpa: 开始（demo 占位）');
    console.log('rpa: 参数 ' + params.summary());
    console.log('rpa: 关键词=' + keywords.length + ' 排除=' + excludes.length);
    console.log('rpa: 私信话术=' + dmTexts.length + ' 评论话术=' + commentTexts.length);

    if (conf.enableLike && this.hit(conf.likeRate)) {
      console.log('rpa: 点赞（上限 ' + conf.likeMax + '）');
      System.sleep(waitMs);
    } else {
      console.log('rpa: 跳过点赞');
    }

    if (conf.enableComment && this.hit(conf.commentRate) && commentTexts.length) {
      console.log('rpa: 评论 → ' + this.pickOne(commentTexts) + '（上限 ' + conf.commentMax + '）');
      System.sleep(waitMs);
    } else {
      console.log('rpa: 跳过评论');
    }

    if (conf.enableDm && this.hit(conf.dmRate) && dmTexts.length) {
      console.log('rpa: 私信 → ' + this.pickOne(dmTexts) + '（上限 ' + conf.dmMax + '）');
      System.sleep(waitMs);
    } else {
      console.log('rpa: 跳过私信');
    }

    console.log('rpa: demo 结束');
    Engines.closeAll();
  }
};

task.run();
