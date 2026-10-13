let Common = require('./Common.js');

const Search = {
    /**
     * type = 0 视频  type = 1 用户  需要先进入搜索页  2 综合
     * @param {string} keyword
     * @param {number} [type]
     * @param {any} [config]
     */
    intoSearchList(keyword, type, config) {
        if (!type) {
            type = 0;
        }

        let iptTag = UiSelector().className('android.widget.EditText').filter(v => {
            return v.isEditable();
        }).isVisibleToUser(true).findOne();
        iptTag.setText(keyword);
        Common.sleep(1000 + 500 * Math.random());

        let searchBtnTag = UiSelector().className('android.widget.TextView').isVisibleToUser(true).text('搜索').findOne() || UiSelector().className('android.widget.TextView').isVisibleToUser(true).desc('搜索').findOne();
        Log.log('searchBtnTag', searchBtnTag);
        Common.click(searchBtnTag);
        Common.sleep(4000 + 2000 * Math.random());
        if (type == 2) {
            return true;
        }
        let videoTag;
        let rp = 3;
        while (!videoTag) {
            if (type === 0) {
                videoTag = UiSelector().id('android:id/text1').className('android.widget.Button').text('视频').findOne();
            } else if (type === 1) {
                videoTag = UiSelector().id('android:id/text1').className('android.widget.Button').text('用户').findOne();
            }

            if (rp-- <= 0 || videoTag) {
                break;
            }

            Common.swipeSearchTabToLeft();
            Common.sleep(1500);
        }

        if (!videoTag) {
            console.log('找不到用户tab');
            throw new Error('找不到视频或者用户tab;type=' + type);
        }

        console.log('进入用户或者视频：', videoTag);
        videoTag.parent().click();
        Common.sleep(3500 + 1500 * Math.random());

        if (config) {
            let num = 0;
            for (let i in config) {
                num += config[i];
            }

            if (num > 0) {
                let filterTag = UiSelector().descContains('筛选').clickable(true).isVisibleToUser(true).findOne();
                if (filterTag) {
                    filterTag = UiSelector().className('android.view.ViewGroup').clickable(true).filter(v => {
                        return v.bounds().left > Device.width() * 0.8 && v.bounds().bottom < Device.height() / 5;
                    }).findOne();
                }

                Common.log('filterTag', filterTag);
                filterTag.click();
                Common.sleep(1000);

                let textConfig = {
                    sort: ['综合排序', '最新发布', '最多点赞'],
                    time: ['不限', '一天内', '一周内', '半年内'],
                    minute: ['不限', '1分钟以下', '1-5分钟', '5分钟以上'],
                    random: ['不限', '关注的人', '最近看过', '还未看过']
                };

                let baseTop = {
                    sort: '排序依据',
                    time: '发布时间',
                    minute: '视频时长',
                    random: '搜索范围'
                };

                for (let i in config) {
                    if (config[i] == 0) {
                        continue;
                    }

                    let baseTopTag = UiSelector(false).text(baseTop[i]).isVisibleToUser(true).findOne();
                    let tag = UiSelector(false).text(textConfig[i][config[i]]).filter(v => {
                        return v.bounds().top > baseTopTag.bounds().top + baseTopTag.bounds().height();
                    }).findOne();
                    tag.parent().click();
                    Common.sleep(1000 + 1000 * Math.random());
                }

                Common.sleep(3000 + 1000 * Math.random());
                Gesture.click(filterTag.parent().bounds().left + 10 * Math.random(), filterTag.parent().bounds().top + 10 * Math.random());
                Common.sleep(1000);
            }
        }
    },

    intoSearchVideo() {
        let videoTag = Common.aId('text1').text('视频').isVisibleToUser(true).findOne();
        Common.click(videoTag, 0.2);
        Common.sleep(3000 + 1000 * Math.random());

        let descTag = Common.id('desc').className('android.widget.TextView').filter(v => {
            return !!v.text();
        }).isVisibleToUser(true).findOne();

        if (descTag) {
            Common.click(descTag, 0.2);
            return true;
        }
        throw new Error('找不到视频输入');
    }
};

module.exports = Search;
