let params = require('../../common/params.js');
let logger = require('../../common/logger.js');

const Common = {
    _hidSkipUntil: 0,

    /** 同时写入脚本日志和诊断日志，方便区分 HID / 无障碍 */
    clickLog(message) {
        let line = String(message == null ? '' : message);
        try {
            Log.log(line);
        } catch (e) {}
        try {
            logger.info('click', line);
        } catch (e2) {}
    },

    /** 设置页「启用 HID」 */
    useHid() {
        try {
            return params.load().hidEnabled === true;
        } catch (e) {
            return false;
        }
    },

    ensureHidConnected() {
        if (!this.useHid()) {
            return false;
        }
        try {
            if (Hid.isConnected()) {
                return true;
            }
            let now = Date.now();
            if (now < (this._hidSkipUntil || 0)) {
                this.clickLog('HID 近期连接失败，本次改用无障碍');
                return false;
            }
            Hid.initBluetooth();
            if (!Hid.connectAndWait(true, 0, 5000)) {
                this._hidSkipUntil = now + 60000;
                this.clickLog('HID 连接失败，60 秒内改用无障碍');
                return false;
            }
            this._hidSkipUntil = 0;
            this.clickLog('HID 已连接：' + String(Hid.getName() || ''));
            return true;
        } catch (e) {
            this._hidSkipUntil = Date.now() + 60000;
            this.clickLog('HID 连接异常，改用无障碍：' + ((e && e.message) || e));
            return false;
        }
    },

    /**
     * 坐标点击：开启 HID 时 Hid.tap，否则 Gesture.click。
     */
    tapAt(x, y) {
        let xi = Math.round(Number(x) || 0);
        let yi = Math.round(Number(y) || 0);
        let w = Device.width();
        let h = Device.height();
        if (xi < 0 || yi < 0 || xi > w || yi > h) {
            this.clickLog('跳过点击，坐标不在屏内 x=' + xi + ' y=' + yi);
            return false;
        }
        if (this.useHid() && this.ensureHidConnected()) {
            this.clickLog('HID点击 x=' + xi + ' y=' + yi);
            try {
                Hid.tap(xi, yi);
                return true;
            } catch (e) {
                this.clickLog('HID点击失败，改用无障碍：' + ((e && e.message) || e));
            }
        }
        this.clickLog('无障碍点击 x=' + xi + ' y=' + yi);
        return Gesture.click(xi, yi);
    },

    /**
     * 输入：开启 HID 时先点中再 Hid.paste，否则 setText。
     */
    inputText(tag, text) {
        if (!tag) {
            return false;
        }
        let t = String(text == null ? '' : text);
        if (!t) {
            return true;
        }
        if (this.useHid() && this.ensureHidConnected()) {
            try {
                this.click(tag, 0.15);
                this.sleep(400);
                this.clickLog('HID粘贴 长度=' + t.length);
                Hid.paste(t);
                return true;
            } catch (e) {
                this.clickLog('HID粘贴失败，改用无障碍输入：' + ((e && e.message) || e));
            }
        }
        this.clickLog('无障碍输入 setText 长度=' + t.length);
        try {
            tag.setText(t);
            return true;
        } catch (e2) {
            this.clickLog('无障碍输入失败：' + ((e2 && e2.message) || e2));
            return false;
        }
    },

    /**
     * 坐标滑动：开启 HID 时 Hid.swipe，否则 Gesture.swipe。
     */
    swipeAt(x1, y1, x2, y2, duration) {
        let a = Math.round(Number(x1) || 0);
        let b = Math.round(Number(y1) || 0);
        let c = Math.round(Number(x2) || 0);
        let d = Math.round(Number(y2) || 0);
        let ms = Math.round(Number(duration) || 300);
        if (this.useHid() && this.ensureHidConnected()) {
            try {
                this.clickLog('HID滑动 (' + a + ',' + b + ')->(' + c + ',' + d + ')');
                Hid.swipe(a, b, c, d);
                return true;
            } catch (e) {
                this.clickLog('HID滑动失败，改用无障碍：' + ((e && e.message) || e));
            }
        }
        this.clickLog('无障碍滑动 (' + a + ',' + b + ')->(' + c + ',' + d + ')');
        return Gesture.swipe(a, b, c, d, ms);
    },

    /**
     * 通过ID获取控件
     * @param {string} name 
     * @returns Object
     */
    id(name) {
        return UiSelector().id(this.packageName() + ':id/' + name);
    },

    /**
     * 通过android:id获取控件
     * @param {string} name 
     * @returns Object
     */
    aId(name) {
        return UiSelector().id('android:id/' + name);
    },

    /**
     * 休眠
     * @param {number} time 
     */
    sleep(time) {
        this.log("js休眠时间：" + time);
        System.sleep(time);
    },

    clickRange(tag, top, bottom) {
        if (tag.bounds().top + tag.bounds().height() <= top) {
            return false;
        }

        if (tag.bounds().top >= bottom) {
            return false;
        }

        if (tag.bounds().top > top && tag.bounds().top + tag.bounds().height() < bottom) {
            this.click(tag);
            return true;
        }

        //卡在top的上下
        if (tag.bounds().top <= top && tag.bounds().top + tag.bounds().height() > top) {
            let topY = tag.bounds().top + tag.bounds().height() - top;
            this.tapAt(tag.bounds().left + tag.bounds().width() * Math.random(), (tag.bounds().top + 1) + (topY - 1) * Math.random());
            return true;
        }

        if (tag.bounds().top < bottom && tag.bounds().top + tag.bounds().height() >= bottom) {
            let topY = bottom - tag.bounds().top;
            this.tapAt(tag.bounds().left + tag.bounds().width() * Math.random(), tag.bounds().top + (topY - 1) * Math.random());
            return true;
        }
        return false;
    },

    /**
     * 获取包名
     * @returns string
     */
    packageName() {
        return 'com.ss.android.ugc.aweme';
    },

    /**
     * 返回主页
     * @returns boolean
     */
    backHome() {
        this.openApp();
        this.backHomeOnly();
        return true;
    },

    /**
     * 仅返回主页  需要简单模式下执行
     * @returns boolean
     */
    backHomeOnly() {
        let i = 0;
        while (i++ < 5) {
            let homeTag = UiSelector().text('首页').filter(v => {
                return v.parent().isVisibleToUser() && v.bounds().width() > 0;//滑动到用户页面，也能看到首页，但是width是负数
            }).findOne() || UiSelector().desc('首页，按钮').filter(v => {
                return v.parent().isVisibleToUser() && v.bounds().width() > 0;
            }).findOne();

            if (!homeTag) {
                this.log("没有找到homeTag，返回一次");
                this.back();
                this.sleep(1000);
                continue;
            }
            this.log("找到了homeTag");
            break;
        }
        return true;
    },

    /**
     * 点击控件
     * @param {UiObject} tag 
     * @param {number} rate 
     * @returns boolean
     */
    click(tag, rate = 0.05) {
        if (!rate) {
            rate = 0.05;
        }

        let p = 1 - rate * 2;
        let width = tag.bounds().width() * (rate + Math.random() * p);
        let height = tag.bounds().height() * (rate + Math.random() * p);

        try {
            return this.tapAt(tag.bounds().left + Math.floor(width), tag.bounds().top + Math.floor(height));
        } catch (e) {
            this.log(e);
            try {
                return this.tapAt(tag.bounds().left + Math.floor(width), tag.bounds().top + 1);
            } catch (e2) {
                this.log(e2);
                return false;
            }
        }
    },

    /**
     * 打开抖音
     * @returns {boolean}
     */
    openApp() {
        this.log('打开应用');
        App.launch(this.packageName());//打开抖音

        let i = 5;
        while (i-- > 0) {
            this.sleep(2000);
            let homeTag = UiSelector().text('首页').filter(v => {
                return v.parent().isVisibleToUser();
            }).findOne() || UiSelector().desc('首页，按钮').filter(v => {
                return v.parent().isVisibleToUser();
            }).findOne();

            if (homeTag) {
                this.log('进入应用');
                return true;
            }
        }

        this.log('进入应用');
        return true;
    },

    /**
     * 返回app
     */
    backApp() {
        App.backApp();
    },


    /**
     * 打印日志
     */
    log() {
        //这里需要做日志记录处理
        Log.log(arguments);
        console.log(arguments);
    },

    /**
     * 模拟返回操作
     * @param {number} [i] - 返回次数，默认 1 次
     * @param {number} [time] - 每次返回的间隔时间（毫秒），默认 700ms
     * @param {number} [randTime] - 随机波动时间范围（毫秒），传入后会生成 time + randTime * random() 的随机间隔
     */
    back(i, time, randTime) {
        if (i === undefined) {
            i = 1;
        }

        if (time == undefined) {
            time = 700;
        }

        this.log('返回次数： ' + i);
        while (i--) {
            if (this.useHid() && this.ensureHidConnected()) {
                try {
                    this.clickLog('HID返回');
                    Hid.back();
                } catch (e) {
                    this.clickLog('HID返回失败，改用无障碍');
                    Gesture.back();
                }
            } else {
                this.clickLog('无障碍返回');
                Gesture.back();
            }
            if (randTime) {
                this.sleep(time + randTime * Math.random());
                continue;
            }
            this.sleep(time);
        }
    },

    /**
     * 提取字符串中的数字
     * @param {string} content 
     * @returns {number}
     */
    numDeal(content) {
        let text = /[\d\.]+[\w|万]*/.exec(content);
        this.log('数字：', content, text);
        let num = 0;
        if (!text) {
            return num;
        }

        text[0] = text[0].replace(',', '').replace(',', '').replace(',', '');
        if (text[0].indexOf('w') !== -1 || text[0].indexOf('万') !== -1) {
            num = parseFloat(text[0].replace('w', '').replace('万', '')) * 10000;
        } else {
            num = parseInt(text[0]);
        }

        this.log('数字：', num);
        return num;//可能存在多个逗号
    },

    /**
     * 向上滑或者下滑 【这个方法稳定性可能不太好，不太推荐使用】
     * @param {number} type 0表示向上滑
     * @param {number} sensitivity 
     * @param {number} rate 
     * @returns 
     */
    swipe(type = 0, sensitivity = 1, rate = 12) {
        const width = Device.width();
        const height = Device.height();

        // 横坐标随机化，避免死板
        const x = width * (0.3 + Math.random() * 0.4); // 30%~70%屏幕宽

        // rate 控制滑动距离，避免原来的 1/rate 逻辑不直观
        const distance = height / rate;

        let startY, endY;

        if (type === 0) { // 向上滑动
            startY = height * 0.7 * sensitivity + height * 0.1 * Math.random(); // 底部偏移
            endY = startY - distance;
            if (endY < 0) endY = 0;
        } else if (type === 1) { // 向下滑动
            startY = height * 0.3 * sensitivity + height * 0.1 * Math.random(); // 顶部偏移
            endY = startY + distance;
            if (endY > height) endY = height;
        } else {
            console.warn("swipe: type 只能是 0（上）或 1（下）");
            return false;
        }

        // duration 随机化，200~300ms 左右
        const duration = 200 + 100 * Math.random();
        return this.swipeAt(x, startY, x, endY, duration);
    },

    /**
     * 滑动搜索用户列表
     * @param {boolean} [filterRootLayout] - 是否过滤掉根布局，默认为 false
     * @returns {boolean}  默认用户页面
     */
    swipeSearchUserOp(filterRootLayout = false) {
        let tag = UiSelector().className('androidx.recyclerview.widget.RecyclerView').scrollable(true).filter(v => {
            if (filterRootLayout) {
                return !!v.children().findOne(UiSelector().id('com.ss.android.ugc.aweme:id/root_layout').isVisibleToUser(true));
            }
            return true;
        }).isVisibleToUser(true).findOne();
        if (!tag) {
            this.log('滑动失败，可能是没有滚动的时候');//比如评论比较少的时候，就没有滚动条
            return false;
        }

        if (tag.scrollForward()) {
            this.log('滑动成功');
            return true;
        }
        this.log('滑动到底了');
        return false;
    },

    /**
     * 滑动粉丝列表
     * @returns {boolean}
     */
    swipeFansListOp() {
        return this.swipeSearchUserOp(true);
    },

    /**
     * 滑动关注列表
     * @returns {boolean}
     */
    swipeFocusListOp() {
        return this.swipeSearchUserOp(true);
    },

    /**
     * 滑动评论列表
     * @param isNew {boolean}
     * @returns {boolean}
     */
    swipeCommentListOp(isNew) {
        if (isNew) {
            let tag = UiSelector().className('android.view.View').scrollable(true).isVisibleToUser(true).findOne();
            Log.log('评论区滑动tag', tag);
            if (!tag) {
                return false;
            }
            return tag.scrollForward();
        }
        return this.swipeSearchUserOp();
    },

    /**
     * 搜索列表滑动到左侧
     * @returns {boolean}
     */
    swipeSearchTabToLeft() {
        let tag = UiSelector().scrollable(true).className('android.widget.HorizontalScrollView').isVisibleToUser(true).findOne();
        if (!tag) {
            this.log('滑动失败');
            return false;
        }
        if (tag.scrollForward()) {
            this.log('滑动成功');
            return true;
        }
        this.log('滑动失败');
        return false;
    },

    /**
     * 粉丝群列表滑动
     * @returns {boolean}
     */
    swipeFansGroupListOp() {
        return this.swipeSearchUserOp();
    },

    /**
     * 消息列表滑动
     * @param type {boolean}
     * @returns {boolean}
     */
    swipeMessageList(type) {
        let tag = UiSelector().className('androidx.recyclerview.widget.RecyclerView').scrollable(true).filter(v => {
            return v.bounds().height() > Device.height() / 2;
        }).isVisibleToUser(true).findOne();
        if (type == true) {
            return tag.scrollBackward();
        }
        return tag.scrollForward();
    },

    /**
     * 互动消息列表滑动
     * @returns {boolean}
     */
    swipeMessageDetailsList() {
        return this.swipeSearchUserOp();
    },

    /**
    * 作品赞列表滑动
    * @returns {boolean}
    */
    swipeWorkZanList() {
        return this.swipeSearchUserOp();
    },

    /**
     * 关闭弹窗
     * @param [type] {number}
     */
    closeAlert(type) {
        if (!type) {
            return;
        }

        this.log('开启线程监听弹窗');
        let f = function (v) {
            return v && v.bounds() && v.bounds().top > Device.height() / 5 && v.bounds().top + v.bounds().height() < Device.height() * 0.8 && v.bounds().left > Device.width() / 10 && v.bounds().left + v.bounds().width() < Device.width() * 0.9;//只有在中间的位置才是弹窗
        }

        try {
            let cancelTexts = ['不再提醒', '稍后', '以后再说', '我知道了', '直接退出', '不多', '下次再说', '满意', '不感兴趣', '好的', '确定', '取消', '拒绝', '关闭', '暂不隔开', '忽略本次', '暂不使用'];
            for (let i = 0; i < cancelTexts.length; i++) {
                let cancelTag = UiSelector().text(cancelTexts[i]).clickable(true).filter(f).isVisibleToUser(true).findOne();
                if (cancelTag) {
                    this.click(cancelTag);
                    this.log('点击了取消按钮', cancelTag);
                    return;
                }
            }
        } catch (e) {
            this.log("close dialog 异常了");
            this.log(e);
        }
    },

    /**
     * 执行方法后修复
     * @param {function} func
     * @param {number} time
     * @param {number} [randomTime]
     */
    sleepFunc(func, time, randomTime) {
        if (!randomTime) {
            randomTime = 0;
        }
        func();
        this.sleep(time + randomTime * Math.random());
    },

    /**
     * 显示提示
     * @param {string} msg
     */
    showToast(msg) {
        FloatDialogs.toast(msg);
        this.log(msg);
    },

    /**
     * 切分关键词
     * @param {string} keyword
     */
    splitKeyword(keyword) {
        keyword = keyword.replace(/，/g, ',');
        let keywords = keyword.split(',');
        let ks = [];
        for (let i in keywords) {
            if (keywords[i] === '') {
                continue;
            }

            ks.push(keywords[i]);
        }
        return ks;
    },

    /**
     * 检测标题是否包含关键词
     * @param {string} contain
     * @param {string} title
     * @returns {Array<string>|null}
     */
    containsWord(contain, title) {
        let contains = this.splitKeyword(contain);
        for (let con of contains) {
            if (typeof (con) === 'string' && title.indexOf(con) !== -1) {
                return [con];
            }
        }
        return null;
    },

    /**
     * 判断是否有备注
     * @param {string} remark
     * @returns {boolean}
     */
    getRemark(remark) {
        return remark.indexOf('#') == 0 || remark.indexOf('＃') == 0;
    },

    /**
     * 提取链接
     * @param {string} text
     * @returns {Array<string>}
     */
    extractUrls(text) {
        if (!text) {
            return [];
        }

        let urls = [];

        // 按行拆分
        let lines = text.split(/\r?\n/);

        // http/https链接
        let urlRegex = /https?:\/\/[^\s]+/g;

        for (let line of lines) {
            let matches = line.match(urlRegex);
            if (matches) {
                for (let m of matches) {
                    urls.push(m);
                }
            }
        }

        return urls;
    }
}

module.exports = Common;
