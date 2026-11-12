let params = require('../../common/params.js');
let logger = require('../../common/logger.js');

let Common = {
    //封装的方法
    logs: [],
    id(name) {
        return UiSelector().id('com.xingin.xhs:id/' + name);
    },

    _hidSkipUntil: 0,

    /**
     * 动作日志：诊断文件 + 控制台都写。
     * Log.log 只进 Deeke 日志文件，不出现在控制台。
     */
    actLog(message) {
        let text = String(message == null ? '' : message);
        try {
            logger.info('act', text);
        } catch (e) {
            try {
                console.log(text);
            } catch (e2) {}
        }
    },

    /** 设置页「启用 HID」开关 */
    useHid() {
        try {
            return params.load().hidEnabled === true;
        } catch (e) {
            return false;
        }
    },

    /**
     * 控件是否真正可点：对用户可见，且中心点在屏幕内。
     * 不可见时点坐标容易点到别的地方。
     */
    isOnScreen(tag) {
        try {
            if (!tag) {
                return false;
            }
            if (tag.isVisibleToUser && !tag.isVisibleToUser()) {
                return false;
            }
            let b = tag.bounds();
            if (!b || b.width() <= 1 || b.height() <= 1) {
                return false;
            }
            let w = Device.width();
            let h = Device.height();
            let cx = b.centerX();
            let cy = b.centerY();
            if (cx < 2 || cy < 2 || cx > w - 2 || cy > h - 2) {
                return false;
            }
            if (b.bottom <= 0 || b.top >= h || b.right <= 0 || b.left >= w) {
                return false;
            }
            return true;
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
                this.actLog('[无障碍] 近期 HID 连接失败，点击和输入改走无障碍');
                return false;
            }
            Hid.initBluetooth();
            // 短超时，避免每次点击卡几十秒
            if (!Hid.connectAndWait(true, 0, 5000)) {
                this._hidSkipUntil = now + 60000;
                this.actLog('[无障碍] HID 连接失败，60 秒内点击和输入改走无障碍');
                return false;
            }
            this._hidSkipUntil = 0;
            this.actLog('[HID点击] 已连接：' + String(Hid.getName() || ''));
            return true;
        } catch (e) {
            this._hidSkipUntil = Date.now() + 60000;
            this.actLog('[HID点击] 连接异常：' + ((e && e.message) || e));
            return false;
        }
    },

    /**
     * 统一点击：开启 HID 且已连接时用 Hid.tap，否则 Gesture.click（无障碍）。
     * 每次点击打 [HID点击] 或 [无障碍点击]。
     */
    tapAt(x, y) {
        let xi = Math.round(Number(x) || 0);
        let yi = Math.round(Number(y) || 0);
        let w = Device.width();
        let h = Device.height();
        if (xi < 0 || yi < 0 || xi > w || yi > h) {
            this.actLog('[跳过点击] 坐标不在屏内 x=' + xi + ' y=' + yi);
            return false;
        }
        if (this.useHid() && this.ensureHidConnected()) {
            try {
                this.actLog('[HID点击] x=' + xi + ' y=' + yi);
                Hid.tap(xi, yi);
                return true;
            } catch (e) {
                this.actLog('[无障碍点击] HID 异常回退 x=' + xi + ' y=' + yi + ' ' + ((e && e.message) || e));
                Gesture.click(xi, yi);
                return false;
            }
        }
        this.actLog('[无障碍点击] x=' + xi + ' y=' + yi);
        Gesture.click(xi, yi);
        return true;
    },

    aId(name) {
        //android:id/text1
        return UiSelector().id('android:id/' + name);
    },

    sleep(time) {
        time > 200 ? Log.log("js休眠时间：" + time) : null;
        System.sleep(time);
    },

    packageName() {
        return 'com.xingin.xhs';
    },

    /**
     * 
     * @param {string} str 
     * @returns 
     */
    getUrl(str) {
        return str.match(/https?:\/\/[^\s]+/g) || [];
    },

    /**
     * 
     * @param {string} url 
     * @returns 
     */
    getXhsUserId(url) {
        if (!url) {
            return null;
        }

        var match = String(url).match(/\/user\/profile\/([a-zA-Z0-9]+)/);

        return match ? match[1] : null;
    },

    /**
     * 
     * @param {string} url 
     * @returns 
     */
    getXhsNoteId(url) {
        if (!url) {
            return null;
        }

        var match = String(url).match(/\/item\/([a-zA-Z0-9]+)/);

        return match ? match[1] : null;
    },

    /**
     * 
     * @param {string} url 
     * @returns 
     */
    getXhsNoteCommentId(url) {
        //anchorCommentId=6a85df59000000000a01f788&
        if (!url) {
            return null;
        }

        var match = String(url).match(/anchorCommentId=([a-zA-Z0-9]+)/);
        return match ? match[1] : null;
    },

    /**
     * 
     * @param {string} url 
     * @returns 
     */
    getXhsRoomId(url) {
        if (!url) {
            return null;
        }

        let match = String(url).match(/livestream\/[a-zA-Z0-9]+\/([a-zA-Z0-9]+)/);
        return match ? match[1] : null;
    },

    backHome() {
        this.openApp();
        let i = 0;
        while (i++ < 5) {
            let homeTag = UiSelector().className('android.widget.ImageView').desc('菜单').isVisibleToUser(true).findOnce();
            if (!homeTag) {
                this.back();
                this.sleep(2000);
                continue;
            }
            Log.log("找到了homeTag");
            break;
        }
        return true;
    },

    backHomeOnly() {
        let i = 0;
        while (i++ < 5) {
            let homeTag = UiSelector().className('android.widget.ImageView').desc('菜单').isVisibleToUser(true).findOnce();
            if (!homeTag) {
                Log.log(UiSelector().className('android.widget.ImageView').desc('菜单').findOnce());
                this.back();
                this.sleep(1000);
                continue;
            }
            Log.log("找到了homeTag");
            break;
        }
        return true;
    },

    click(tag, rate) {
        if (!this.isOnScreen(tag)) {
            this.actLog('[跳过点击] 控件不可见或不在屏内');
            return false;
        }
        if (!rate) {
            rate = 0.05;
        }

        let p = 1 - rate * 2;
        let width = tag.bounds().width() * rate + Math.random() * (tag.bounds().width() * p);
        let height = tag.bounds().height() * rate + Math.random() * (tag.bounds().height() * p);
        let x = tag.bounds().left + Math.round(width);
        let y = tag.bounds().top + Math.round(height);

        try {
            if (!this.tapAt(x, y)) {
                return false;
            }
        } catch (e) {
            this.log(e);
            try {
                if (!this.tapAt(tag.bounds().left + Math.round(width), tag.bounds().top)) {
                    return false;
                }
            } catch (e2) {
                this.log(e2);
                return false;
            }
        }

        this.sleep(500);
        return true;
    },

    gClick(x, y) {
        this.tapAt(x, y);
    },

    /**
     * 统一输入：开启 HID 且已连接时 Hid.paste，否则无障碍 setText。
     * 每次输入打 [HID输入] 或 [无障碍输入]。
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
                try {
                    if (!tag.isFocused || !tag.isFocused()) {
                        this.click(tag, 0.15);
                        this.sleep(500 + 300 * Math.random());
                    }
                } catch (eFocus) {
                    this.click(tag, 0.15);
                    this.sleep(500);
                }
                this.actLog('[HID输入] 粘贴 长度=' + t.length);
                Hid.paste(t);
                return true;
            } catch (e) {
                this.actLog('[无障碍输入] HID 粘贴异常，改 setText：' + ((e && e.message) || e));
            }
        }
        try {
            this.actLog('[无障碍输入] setText 长度=' + t.length);
            tag.setText(t);
            return true;
        } catch (e2) {
            this.actLog('[无障碍输入] setText 失败：' + ((e2 && e2.message) || e2));
            return false;
        }
    },

    /**
     * 坐标滑动：开启 HID 时用 Hid.swipe，否则 Gesture.swipe。
     * （勿与下方 swipe(type, sensitivity) 混淆）
     */
    swipeAt(x1, y1, x2, y2, duration) {
        let a = Math.round(Number(x1) || 0);
        let b = Math.round(Number(y1) || 0);
        let c = Math.round(Number(x2) || 0);
        let d = Math.round(Number(y2) || 0);
        let ms = Math.round(Number(duration) || 300);
        if (this.useHid() && this.ensureHidConnected()) {
            try {
                // swipex 时长不能砍太狠：ms/4 时视频流经常滑不动
                let hidMs = Math.max(120, Math.floor(ms * 0.85));
                this.actLog('[HID滑动] (' + a + ',' + b + ')->(' + c + ',' + d + ') ms=' + hidMs);
                if (typeof Hid.swipex === 'function') {
                    Hid.swipex(a, b, c, d, hidMs);
                } else {
                    Hid.swipe(a, b, c, d);
                }
                return true;
            } catch (e) {
                this.actLog('[无障碍滑动] HID 异常回退 (' + a + ',' + b + ')->(' + c + ',' + d + ') ' + ((e && e.message) || e));
            }
        }
        this.actLog('[无障碍滑动] (' + a + ',' + b + ')->(' + c + ',' + d + ')');
        Gesture.swipe(a, b, c, d, ms);
        return true;
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
            this.gClick(tag.bounds().left + tag.bounds().width() * Math.random(), (tag.bounds().top + 1) + (topY - 1) * Math.random());
            return true;
        }

        if (tag.bounds().top < bottom && tag.bounds().top + tag.bounds().height() >= bottom) {
            let topY = bottom - tag.bounds().top;
            this.gClick(tag.bounds().left + tag.bounds().width() * Math.random(), tag.bounds().top + (topY - 1) * Math.random());
            return true;
        }
        return false;
    },

    openApp() {
        App.launch('com.xingin.xhs');//打开app
        this.sleep(8000);
    },

    backApp() {
        App.backApp();
    },


    log() {
        //这里需要做日志记录处理
        Log.log(arguments);
    },

    back(i, time, randTime) {
        if (i === undefined) {
            i = 1;
        }
        while (i--) {
            Gesture.back();
            if (!time) {
                this.sleep(700 + Math.random() * 200);
                continue;
            }

            if (randTime) {
                this.sleep(time + randTime * Math.random());
                continue;
            }
            this.sleep(time);
        }
        this.log('back ' + i);
    },

    numDeal(text) {
        text = /[\d\.]+[\w|万]*/.exec(text);
        if (!text) {
            return 0;
        }

        if (text[0].indexOf('w') !== -1 || text[0].indexOf('W') !== -1 || text[0].indexOf('万') !== -1) {
            text[0] = text[0].replace('w', '').replace('W', '').replace('万', '') * 10000;
        }
        return text[0] * 1;
    },

    swipe(type, sensitivity) {
        let left = Math.random() * Device.width() * 0.8 + Device.width() * 0.2;
        let bottom = Device.height() * 2 / 3 * sensitivity + Device.height() / 6 * Math.random();
        let top = Device.height() / 12 + Device.height() / 12 * Math.random();
        if (!type) {
            this.swipeAt(left, bottom, left, top, 200 + 100 * Math.random());//从下往上推，清除
            return true;
        }
        this.swipeAt(left, top, left, bottom, 200 + 100 * Math.random());//从上往下滑
    },

    swipeRecommendListOp() {
        this.swipeFansListOpTarge = UiSelector().scrollable(true).isVisibleToUser(true).filter(v => {
            return v.className() == 'androidx.recyclerview.widget.RecyclerView' && v.id() != null;
        }).findOne();

        if (this.swipeFansListOpTarge) {
            this.swipeFansListOpTarge.scrollForward();
        } else {
            Log.log('滑动失败');
        }
        //Log.log(this.swipeFansListOpTarge);
    },


    swipeFansListOp() {
        this.swipeFansListOpTarge = UiSelector().scrollable(true).isVisibleToUser(true).filter(v => {
            return v.className() == 'androidx.recyclerview.widget.RecyclerView' && v.id() != null;
        }).findOne();

        if (this.swipeFansListOpTarge) {
            this.swipeFansListOpTarge.scrollForward();
        } else {
            Log.log('滑动失败');
        }
        //Log.log(this.swipeFansListOpTarge);
    },

    swipeSearchWorkResultOp() {
        let tag = UiSelector().scrollable(true).isVisibleToUser(true).filter(v => {
            return v.className() == 'androidx.recyclerview.widget.RecyclerView' && v.id() != null;
        }).findOne();

        return tag.scrollForward();
    },

    //滑动用户作品列表
    swipeWorksOp() {
        let swipe = UiSelector().scrollable(true).isVisibleToUser(true).filter(v => {
            return v.className() == 'androidx.recyclerview.widget.RecyclerView' && v.id() != null;
        }).findOne();

        if (swipe) {
            return swipe.scrollForward();
        } else {
            Common.log('滑动失败');
        }
        return false;
    },

    swipeFocusListOp() {
        this.swipeFocusListOpTarge = UiSelector().scrollable(true).isVisibleToUser(true).filter(v => {
            return v.className() == 'androidx.recyclerview.widget.RecyclerView' && v.id() != null;
        }).findOne();
        if (this.swipeFocusListOpTarge) {
            this.swipeFocusListOpTarge.scrollForward();
        } else {
            Log.log('滑动失败');
        }
    },

    //搜索的图文列表滑动
    swipeWorkOp() {
        let tag = UiSelector().scrollable(true).isVisibleToUser(true).filter(v => {
            return v.className() == 'androidx.recyclerview.widget.RecyclerView';
        }).findOne();
        if (tag) {
            return tag.scrollForward();
        } else {
            Log.log('滑动失败');
        }
        return false;
    },


    //关闭弹窗
    closeAlert(type) {
        if (type == undefined) {
            type = 0;
        }

        this.log('开启线程监听弹窗');

        while (true) {
            //检测是否只有当前的线程，是的话则关闭
            try {
                let a = this.id('aj3').textContains('稍后再说').isVisibleToUser(true).findOne();//免流量升级
                if (a) {
                    a.click();
                    Log.log(a);
                    Log.log("可能的弹窗点击了");
                }

                this.sleep(200);
            } catch (e) {
                this.log("close dialog 异常了");
                this.log(e);
            }

            if (type) {
                break;
            }
        }
    },

    sleepFunc(func, time, randomTime) {
        if (!randomTime) {
            randomTime = 0;
        }
        func();
        this.sleep(time + randomTime * Math.random());
    },

    toast(msg, time, randomTime) {
        if (!randomTime) {
            randomTime = 0;
        }

        //toast(msg);
        this.log(msg);
        if (time) {
            this.sleep(time + randomTime * Math.random());
        }
    },

    showToast(msg) {
        System.toast(msg);
        Log.log(msg);
    },

    //关键词拆分
    splitKeyword(keyword) {
        keyword = keyword.replace(/，/g, ',');
        keyword = keyword.split(',');
        let ks = [];
        for (let i in keyword) {
            if (keyword[i] === '') {
                continue;
            }

            let tmp = keyword[i];
            if (keyword[i].indexOf('&') !== -1) {
                tmp = keyword[i].split('&');
            } else if (keyword[i].indexOf('+') !== -1) {
                tmp = keyword[i].split('+');
            }
            ks.push(tmp);
        }
        return ks;
    },

    containsWord(contain, title) {
        contain = this.splitKeyword(contain);
        for (let con of contain) {
            if (typeof (con) === 'string' && title.indexOf(con) !== -1) {
                return [con];
            }

            if (typeof (con) === 'object') {
                let _true = true;
                for (let i in con) {
                    if (title.indexOf(con[i]) === -1) {
                        _true = false;
                    }
                }
                if (_true) {
                    return con;
                }
            }
        }
        return false;
    },

    rgbToColorName(rgbaStr) {
        // 解析 rgba
        const match = rgbaStr.match(/rgba?\(([^)]+)\)/i);
        if (!match) return "其他";

        const parts = match[1].split(",").map(s => parseFloat(s.trim()));
        const [r, g, b] = parts;

        // 转 HSL
        const { h, s, l } = this.rgbToHsl(r, g, b);

        // ===== 先判断黑白灰 =====
        if (l <= 0.08) return "黑";
        if (l >= 0.92) return "白";
        if (s <= 0.1) return "灰";

        // ===== 再判断色相 =====
        if ((h >= 0 && h < 30) || (h >= 330 && h <= 360)) return "红";
        if (h >= 30 && h < 70) return "黄";
        if (h >= 70 && h < 170) return "绿";
        if (h >= 170 && h < 260) return "蓝";

        return "其他";
    },

    // RGB 转 HSL
    rgbToHsl(r, g, b) {
        r /= 255;
        g /= 255;
        b /= 255;

        const max = Math.max(r, g, b);
        const min = Math.min(r, g, b);
        let h, s;
        const l = (max + min) / 2;

        if (max === min) {
            h = s = 0;
        } else {
            const d = max - min;
            s = l > 0.5 ? d / (2 - max - min) : d / (max + min);

            switch (max) {
                case r:
                    h = (g - b) / d + (g < b ? 6 : 0);
                    break;
                case g:
                    h = (b - r) / d + 2;
                    break;
                case b:
                    h = (r - g) / d + 4;
                    break;
            }
            h *= 60;
        }

        return {
            h: h || 0,
            s: s || 0,
            l: l || 0
        };
    },

    /**
     * 
     * @param {string} photoInput 
     * @param {UiObject} addImageTag
     */
    photoInput(photoInput, addImageTag) {
        let file = Files.getCachePath() + '/1.png';
        let res = Http.download(photoInput, file, {});
        Common.log('下载图片', res);
        let deleteFile = MediaStore.saveImage(file);//文件移动到相册
        Common.log('保存的图片', deleteFile);
        Common.sleep(3000);
        Common.click(addImageTag, 0.2);
        Common.sleep(2000 + 1000 * Math.random());

        let allowTag = UiSelector().text('允许').isVisibleToUser(true).findOne();
        if (allowTag) {
            Common.click(allowTag, 0.2);
            Common.sleep(2000 + 1000 * Math.random());
        }

        let selectPhotoCheckTag = UiSelector().className('android.widget.TextView').isVisibleToUser(true).filter(v => {
            return !v.text();
        }).findOne();
        Common.click(selectPhotoCheckTag, 0.2);
        Common.log('选择图片');
        System.sleep(3000 + 1000 * Math.random());

        let btnTag = UiSelector().text('发送').isVisibleToUser(true).findOne();
        if (!btnTag) {
            Common.log('没有找到完成按钮， 重试');
            Common.sleep(3000);
            btnTag = UiSelector().text('发送').isVisibleToUser(true).findOne();
        }

        console.log('点击完成按钮');
        Common.click(btnTag, 0.2);

        System.sleep(3000 + 2000 * Math.random());
        if (deleteFile) {
            MediaStore.deleteImage(deleteFile);
        }
    },

    getDateTime() {
        const d = new Date();

        const pad = (n) => n.toString().padStart(2, '0');

        const year = d.getFullYear();
        const month = pad(d.getMonth() + 1);
        const day = pad(d.getDate());

        const hour = pad(d.getHours());
        const minute = pad(d.getMinutes());
        const second = pad(d.getSeconds());

        return `${year}-${month}-${day} ${hour}:${minute}:${second}`;
    }
}

module.exports = Common;
