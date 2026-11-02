let Common = require('app/xhs/Common.js');

let Search = {
  /**
   * 搜索关键词；可选筛选（对齐小红书筛选面板）：
   * sort: 0综合 1最新 2最多点赞 3最多评论 4最多收藏
   * type: 0不限 1视频 2图文
   * time: 0不限 1一天内 2一周内 3半年内
   * range: 0不限 1已看过 2未看过 3已关注
   * distance: 0不限 1同城 2附近
   */
  intoSearchList(keyword, config) {
    let iptTag = UiSelector().className('android.widget.EditText').filter(function (v) {
      return v && v.isEditable();
    }).isVisibleToUser(true).findOneBy(5000);
    if (!iptTag) {
      throw new Error('没有找到输入框');
    }
    iptTag.setText(keyword);
    Common.sleep(1500 + 1500 * Math.random());

    let searchBtnTag = UiSelector().className('android.widget.Button').filter(function (v) {
      return v && (v.text() == '搜索' || v.desc() == '搜索');
    }).isVisibleToUser(true).findOnce() ||
      UiSelector().className('android.widget.TextView').isVisibleToUser(true).text('搜索').findOne() ||
      UiSelector().className('android.widget.TextView').isVisibleToUser(true).desc('搜索').findOne();
    if (!searchBtnTag) {
      throw new Error('没有找到搜索点击按钮');
    }

    Common.click(searchBtnTag, 0.15);
    Common.sleep(4000 + 2000 * Math.random());
    this.applyFilter(config || {});
  },

  applyFilter(config) {
    let cfg = config || {};
    let sort = parseInt(cfg.sort, 10) || 0;
    let type = parseInt(cfg.type, 10) || 0;
    let time = parseInt(cfg.time, 10) || 0;
    let range = parseInt(cfg.range, 10) || 0;
    let distance = parseInt(cfg.distance, 10) || 0;
    if (sort === 0 && type === 0 && time === 0 && range === 0 && distance === 0) {
      return false;
    }

    let filterTag =
      UiSelector().descContains('筛选').clickable(true).isVisibleToUser(true).findOne() ||
      UiSelector().text('筛选').isVisibleToUser(true).findOne() ||
      UiSelector().desc('筛选').isVisibleToUser(true).findOne();
    if (!filterTag) {
      Log.log('未找到筛选入口，跳过');
      return false;
    }
    Common.click(filterTag, 0.15);
    Common.sleep(1500 + 800 * Math.random());

    let sortMap = [
      ['综合'],
      ['最新'],
      ['最多点赞'],
      ['最多评论'],
      ['最多收藏']
    ];
    let typeMap = [
      ['不限'],
      ['视频'],
      ['图文']
    ];
    let timeMap = [
      ['不限'],
      ['一天内'],
      ['一周内'],
      ['半年内']
    ];
    let rangeMap = [
      ['不限'],
      ['已看过'],
      ['未看过'],
      ['已关注']
    ];
    let distanceMap = [
      ['不限'],
      ['同城'],
      ['附近']
    ];

    if (sort !== 0) {
      this.clickFilterOption(sortMap[sort] || ['综合']);
    }
    if (type !== 0) {
      this.clickFilterOption(typeMap[type] || ['不限']);
    }
    if (time !== 0) {
      this.clickFilterOption(timeMap[time] || ['不限']);
    }
    if (range !== 0) {
      this.clickFilterOption(rangeMap[range] || ['不限']);
    }
    if (distance !== 0) {
      this.clickFilterOption(distanceMap[distance] || ['不限']);
    }

    let confirm =
      UiSelector().text('收起').isVisibleToUser(true).findOne() ||
      UiSelector().text('完成').isVisibleToUser(true).findOne() ||
      UiSelector().descContains('筛选').isVisibleToUser(true).findOne() ||
      filterTag;
    if (confirm) {
      try {
        Common.click(confirm, 0.1);
      } catch (e) {}
    }
    Common.sleep(1500 + 800 * Math.random());
    Log.log('筛选已应用', sort, type, time, range, distance);
    return true;
  },

  clickFilterOption(needles) {
    let arr = needles || [];
    for (let i = 0; i < arr.length; i++) {
      let tag = UiSelector().text(arr[i]).isVisibleToUser(true).findOne() ||
        UiSelector().textContains(arr[i]).isVisibleToUser(true).findOne();
      if (tag) {
        Common.click(tag, 0.15);
        Common.sleep(800 + 500 * Math.random());
        return true;
      }
    }
    Log.log('未点到筛选项', arr.join('/'));
    return false;
  },

  intoUserVideoPage(keyword) {
    this.intoSearchList(keyword);
    let userTag = UiSelector().className('android.widget.TextView').text('用户').isVisibleToUser(true).filter(function (v) {
      return v.parent() && v.parent().className() == 'androidx.appcompat.app.ActionBar$Tab';
    }).findOne() || UiSelector().className('android.widget.TextView').text('账号').isVisibleToUser(true).filter(function (v) {
      return v.parent() && v.parent().className() == 'androidx.appcompat.app.ActionBar$Tab';
    }).findOne();

    if (!userTag) {
      throw new Error('没有找到用户tab');
    }

    let intoTag = UiSelector().className('android.widget.TextView').textContains(keyword).filter(function (v) {
      return v.bounds().top > userTag.bounds().bottom;
    }).isVisibleToUser(true).findOne();
    if (intoTag && intoTag.parent() && intoTag.parent().isClickable()) {
      Common.click(intoTag, 0.2);
      Common.sleep(4000 + 2000 * Math.random());
      return true;
    }

    Common.click(userTag, 0.15);
    Common.sleep(4000 + 2000 * Math.random());

    userTag = UiSelector().className('android.widget.TextView').textContains(keyword).isVisibleToUser(true).filter(function (v) {
      return v.text() != keyword;
    }).findOne();

    if (!userTag) {
      return false;
    }
    Common.click(userTag, 0.15);
    Common.sleep(4000 + 2000 * Math.random());
    return true;
  },

  getList() {
    let tags = UiSelector().className('android.widget.FrameLayout').isVisibleToUser(true).filter(function (v) {
      return v && v.parent() != null && v.parent().className() == 'androidx.recyclerview.widget.RecyclerView' && v.getChildCount() >= 1;
    }).find();

    let childs = [];
    for (let i in tags) {
      let children = tags[i].children();
      let child = children.findOne(UiSelector().className('android.widget.TextView').filter(function (v) {
        return v.text() != '赞助' && v.parent() && v.parent().className() == 'android.widget.FrameLayout';
      }));
      if (!child) {
        // 兜底：用 desc 含「笔记/视频」的卡片
        let desc = tags[i].desc && tags[i].desc();
        if (desc && (desc.indexOf('笔记') === 0 || desc.indexOf('视频') === 0)) {
          childs.push({
            content: desc,
            tag: tags[i],
            isLiving: !!tags[i].findOne(UiSelector().className('android.widget.TextView').text('直播中'))
          });
        }
        continue;
      }
      childs.push({
        content: child.text(),
        tag: tags[i],
        isLiving: tags[i].findOne(UiSelector().className('android.widget.TextView').text('直播中')) ? true : false
      });
    }

    // 再补一层：直接找 desc 开头为笔记/视频的 FrameLayout
    if (!childs.length) {
      let noteTags = UiSelector().className('android.widget.FrameLayout').isVisibleToUser(true).filter(function (v) {
        let d = v.desc && v.desc();
        return d && (d.indexOf('笔记') === 0 || d.indexOf('视频') === 0);
      }).find();
      for (let j in noteTags) {
        childs.push({
          content: noteTags[j].desc(),
          tag: noteTags[j],
          isLiving: false
        });
      }
    }
    return childs;
  },

  /**
   * 打开搜索结果中下一条未处理笔记；忽略 ignoreTitles。
   */
  intoNextNote(ignoreTitles) {
    let ignores = ignoreTitles || [];
    let list = this.getList();
    for (let i = 0; i < list.length; i++) {
      let item = list[i];
      if (!item || !item.tag) {
        continue;
      }
      if (item.isLiving) {
        continue;
      }
      let title = item.content || '';
      if (ignores.indexOf(title) !== -1) {
        continue;
      }
      Common.click(item.tag, 0.25);
      Common.sleep(3500 + 2000 * Math.random());
      return title || ('note_' + Date.now());
    }
    Common.swipeWorkOp();
    Common.sleep(1500 + 800 * Math.random());
    return null;
  }
};

module.exports = Search;
