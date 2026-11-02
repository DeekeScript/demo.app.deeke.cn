let Common = require('app/xhs/Common');
let statistics = require('common/statistics');
let Comment = {
    /** 读取评论点赞控件是否已点赞（selected / desc） */
    isZaned(tag) {
        if (!tag) {
            return false;
        }
        try {
            if (tag.isSelected && tag.isSelected()) {
                return true;
            }
        } catch (e) {}
        try {
            let d = tag.desc && tag.desc();
            if (d) {
                if (d.indexOf('已点赞') >= 0 || d.indexOf('取消点赞') >= 0) {
                    return true;
                }
                // 「点赞 xxx」通常表示未点；「已赞」类文案视为已点
                if (d.indexOf('已赞') >= 0) {
                    return true;
                }
            }
        } catch (e2) {}
        return false;
    },

    clickZan(tag, type) {
        if (!tag) {
            Log.log('点赞控件为空，跳过');
            return false;
        }
        if (!Common.isOnScreen(tag)) {
            Log.log('点赞控件不可见，跳过');
            return false;
        }

        if (this.isZaned(tag)) {
            return true;
        }

        // 统一走 Common.click（开启 HID 时 Hid.tap）
        let ok = Common.click(tag, 0.25);
        if (!ok) {
            Log.log('点赞点击失败（可能不可见）');
            return false;
        }

        statistics.zan();
        return true;
    },

    intoUserPage(tag, type) {
        if (!tag) {
            Log.log('昵称控件为空，跳过');
            return false;
        }
        if (!Common.isOnScreen(tag)) {
            Log.log('昵称控件不可见，跳过进主页');
            return false;
        }

        let ok = Common.click(tag, 0.25);
        if (!ok) {
            return false;
        }

        Common.sleep(3000 + 2000 * Math.random());
        statistics.viewUser();
        return true;
    },

    zanFirstComment() {
        let backTag = UiSelector().className('android.widget.TextView').filter(v => {
            return v.text() && v.text().lastIndexOf('回复') == v.text().length - 2;
        }).textContains('回复').isVisibleToUser(true).findOne();
        if (!backTag || !Common.isOnScreen(backTag)) {
            Log.log('首评回复按钮不可见');
            return false;
        }
        Common.log('backTag', backTag);

        let zanTag = UiSelector().className('android.widget.TextView').filter(v => {
            return v.bounds().centerY() >= backTag.bounds().top && v.bounds().centerY() <= backTag.bounds().bottom && v.bounds().left > backTag.bounds().right;
        }).isVisibleToUser(true).findOne();

        if (!zanTag || !Common.isOnScreen(zanTag)) {
            Log.log('首评点赞控件不可见');
            return false;
        }
        Common.log('zanTag', zanTag);
        let res = Common.click(zanTag, 0.2);
        Common.sleep(2000 + 1000 * Math.random());
        return res;
    },

    dislikeFirstComment() {
        let backTag = UiSelector().textContains('回复').className('android.widget.TextView').filter(v => {
            return v.text().indexOf('回复') == v.text().length - 2;
        }).isVisibleToUser(true).findOne();
        if (!backTag || !Common.isOnScreen(backTag)) {
            return false;
        }

        let dislikeTag = UiSelector().className('android.widget.ImageView').filter(v => {
            return v.bounds().centerY() >= backTag.bounds().top && v.bounds().centerY() <= backTag.bounds().bottom && v.bounds().left >= backTag.bounds().right;
        }).isVisibleToUser(true).findOne();
        if (!dislikeTag || !Common.isOnScreen(dislikeTag)) {
            return false;
        }

        let res = Common.click(dislikeTag, 0.2);
        Common.sleep(2000 + 1000 * Math.random());
        return res;
    },

    /**
     * 
     * @param {string} category 
     * @returns 
     */
    report(category) {
        let backTag = UiSelector().textContains('回复').className('android.widget.TextView').filter(v => {
            return v.text().indexOf('回复') == v.text().length - 2;
        }).isVisibleToUser(true).findOne();
        if (!backTag || !Common.isOnScreen(backTag)) {
            return false;
        }

        Gesture.press(backTag.bounds().left + backTag.bounds().width() * Math.random(), backTag.bounds().top - backTag.bounds().height() * Math.random(), 800);
        Common.sleep(4000 + 1000 * Math.random());
        let reportTag = UiSelector().text('举报').isVisibleToUser(true).findOne();
        if (!reportTag || !Common.isOnScreen(reportTag)) {
            return false;
        }
        Common.click(reportTag, 0.2);
        Common.sleep(2000 + 1000 * Math.random());

        let tag = UiSelector().text(category).isVisibleToUser(true).findOne();
        if (!tag) {
            let scrollTag = UiSelector().scrollable(true).isVisibleToUser(true).findOne();
            if (scrollTag) {
                scrollTag.scrollForward();
                Common.sleep(1000 + 1000 * Math.random());
            }
            tag = UiSelector().text(category).isVisibleToUser(true).findOne();
        }
        if (!tag || !Common.isOnScreen(tag)) {
            return false;
        }
        Common.click(tag, 0.2);
        Common.sleep(3000 + 1000 * Math.random());

        let submitTag = UiSelector().text('提交').isVisibleToUser(true).findOne();
        if (!submitTag || !Common.isOnScreen(submitTag)) {
            return false;
        }
        let res = Common.click(submitTag, 0.2);
        Common.sleep(2000 + 1000 * Math.random());
        return res;
    }
}

module.exports = Comment;
