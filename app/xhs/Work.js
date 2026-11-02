let Common = require("app/xhs/Common.js");
let statistics = require("common/statistics.js");
let XhsComment = require("app/xhs/Comment.js");

let Work = {
    getCommentTag() {
        return UiSelector().className('android.widget.Button').descContains('评论').isVisibleToUser(true).findOne();
    },

    zan() {
        if (this.isZan()) {
            Common.log('已点赞');
            return true;
        }

        let zanTag = UiSelector().className('android.widget.Button').descContains('点赞').isVisibleToUser(true).findOne();
        if (zanTag) {
            Common.click(zanTag, 0.2);
            statistics.zan();
            Common.log('点赞成功', zanTag);
            Common.sleep(1000);
            return true;
        }

        let collectTag = UiSelector().descContains('收藏').className('android.widget.Button').isVisibleToUser(true).findOne();
        if (!collectTag) {
            Common.log('广告，没有点赞，收藏');
            return false;
        }

        zanTag = UiSelector().className('android.widget.LinearLayout').filter(v => {
            return Math.abs(v.bounds().top - collectTag.bounds().top) <= 5 && Math.abs(v.bounds().right - collectTag.bounds().left) <= 5;
        }).clickable(true).isVisibleToUser(true).findOne();
        statistics.zan();
        Common.click(zanTag, 0.2);
        Common.log('点赞成功', zanTag);
        return true;
    },

    isZan() {
        //图文
        let zanTag = UiSelector().className('android.widget.Button').descContains('点赞').isVisibleToUser(true).findOne();
        if (zanTag && zanTag.desc().indexOf('已点赞') !== -1) {
            return true;
        }

        if (zanTag && zanTag.desc().indexOf('已点赞') == -1) {
            return false;
        }

        //视频
        let collectTag = UiSelector().descContains('收藏').className('android.widget.Button').isVisibleToUser(true).findOne();
        if (!collectTag) {
            Common.log('广告，没有点赞，收藏');
            return false;
        }

        zanTag = UiSelector().className('android.widget.LinearLayout').filter(v => {
            return Math.abs(v.bounds().top - collectTag.bounds().top) <= 5 && Math.abs(v.bounds().right - collectTag.bounds().left) <= 5;
        }).clickable(true).isVisibleToUser(true).findOne();

        let image = Images.capture();
        let color = Images.getColor(image, zanTag.bounds().left + collectTag.bounds().width() / 4, zanTag.bounds().centerY());
        console.log(Common.rgbToColorName(color));
        return color == '红';
    },

    getCollectTag() {
        return UiSelector().className('android.widget.Button').descContains('收藏').isVisibleToUser(true).findOne();
    },

    collect() {
        if (this.isCollect()) {
            Log.log('已经点过赞了');
            return true;
        }

        let collectTag = this.getCollectTag();
        if (collectTag) {
            let res = Common.click(collectTag);
            Log.log('点赞成功');
            return true;
        }
    },

    isCollect() {
        return UiSelector().className('android.widget.Button').descContains('已收藏').isVisibleToUser(true).findOne();
    },

    zanUserListSwipe() {
        let tag = UiSelector().scrollable(true).isVisibleToUser(true).filter(v => {
            console.log(v.id());
            return v.className() == 'androidx.recyclerview.widget.RecyclerView' && v.id() != null;
        }).findOne();

        if (tag) {
            tag.scrollForward();
            return true;
        }
        return false;
    },

    getCommentCount(type) {
        let tag = this.getCommentTag();
        return Common.numDeal(tag ? tag.desc() : 0);//部分企业类图文没有评论标识，直接过滤（比如：有巢公寓武汉青年城）
    },

    /** 找已弹出的可编辑评论框 */
    findEditableInput() {
        return UiSelector().className('android.widget.EditText').filter(function (v) {
            return v && (v.isFocused() || v.isEditable());
        }).isVisibleToUser(true).findOne() ||
            UiSelector().className('android.widget.EditText').isVisibleToUser(true).findOne();
    },

    /**
     * 输入框下方工具栏：取第二个 android.widget.ImageView（加图入口）。
     */
    findAddImageBelowInput(iptTag) {
        let bottom = 0;
        try {
            if (iptTag && iptTag.bounds) {
                bottom = iptTag.bounds().bottom;
            }
        } catch (e) {}

        let images = UiSelector().className('android.widget.ImageView').isVisibleToUser(true).filter(function (v) {
            try {
                return v.bounds().top >= bottom - 8;
            } catch (e2) {
                return false;
            }
        }).find();
        if (!images || !images.length) {
            return null;
        }

        let arr = [];
        for (let i = 0; i < images.length; i++) {
            arr.push(images[i]);
        }
        arr.sort(function (a, b) {
            let dy = a.bounds().top - b.bounds().top;
            if (Math.abs(dy) > 24) {
                return dy;
            }
            return a.bounds().left - b.bounds().left;
        });

        // 只取输入框正下方一排（约 280px 内）
        let row = [];
        for (let j = 0; j < arr.length; j++) {
            if (arr[j].bounds().top <= bottom + 280) {
                row.push(arr[j]);
            }
        }
        if (row.length >= 2) {
            return row[1];
        }
        return arr.length >= 2 ? arr[1] : null;
    },

    /**
     * 往已弹出的输入框填内容：HID 用粘贴，否则 setText；可带图后点发送。
     * 回复场景点完「回复」后输入框已在，不要再去找「说点什么」。
     */
    fillCommentInput(msg, imagePath) {
        let gallery = require('common/gallery.js');
        let text = String(msg || '').trim();
        let image = String(imagePath || '').trim();

        let iptTag = this.findEditableInput();
        if (text) {
            if (!iptTag) {
                Log.log('没有找到可输入的评论框');
                return false;
            }
            Common.inputText(iptTag, text);
            Common.sleep(1500 + 500 * Math.random());
        }

        if (image) {
            Log.log('评论配图准备入库：' + image);
            let stagedUri = gallery.stageLocalImage(image);
            if (!stagedUri) {
                Log.log('评论配图入库失败，跳过选图');
            } else {
                Common.sleep(800);
                if (!iptTag) {
                    iptTag = this.findEditableInput();
                }
                let addImageTag = this.findAddImageBelowInput(iptTag);
                if (addImageTag) {
                    Log.log('点击输入框下方第 2 个 ImageView 加图');
                    gallery.pickFirstStaged(addImageTag);
                } else {
                    Log.log('评论框未找到加图 ImageView（输入框下第 2 个）');
                }
            }
        }

        if (!text && !image) {
            return false;
        }

        let sendTag = UiSelector().className('android.widget.TextView').text('发送').isVisibleToUser(true).findOne();
        if (!sendTag) {
            Log.log('没有找到发送按钮');
            gallery.deleteLastStaged();
            return false;
        }

        let res = Common.click(sendTag, 0.2);
        statistics.comment();
        Log.log('发送了');
        // 配图可能较大，发完立刻删相册临时文件会导致发送失败/丢图
        if (image) {
            Common.sleep(3000 + 500 * Math.random());
        } else {
            Common.sleep(500 + 500 * Math.random());
        }
        gallery.deleteLastStaged();
        return res;
    },

    /** 一级评论：先点「说点什么」打开输入框，再填内容 */
    msg(type, msg, imagePath) {
        let inputTag = UiSelector().textContains('说点什么').className('android.widget.TextView').findOne() ||
            UiSelector().className('android.widget.TextView').desc('评论框').findOne();

        if (!inputTag) {
            // 输入框可能已经打开
            if (this.findEditableInput()) {
                return this.fillCommentInput(msg, imagePath);
            }
            Log.log('没有找到输入框');
            return false;
        }

        Common.click(inputTag, 0.15);
        Common.sleep(1500 + 1000 * Math.random());
        return this.fillCommentInput(msg, imagePath);
    },

    /**
     * 回复某条评论（可带图）。点「回复」后键盘/输入框已弹出，直接填可编辑框。
     */
    replyComment(comment, msg, imagePath) {
        if (!comment) {
            return false;
        }
        let replyTag = null;
        try {
            if (comment.nicknameTag && comment.nicknameTag.parent) {
                replyTag = comment.nicknameTag.parent().findOne(UiSelector().textContains('回复').className('android.widget.TextView'));
            }
        } catch (e) {}
        if (!replyTag) {
            replyTag = UiSelector().textContains('回复').className('android.widget.TextView').isVisibleToUser(true).filter(function (v) {
                return v.text() && v.text().indexOf('回复') !== -1;
            }).findOne();
        }
        if (!replyTag) {
            Log.log('没有找到回复按钮');
            return false;
        }

        Common.click(replyTag, 0.2);
        Common.sleep(1200 + 800 * Math.random());
        Common.log('正在回复：' + msg, imagePath);
        return this.fillCommentInput(msg, imagePath);
    },

    /**
     * 评论半屏是否打开。
     * 注意：视频页未开评论时也会有「说点什么」，不能当弹层判断，否则 close 时 back 会退出视频。
     */
    isCommentPanelOpen() {
        try {
            if (UiSelector().className('android.widget.TextView').textContains('- 到底了 -').isVisibleToUser(true).findOneBy(350)) {
                return true;
            }
        } catch (e) {}
        try {
            // 半屏评论列表：顶部明显在屏幕中部以下（排除全屏信息流）
            let rv = UiSelector().className('androidx.recyclerview.widget.RecyclerView')
                .filter(function (v) {
                    let b = v.bounds();
                    return b && b.top > Device.height() * 0.35 && b.top < Device.height() * 0.75 && b.bottom > Device.height() * 0.8;
                }).isVisibleToUser(true).findOneBy(350);
            if (rv) {
                return true;
            }
        } catch (e2) {}
        return false;
    },

    /**
     * 关闭评论区。仅在弹层仍打开时关闭一次，避免多按返回退出视频。
     * 优先点上方遮罩收起；失败再用一次 back。
     * @param {boolean=} knownIsVideo 保留参数兼容调用方
     */
    closeCommentWindow(knownIsVideo) {
        if (!this.isCommentPanelOpen()) {
            Log.log('评论区未打开，跳过关闭');
            return false;
        }

        // 先点视频上方空白收起半屏评论（走 Common.tapAt，开启 HID 时用 Hid）
        try {
            let x = Device.width() * (0.45 + Math.random() * 0.1);
            let y = Device.height() * (0.12 + Math.random() * 0.06);
            Log.log('点击收起评论区', x, y);
            Common.tapAt(x, y);
            Common.sleep(900 + 400 * Math.random());
        } catch (eTap) {}

        if (!this.isCommentPanelOpen()) {
            return true;
        }

        // 仍开着再 back 一次
        Common.back();
        Common.sleep(1000 + 500 * Math.random());
        return !this.isCommentPanelOpen();
    },

    isLiving() {
        return !!UiSelector().descContains('直播中').isVisibleToUser(true).findOne() ||
            !!UiSelector().text('直播中').isVisibleToUser(true).findOne();
    },

    commentListSwipe() {
        let tag = UiSelector().scrollable(true).isVisibleToUser(true).findOne();
        if (!tag) {
            Log.log('赞评论列表滑动失败');
        }
        return tag.scrollForward();
    },

    //在视频或者图文页面检测是不是视频
    isVideo() {
        let tag = Common.id('matrixNickNameView').isVisibleToUser(true).findOne();
        return tag ? true : false;
    },

    intoBottom() {
        let tag = UiSelector().isVisibleToUser(true).text('- 到底了 -').findOne();
        return tag ? true : false;
    },

    openComment() {
        //视频需要打开评论窗口，图文也需要点击，让窗口滑动到评论区域
        let commentTag = this.getCommentTag();
        if (!commentTag) {
            return false;
        }
        Common.click(commentTag, 0.25);
        Common.sleep(2000 + 1000 * Math.random());
    },

    /**
     * 
     * @returns {any}
     */
    getCommenList() {
        //通过评论内容，反向找到昵称（通过昵称进入用户主页）
        let tags = UiSelector().className('android.widget.LinearLayout').filter(v => {
            return v.parent() && v.parent().className() == 'androidx.recyclerview.widget.RecyclerView' && v.bounds().left <= 10;
        }).isVisibleToUser(true).find();
        if (tags.length == 0) {
            return tags;
        }

        //最新版，评论和其他内容是分开的
        let childs = [];
        for (let i in tags) {
            let _childs = tags[i].children().find(UiSelector().className('android.widget.TextView'));

            let index = _childs[2].text().lastIndexOf('\n');
            if (index == -1) {
                index = _childs[2].text().lastIndexOf(' ');//02-17  回复
            }
            if (index == -1) {
                Log.log('过滤了', _childs[2].text());
                continue;
            }

            if (_childs[1].text() == '作者') {
                Log.log('作者过滤了', _childs[2].text());
                continue;
            }

            if (!_childs[3] || !_childs[3].parent()) {
                Common.log('没有评论赞');
                continue;
            }

            let zanTag = _childs[3].parent();
            // 半露出屏幕的评论不要入列，后续点赞坐标会偏
            if (!Common.isOnScreen(zanTag) || !Common.isOnScreen(_childs[0])) {
                Log.log('评论未完全可见，跳过', _childs[0] ? _childs[0].text() : '');
                continue;
            }

            let arr = _childs[2].text().split(' ');
            Log.log('评论内容', _childs[1].text(), index, arr);
            childs.push({
                content: _childs[1].text(),
                ip: arr[arr.length - 2] || '-',
                zanTag: zanTag,
                zaned: XhsComment.isZaned(zanTag),
                nicknameTag: _childs[0],
                nickname: _childs[0].text(),
            });
        }
        return childs;
    },

    zanComment(type, count) {
        if (type == 1) {
            let commentTag = this.getCommentTag();
            if (!commentTag) {
                return false;
            }
            Common.click(commentTag, 0.25);
            Common.sleep(2000 + 1000 * Math.random());
        }

        while (true) {
            let tags = [];
            let parentTags = UiSelector().className('android.widget.RelativeLayout').filter(v => {
                let childs = v.children();
                if (childs.length() != 3) {
                    return false;
                }

                if (childs.getChildren(2).className() != "android.widget.ImageView") {
                    return false;
                }

                if (childs.getChildren(1).className() != "android.widget.LinearLayout") {
                    return false;
                }
                tags.push(childs.getChildren(1));
                return true;
            }).isVisibleToUser(true).find();

            if (parentTags.length == 0) {
                break;
            }

            for (let i in tags) {
                if (!tags[i].isClickable() || !tags[i].isVisibleToUser()) {
                    continue;
                }

                Common.click(tags[i], 0.25);
                statistics.zanComment();
                Common.sleep(1000 + 1000 * Math.random());
                if (count-- <= 0) {
                    break;
                }
            }

            if (!this.commentListSwipe() || count <= 0 || this.intoBottom()) {
                Log.log('到底了', count);
                break;
            }

            Common.sleep(2000 + 1000 * Math.random());
        }

        if (type == 1) {
            Common.back();//视频需要关闭评论窗口
            Log.log('视频，关闭窗口');
            Common.sleep(2000 + 1000 * Math.random());
        }
        return count;
    },

    isFocus(type) {
        if (type == 0) {
            let tag = UiSelector().className('android.widget.TextView').text('已关注').isVisibleToUser(true).findOne() || UiSelector().className('android.widget.TextView').text('互相关注').isVisibleToUser(true).findOne();
            return tag ? true : false;
        }

        let tag = UiSelector().desc('关注').className('android.widget.Button').isVisibleToUser(true).findOne();
        return tag && tag.isSelected();
    },

    focus(type) {
        if (type == 0) {
            let tag = UiSelector().className('android.widget.TextView').text('已关注').isVisibleToUser(true).findOne() || UiSelector().className('android.widget.TextView').text('互相关注').isVisibleToUser(true).findOne();
            if (tag) {
                Log.log('已关注');
                return true;
            }
            tag = UiSelector().className('android.widget.TextView').text('关注').isVisibleToUser(true).findOne();
            if (tag) {
                Common.click(tag);
                statistics.focus();
                return true;
            }
            return false;
        }

        let tag = UiSelector().textContains('关注').className('android.widget.Button').isVisibleToUser(true).findOne();
        if (tag && tag.isSelected()) {
            Log.log('已关注');
            return true;
        }

        Common.click(tag);
        return true;
    },

    getNickname() {
        let tag = Common.id('nickNameTV').isVisibleToUser(true).findOne();
        if (tag) {
            return tag.text() || '';
        }
        // 视频昵称
        tag = Common.id('matrixNickNameView').isVisibleToUser(true).findOne();
        if (tag) {
            return tag.text() || tag.desc() || '';
        }
        return '';
    },

    getContent() {
        let type = this.getType();
        Log.log('type', type);
        if (type == 1) {
            let tag = Common.id("noteContentLayout").isVisibleToUser(true).findOne();
            if (tag) {
                return tag.desc();
            }
            return false;
        }

        //图文
        if (type == 0) {
            let textTag = UiSelector().className('android.widget.TextView').filter(v => {
                return v.parent() != null && !v.parent().parent() && v.parent().className() == 'android.widget.FrameLayout';
            }).isVisibleToUser(true).findOne();
            return textTag ? textTag.text() : null;
        }
        return false;
    },

    getType() {
        if (Common.id('nickNameTV').isVisibleToUser(true).findOne()) {
            return 0;//笔记
        }

        if (Common.id('matrixNickNameView').isVisibleToUser(true).findOne()) {
            return 1;//视频
        }

        return -1;
    },

    /**
     * 
     * @param {string[]} reportArr 
     * @param {string} msg
     * @param {string} imageFile 
     * @returns 
     */
    report(reportArr, msg, imageFile) {
        let moreTag = UiSelector().className('android.widget.ImageView').filter(v => {
            return v.bounds().left > Device.width() / 2 && v.bounds().bottom < Device.height() / 5;
        }).isVisibleToUser(true).findOne();
        Common.click(moreTag, 0.2);
        Common.sleep(1000 + 1000 * Math.random());

        let tagBounds = Images.findTextPosition(Images.capture(), '举报');
        if (tagBounds.length == 0) {
            let scrollTag = UiSelector().scrollable(true).filter(v => {
                return v.children().findOne(UiSelector().desc('复制链接'));
            }).isVisibleToUser(true).findOne();
            scrollTag.scrollForward();
            Common.sleep(2000 + 1000 * Math.random());
            tagBounds = Images.findTextPosition(Images.capture(), '举报');
            if (tagBounds.length == 0) {
                tagBounds = Images.findTextPosition(Images.capture(), '报');
            }
        }

        Common.tapAt(tagBounds[0].left + tagBounds[0].width() * Math.random(), tagBounds[0].top + tagBounds[0].height() * Math.random());
        Common.sleep(2000 + 2000 * Math.random());

        let theAccountTag = UiSelector().text('对他人造成困扰或危害').isVisibleToUser(true).findOne();
        Common.click(theAccountTag, 0.2);
        Common.sleep(2000 + 2000 * Math.random());

        for (let i in reportArr) {
            let tag = UiSelector().text(reportArr[i]).isVisibleToUser(true).findOne();
            if (!tag) {
                let scrollTag = UiSelector().scrollable(true).isVisibleToUser(true).findOne();
                scrollTag.scrollForward();
                Common.sleep(1000 + 1000 * Math.random());
                tag = UiSelector().text(reportArr[i]).isVisibleToUser(true).findOne();
            }
            Common.click(tag, 0.2);
            Common.sleep(1000 + 1000 * Math.random());
        }

        if (msg || imageFile) {
            let scrollTag = UiSelector().scrollable(true).isVisibleToUser(true).findOne();
            scrollTag.scrollForward();
            Common.sleep(2000 + 1000 * Math.random());

            let tag = UiSelector().text('补充更多举报信息').isVisibleToUser(true).findOne();
            Common.click(tag, 0.2);
            Common.sleep(1000 + 1000 * Math.random());
            Common.inputText(UiSelector().editable(true).isVisibleToUser(true).findOne(), msg);
            Common.sleep(1000 + 1000 * Math.random());

            if (imageFile) {
                let addImageTag = UiSelector().desc('图片上传').isVisibleToUser(true).findOne();
                Common.photoInput(imageFile, addImageTag);
            }
        }

        let submitTag = UiSelector().text('提交').isVisibleToUser(true).findOne();
        let res = Common.click(submitTag, 0.2);
        Common.sleep(1000 + 1000 * Math.random());
        return res;
    }
}

module.exports = Work;
