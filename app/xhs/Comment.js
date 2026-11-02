let Common = require('app/xhs/Common');
let statistics = require('common/statistics');
let Comment = {
    clickZan(tag, type) {
        if (tag.isSelected()) {
            return true;
        }

        if (type == 1) {
            tag.click();
        } else {
            Common.click(tag, 0.25);
        }

        statistics.zan();
    },

    intoUserPage(tag, type) {
        if (type == 1) {
            tag.click();
        } else {
            Common.click(tag, 0.25);
        }

        Common.sleep(3000 + 2000 * Math.random());
        statistics.viewUser();
    },

    zanFirstComment() {
        let backTag = UiSelector().className('android.widget.TextView').filter(v => {
            return v.text() && v.text().lastIndexOf('回复') == v.text().length - 2;
        }).textContains('回复').isVisibleToUser(true).findOne();
        Common.log('backTag', backTag);

        let zanTag = UiSelector().className('android.widget.TextView').filter(v => {
            return v.bounds().centerY() >= backTag.bounds().top && v.bounds().centerY() <= backTag.bounds().bottom && v.bounds().left > backTag.bounds().right;
        }).isVisibleToUser(true).findOne();

        Common.log('zanTag', zanTag);
        let res = Common.click(zanTag, 0.2);
        Common.sleep(2000 + 1000 * Math.random());
        return res;
    },

    dislikeFirstComment() {
        let backTag = UiSelector().textContains('回复').className('android.widget.TextView').filter(v => {
            return v.text().indexOf('回复') == v.text().length - 2;
        }).findOne();

        let dislikeTag = UiSelector().className('android.widget.ImageView').filter(v => {
            return v.bounds().centerY() >= backTag.bounds().top && v.bounds().centerY() <= backTag.bounds().bottom && v.bounds().left >= backTag.bounds().right;
        }).isVisibleToUser(true).findOne();

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
        }).findOne();

        Gesture.press(backTag.bounds().left + backTag.bounds().width() * Math.random(), backTag.bounds().top - backTag.bounds().height() * Math.random(), 800);
        Common.sleep(4000 + 1000 * Math.random());
        let reportTag = UiSelector().text('举报').findOne();
        Common.click(reportTag, 0.2);
        Common.sleep(2000 + 1000 * Math.random());

        let tag = UiSelector().text(category).isVisibleToUser(true).findOne();
        if (!tag) {
            let scrollTag = UiSelector().scrollable(true).isVisibleToUser(true).findOne();
            scrollTag.scrollForward();
            Common.sleep(1000 + 1000 * Math.random());
            tag = UiSelector().text(category).isVisibleToUser(true).findOne();
        }
        Common.click(tag, 0.2);
        Common.sleep(3000 + 1000 * Math.random());

        let submitTag = UiSelector().text('提交').isVisibleToUser(true).findOne();
        let res = Common.click(submitTag, 0.2);
        Common.sleep(2000 + 1000 * Math.random());
        return res;
    }
}

module.exports = Comment;
