let Common = require('./Common.js');

const Index = {
    intoSearchPage() {
        let searchTag = UiSelector().desc('搜索').isVisibleToUser(true).findOne();
        Log.log(searchTag);
        if (!searchTag) {
            Log.log('找不到搜索框，无法进入搜索页');
            let tag = UiSelector().text('推荐').findOne().parent();
            console.log(tag);
            let res = Gesture.click(tag.bounds().right + tag.bounds().width() / 2, tag.bounds().centerY());
            Common.sleep(2000 + 1000 * Math.random());
            return res;
        }

        let res = searchTag.click();
        Common.sleep(2000 + 1000 * Math.random());
        return res;
    }
};

module.exports = Index;
