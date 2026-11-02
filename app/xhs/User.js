let Common = require("app/xhs/Common.js");
let statistics = require("common/statistics.js");

let User = {
    swipeFans(selectText) {
        if (selectText.indexOf('关注') !== -1) {
            Common.swipeFocusListOp();
        } else if (selectText.indexOf('粉丝') !== -1) {
            Common.swipeFansListOp();
        } else if (selectText.indexOf('推荐') !== -1) {
            Common.swipeRecommendListOp();
        }
        Log.log("滑动异常：" + selectText);
    },

    isPrivate() {
        // 必须短超时，避免 findOne 无限等
        return !!UiSelector().text('私密账号').isVisibleToUser(true).findOneBy(1500);
    },

    getNickname() {
        let nicknameTag = UiSelector().className('android.widget.TextView').isVisibleToUser(true).findOneBy(2000);
        return nicknameTag ? nicknameTag.text() : '';
    },

    intoVideo() {
        let videoTag = UiSelector().className('android.widget.FrameLayout').filter(v => {
            return v.desc() && (v.desc().indexOf('视频') === 0 || v.desc().indexOf('笔记') === 0);
        }).findOne();

        if (!videoTag) {
            return false;
        }

        Common.tapAt(videoTag.bounds().left + videoTag.bounds().width() * 0.7, videoTag.bounds().top + videoTag.bounds().height() * 0.6);
        statistics.viewVideo();
        statistics.viewTargetVideo();
        Common.sleep(4000 + 3000 * Math.random());
        return true;
    },

    intoVideoX(ignoreTitles, opCount) {
        let contents = [];
        if (!ignoreTitles) {
            ignoreTitles = [];
        }

        let swipeCount = 0;
        while (true) {
            let videoTags = UiSelector().className('android.widget.FrameLayout').filter(v => {
                return v.desc() && (v.desc().indexOf('视频') === 0 || v.desc().indexOf('笔记') === 0);
            }).isVisibleToUser(true).find();

            if (!videoTags || videoTags.length === 0) {
                return false;
            }

            if (swipeCount >= 2 && videoTags.length < opCount) {
                return -1;//视频操作完了
            }

            for (let i in videoTags) {
                let content = videoTags[i].desc();
                contents.push(content);
                if (contents.length >= 3) {
                    if (contents[0] == contents[1] && contents[1] == contents[2]) {
                        throw new Error('已经没有图文了');
                    }

                    contents.unshift();
                }
                if (ignoreTitles.indexOf(content) !== -1) {
                    continue;
                }
                ignoreTitles.push(content);
                Common.click(videoTags[i], 0.15);
                Common.sleep(4000 + 3000 * Math.random());
                statistics.viewVideo();
                statistics.viewTargetVideo();
                return true;
            }

            Common.swipeWorksOp();
            swipeCount++;
            Common.sleep(1500 + 1000 * Math.random());
        }
    },

    privateMsg(msg) {
        let sendTag = UiSelector().className('android.widget.TextView').text('发私信').filter(v => {
            return v.text() == '发私信';
        }).findOne() || UiSelector().className('android.widget.TextView').text('发消息').filter(v => {
            return v.text() == '发消息';
        }).findOne() || UiSelector().className('android.widget.TextView').text('私信').filter(v => {
            return v.text() == '私信';
        }).findOne();
        if (!sendTag) {
            Log.log('找不到私信按钮');
            return true;
        }
        Common.click(sendTag, 0.3);
        Common.sleep(2000 + 1000 * Math.random());

        let res = this.privateMsgTwo(msg);
        Common.back();
        return res;
    },

    /** 私信仅支持文字，不允许配图 */
    privateMsgTwo(msg) {
        let text = String(msg || '').trim();

        let sendIptTag = UiSelector().className('android.widget.EditText').isVisibleToUser(true).findOne();
        if (sendIptTag) {
            Common.click(sendIptTag, 0.2);
            Common.sleep(1000 + 1000 * Math.random());
            sendIptTag = UiSelector().className('android.widget.EditText').isVisibleToUser(true).findOne();
        }
        if (text && sendIptTag) {
            Log.log('开始设置私信', text);
            Common.inputText(sendIptTag, text);
            Common.sleep(1500 + 1200 * Math.random());
        }

        let sendBtnTags = UiSelector().className('android.widget.TextView').isVisibleToUser(true).text('发送').find();
        if (sendBtnTags && sendBtnTags.length) {
            Common.click(sendBtnTags[sendBtnTags.length - 1], 0.2);
            Log.log('点击发送', sendBtnTags[sendBtnTags.length - 1]);
            statistics.privateMsg();
        }
        Common.sleep(1500 + 500 * Math.random());
        Common.back();
        Common.sleep(500 + 500 * Math.random());
        return true;
    },

    getAge() {
        return 0;
    },

    getGender() {
        return 2;
    },

    // 注意：粉丝关注有两种模式；对齐 sampledata：TextView 需有 id，或 Button
    isFocus() {
        let focusTag = UiSelector().filter(function (v) {
            return (v.className() == 'android.widget.TextView' && v.id()) || v.className() == 'android.widget.Button';
        }).isVisibleToUser(true).textContains('关注').findOne();
        if (focusTag && focusTag.text() != '关注') {
            Log.log('已经关注过了');
            return true;
        }
        return false;
    },

    focus() {
        if (this.isFocus()) {
            return true;
        }

        let focusTag = UiSelector().filter(function (v) {
            return (v.className() == 'android.widget.TextView' && v.id()) || v.className() == 'android.widget.Button';
        }).isVisibleToUser(true).textContains('关注').findOne();
        if (!focusTag) {
            Log.log('关注按钮不可见，跳过');
            return false;
        }
        Common.click(focusTag, 0.2);
        statistics.focus();
        Common.sleep(800 + 500 * Math.random());
        return true;
    },

    cancelFocus() {
        if (!this.isFocus()) {
            return true;
        }

        let focusTag = UiSelector().filter(v => {
            return (v.className() == 'android.widget.TextView' && v.id()) || v.className() == 'android.widget.Button';
        }).isVisibleToUser(true).textContains('已关注').findOne();
        Common.click(focusTag, 0.2);
        Common.sleep(1000 + 1000 * Math.random());
        let cancelTag = UiSelector().text('取消关注').isVisibleToUser(true).findOne();
        Common.click(cancelTag, 0.2);
        Common.sleep(2000 + 1000 * Math.random());

        cancelTag = UiSelector().text('不再关注').isVisibleToUser(true).findOne();
        Common.click(cancelTag, 0.2);
        Common.sleep(2000 + 1000 * Math.random());
        return true;
    },

    dealNum(str) {
        if (str.indexOf('万') !== -1) {
            str = str.replace('万', '') * 10000;
        } else if (str.indexOf('W') !== -1) {
            str = str.replace('W', '') * 10000;
        } else if (str.indexOf('w') !== -1) {
            str = str.replace('w', '') * 10000;
        }

        return str * 1 || 0;
    },

    getListWorkCount(tag) {
        if (!tag) {
            return 0;//笔记 42 | 粉丝 7
        }

        let text = tag.text();
        if (text.indexOf('笔记') == -1) {
            return 0;
        }

        let workCount;
        Log.log('text', text);
        if (text.indexOf('|') != -1) {
            workCount = tag.text().split('|')[0].replace('笔记', '').replace('·', '').replace(' ', '');
        } else {
            workCount = tag.text().replace('笔记', '').replace('·', '').replace(' ', '');
        }
        Log.log('workCount', workCount);
        return this.dealNum(workCount);
    },

    getListFansCount(tag) {
        if (!tag) {
            return 0;//笔记 42 | 粉丝 7
        }

        let text = tag.text();
        let fansCount;
        if (text.indexOf('粉丝') == -1) {
            return 0;
        }

        if (text.indexOf('|') != -1) {
            fansCount = tag.text().split('|')[1].replace('粉丝', '').replace('·', '').replace(' ', '');
        } else {
            fansCount = tag.text().replace('粉丝', '').replace('·', '').replace(' ', '');
        }

        return this.dealNum(fansCount);
    },

    getFansCount() {
        let fansCountTag = UiSelector().className('android.widget.Button').descContains('粉丝').findOne();
        if (!fansCountTag) {
            return 0;
        }

        let fansCount = fansCountTag.desc();
        return this.dealNum(fansCount);
    },

    /**
     * 
     * @param {string} category 
     * @param {string} msg 
     * @param {string} imageFile 
     * @returns 
     */
    report(category, msg, imageFile) {
        let moreTag = UiSelector().desc('更多').isVisibleToUser(true).findOne();
        Common.click(moreTag, 0.2);
        Common.sleep(1000 + 1000 * Math.random());

        let img = Images.capture();
        Common.sleep(2000 + 1000 * Math.random());
        Common.log('图片', img);
        let tagBounds = Images.findTextPosition(img, '举报');
        Common.tapAt(tagBounds[0].left + tagBounds[0].width() * Math.random(), tagBounds[0].top + tagBounds[0].height() * Math.random());
        Common.sleep(2000 + 2000 * Math.random());

        let theAccountTag = UiSelector().text('这个账号').isVisibleToUser(true).findOne();
        Common.click(theAccountTag, 0.2);
        Common.sleep(2000 + 2000 * Math.random());

        let tag = UiSelector().text(category).isVisibleToUser(true).findOne();
        if (!tag) {
            let scrollTag = UiSelector().scrollable(true).isVisibleToUser(true).findOne();
            scrollTag.scrollForward();
            Common.sleep(1000 + 1000 * Math.random());
            tag = UiSelector().text(category).isVisibleToUser(true).findOne();
        }
        Common.click(tag);
        Common.log('点击：' + category + ' 按钮');
        Common.sleep(2000 + 1000 * Math.random());

        let iptTag = UiSelector().className('android.widget.EditText').editable(true).isVisibleToUser(true).findOne();
        Common.inputText(iptTag, msg);
        Common.sleep(1000 + 1000 * Math.random());

        if (imageFile) {
            let addImageTag = UiSelector().desc('添加图片').isVisibleToUser(true).findOne();
            Common.photoInput(imageFile, addImageTag);
        }

        let submitTag = UiSelector().text('提交').isVisibleToUser(true).findOne();
        let res = Common.click(submitTag, 0.2);
        Common.sleep(1000 + 1000 * Math.random());
        return res;
    }
}

module.exports = User;
