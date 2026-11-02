let Common = require('app/xhs/Common.js');

let Search = {
  /**
   * 搜索关键词；可选筛选（对齐小红书筛选面板）：
   * sort: 0综合 1最新 2最多点赞 3最多评论 4最多收藏
   * type: 1视频 2图文/笔记（业务侧不再提供「不限」）
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
    Common.inputText(iptTag, keyword);
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

  /** 搜索结果顶栏：ActionBar$Tab 下子控件文案为「全部」，点击打开筛选面板 */
  openResultFilter() {
    let already =
      UiSelector().text('收起').isVisibleToUser(true).findOne() ||
      UiSelector().text('重置').isVisibleToUser(true).findOne();
    if (already) {
      return true;
    }

    let allTv = UiSelector().className('android.widget.TextView').text('全部').isVisibleToUser(true).filter(function (v) {
      return v.parent() && v.parent().className() == 'androidx.appcompat.app.ActionBar$Tab';
    }).findOne();
    if (!allTv) {
      Log.log('未找到全部 Tab');
      return false;
    }
    let tab = allTv.parent();
    Common.click(tab, 0.15);
    Common.sleep(1500 + 800 * Math.random());

    let opened =
      UiSelector().text('收起').isVisibleToUser(true).findOne() ||
      UiSelector().text('重置').isVisibleToUser(true).findOne() ||
      UiSelector().text('最多点赞').isVisibleToUser(true).findOne();
    if (!opened) {
      // 若当前不在「全部」分类，第一次点击可能只是切 Tab，再点一次打开面板
      Common.click(tab, 0.15);
      Common.sleep(1500 + 800 * Math.random());
      opened =
        UiSelector().text('收起').isVisibleToUser(true).findOne() ||
        UiSelector().text('重置').isVisibleToUser(true).findOne();
    }
    if (!opened) {
      Log.log('点击全部 Tab 后未打开筛选面板');
      return false;
    }
    return true;
  },

  applyFilter(config) {
    let cfg = config || {};
    let sort = parseInt(cfg.sort, 10) || 0;
    let type = parseInt(cfg.type, 10) || 0;
    let time = parseInt(cfg.time, 10) || 0;
    let range = parseInt(cfg.range, 10) || 0;
    let distance = parseInt(cfg.distance, 10) || 0;
    // 笔记类型必选：1视频 / 2图文；非法值按笔记处理
    if (type !== 1 && type !== 2) {
      type = 2;
    }

    if (!this.openResultFilter()) {
      return false;
    }

    let sortMap = [
      ['综合'],
      ['最新'],
      ['最多点赞'],
      ['最多评论'],
      ['最多收藏']
    ];
    let typeMap = [
      ['视频'],
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
    // 始终应用笔记类型（视频/图文）
    this.clickFilterOption(typeMap[type] || ['图文']);
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
      UiSelector().text('完成').isVisibleToUser(true).findOne();
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
      let tags = UiSelector().text(arr[i]).isVisibleToUser(true).find();
      if (!tags || !tags.length) {
        tags = UiSelector().textContains(arr[i]).isVisibleToUser(true).find();
      }
      if (!tags || !tags.length) {
        continue;
      }
      // 面板选项高度约 96，顶栏小字约 61；优先点更大的，同高度取更靠下的
      let best = null;
      for (let j = 0; j < tags.length; j++) {
        let t = tags[j];
        if (!best) {
          best = t;
          continue;
        }
        let bh = best.bounds().height();
        let th = t.bounds().height();
        if (th > bh || (th === bh && t.bounds().top > best.bounds().top)) {
          best = t;
        }
      }
      if (best) {
        Common.click(best, 0.15);
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
   * 在搜索列表中循环查找下一条未操作的图文/视频并进入。
   * 当前屏没有则下滑继续找；swipeWorkOp 返回 false 表示已到底。
   * @param {string[]} ignoreTitles 本轮已处理过的标题
   * @returns {string|null} 进入的作品标题；到底或无法滑动则 null
   */
  intoNextNote(ignoreTitles) {
    let ignores = ignoreTitles || [];
    let guard = 50;
    while (guard-- > 0) {
      let list = this.getList();
      Log.log('搜索列表条数', list ? list.length : 0, '剩余滑动轮次', guard);
      for (let i = 0; i < list.length; i++) {
        let item = list[i];
        if (!item || !item.tag) {
          continue;
        }
        if (item.isLiving) {
          continue;
        }
        let title = item.content || '';
        if (!title) {
          continue;
        }
        if (ignores.indexOf(title) !== -1) {
          continue;
        }
        // 标题过长时 contents 可能只存了截断，两边都比一下
        let shortTitle = title.length > 40 ? title.substring(0, 40) : title;
        if (ignores.indexOf(shortTitle) !== -1) {
          continue;
        }
        Log.log('进入未操作作品', shortTitle);
        Common.click(item.tag, 0.25);
        Common.sleep(3500 + 2000 * Math.random());
        return title;
      }

      // 本屏都已操作过（或无可用项），继续下滑找新的
      let swiped = Common.swipeWorkOp();
      if (!swiped) {
        Log.log('搜索列表滑动返回 false，已到底');
        return null;
      }
      Common.sleep(1500 + 800 * Math.random());
    }
    Log.log('intoNextNote 超过最大滑动次数，结束');
    return null;
  }
};

module.exports = Search;
