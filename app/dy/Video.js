let Common = require('./Common.js');

const Video = {
    next() {
        let w = Device.width();
        let h = Device.height();
        let x = w * (0.45 + Math.random() * 0.1);
        let startY = h * (0.80 + Math.random() * 0.05);
        let endY = h * (0.20 + Math.random() * 0.05);
        let duration = 250 + Math.random() * 150;
        return Gesture.swipe(x, startY, x, endY, duration);
    },

    getCommentTag() {
        let tag = UiSelector().className('android.widget.LinearLayout').descContains('评论').clickable(true).isVisibleToUser(true).findOne();
        Log.log("评论标签：：：", tag.desc(), tag);
        if (tag) {
            return tag;
        }
        throw new Error('没有找到评论标签');
    },

    getCommentCount() {
        let comment = this.getCommentTag();
        return Common.numDeal(comment.desc());
    },

    openComment(type) {
        let comment = this.getCommentTag();
        let res = comment.click();
        if (type) {
            Common.sleep(2000 + 1500 * Math.random());
        } else {
            Common.sleep(2000 + 1000 * Math.random());
            Common.back();
        }
        return res;
    },

    getContentTag() {
        let tag = Common.id('desc').isVisibleToUser(true).findOne();
        if (tag) {
            console.log("视频标题内容：", tag);
            return tag;
        }
        return false;
    },

    getContent() {
        let tag = this.getContentTag();
        return tag ? tag.text() : '';
    },

    isLiving() {
        if (UiSelector().text('点击进入直播间').isVisibleToUser(true).findOne()) {
            return true;
        }
        console.log("直播1检测完成");
        let tag = UiSelector().descContains('直播中').filter((v) => {
            return v && v.bounds() && v.bounds().top > Device.height() / 7 && v.bounds().top < Device.height() * 0.7 && v.bounds().left > Device.width() * 0.8;
        }).isVisibleToUser(true).exists();
        console.log("直播2检测完成");
        return tag ? true : false;
    }
};

module.exports = Video;
