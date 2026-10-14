let Common = require('./Common.js');
let statistics = require('../../common/statistics.js');

const User = {
    backHome() {
        let i = 5;
        let settingTag;
        do {
            settingTag = UiSelector().descContains('复制名字').clickable(true).findOne();
            if (!settingTag) {
                Common.back();
                System.sleep(1000);
                continue;
            }
            Log.log('返回到了用户主页');
            return true;
        } while (i-- > 0 && !settingTag);
        Log.log('返回用户主页失败');
        return false;
    },

    intoPrivatePage() {
        if (this.isBlackUser()) {
            return false;
        }

        let settingTag = UiSelector().desc('更多').clickable(true).isVisibleToUser(true).findOne() || UiSelector().text('更多').clickable(true).isVisibleToUser(true).findOne();
        if (!settingTag) {
            Log.log('找不到setting按钮');
            return false;
        }

        settingTag.click();
        Log.log("私信");
        Common.sleep(700 + 500 * Math.random());

        let sendTag = UiSelector().text('发私信').isVisibleToUser(true).findOne();
        if (!sendTag) {
            throw new Error('找不到发私信按钮');
        }

        let res = sendTag.parent().click();
        Common.sleep(2000 + 1000 * Math.random());
        return res;
    },

    privateMsg(msg, inMsgPage, noBackHome) {
        try {
            if (!inMsgPage && !this.intoPrivatePage()) {
                return false;
            }

            let textTag = UiSelector().className('android.widget.EditText').filter(v => {
                return v.isEditable();
            }).isVisibleToUser(true).findOne();
            if (!textTag) {
                throw new Error('找不到发私信输入框');
            }
            textTag.setText(msg);
            Common.sleep(500 + 500 * Math.random());

            let sendTextTag = UiSelector().desc('发送').isVisibleToUser(true).clickable(true).findOne();
            if (!sendTextTag || !sendTextTag.click()) {
                throw new Error('发送消息失败');
            }

            Common.sleep(1500 + 500 * Math.random());
            Log.log("私信发送完成");
            statistics.privateMsg();
            if (!noBackHome) {
                this.backHome();
            }
            return true;
        } catch (e) {
            Log.log(e);
            if (!noBackHome) {
                this.backHome();
            }
        }
        return false;
    },

    isBlackUser() {
        if (UiSelector().textContains('封禁').isVisibleToUser(true).findOnce()) {
            return true;
        }
        if (UiSelector().textContains('账号已经注销').isVisibleToUser(true).findOnce()) {
            return true;
        }
        return false;
    },

    isPrivate() {
        Log.log("是否是私密账号、注销账号、封禁账号？");
        if (UiSelector().text('私密账号').isVisibleToUser(true).findOnce()) {
            return true;
        }
        if (this.isBlackUser()) {
            return true;
        }
        Log.log("不是私密账号、注销账号、封禁账号");
        return false;
    },

    isFocusTag() {
        return UiSelector().className('android.widget.TextView').isVisibleToUser(true).filter(v => {
            return v.hintText == '按钮';
        }).textContains('已关注').findOne() || UiSelector().className('android.widget.TextView').isVisibleToUser(true).filter(v => {
            return v.hintText == '按钮';
        }).textContains('互相关注').findOne();
    },

    isFocus() {
        return !!this.isFocusTag();
    },

    focus() {
        let focusTag = UiSelector().className('android.widget.TextView').isVisibleToUser(true).filter(v => {
            return v.hintText == '按钮';
        }).text('关注').findOne() || UiSelector().className('android.widget.TextView').isVisibleToUser(true).filter(v => {
            return v.hintText == '按钮';
        }).text('回关').findOne();

        if (this.isFocus()) {
            Log.log('已关注');
            return true;
        }

        if (focusTag) {
            let res = focusTag.click();
            statistics.focus();
            Common.sleep(500 + 500 * Math.random());
            return res;
        }

        throw new Error('找不到关注和已关注');
    },

    /**
     * 返回用户昵称
     * @returns {string}
     */
    getNickname() {
        let nicknameTag = UiSelector().className('android.widget.TextView').isVisibleToUser(true).descContains('复制名字').findOne() || UiSelector().className('android.widget.TextView').clickable(true).isVisibleToUser(true).findOne();
        if (nicknameTag) {
            return nicknameTag.text();
        }
        throw new Error('找不到昵称');
    },

    /**
     * 获取年龄
     * @returns {number}
     */
    getAge() {
        let ageTag = UiSelector().className('android.widget.TextView').isVisibleToUser(true).textContains('岁').findOne();
        if (!ageTag) {
            return 0;
        }
        return Common.numDeal(ageTag.text());
    },

    /**
     * 获取性别。0女，1男，2未知
     * @returns {number}
     */
    getGender() {
        if (UiSelector().className('android.widget.TextView').isVisibleToUser(true).textContains('男').findOne()) {
            return 1;
        }
        if (UiSelector().className('android.widget.TextView').isVisibleToUser(true).textContains('女').findOne()) {
            return 0;
        }
        return 2;
    }
};

module.exports = User;
