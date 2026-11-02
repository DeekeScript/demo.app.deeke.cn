let Common = require("app/xhs/Common.js");
let statistics = require("common/statistics.js");

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

    msg(type, msg, imagePath) {
        let gallery = require('common/gallery.js');
        let text = String(msg || '').trim();
        let image = String(imagePath || '').trim();
        let inputTag = UiSelector().textContains('说点什么').className('android.widget.TextView').findOne() || UiSelector().className('android.widget.TextView').desc('评论框').findOne();

        if (!inputTag) {
            Log.log('没有找到输入框');
            return false;
        }

        Common.click(inputTag, 0.15);
        Common.sleep(1500 + 1000 * Math.random());

        let iptTag = UiSelector().className('android.widget.EditText').filter(v => {
            return v.isFocused();
        }).isVisibleToUser(true).findOne() || UiSelector().className('android.widget.EditText').isVisibleToUser(true).findOne();
        if (text) {
            if (!iptTag) {
                Log.log('输入框没有');
                return false;
            }
            iptTag.setText(text);
            Common.sleep(1500 + 500 * Math.random());
        }

        if (image) {
            gallery.stageLocalImage(image);
            Common.sleep(1500);
            let addImageTag =
                UiSelector().desc('添加图片').isVisibleToUser(true).findOne() ||
                UiSelector().descContains('图片').clickable(true).isVisibleToUser(true).findOne() ||
                UiSelector().descContains('相册').isVisibleToUser(true).findOne();
            if (addImageTag) {
                gallery.pickFirstStaged(addImageTag);
            } else {
                Log.log('评论框未找到添加图片入口');
            }
        }

        let sendTag = UiSelector().className('android.widget.TextView').text('发送').isVisibleToUser(true).findOne();
        if (!sendTag) {
            return false;
        }

        let res = Common.click(sendTag, 0.2);
        statistics.comment();
        Log.log('发送了');
        Common.sleep(500 + 500 * Math.random());
        return res;
    },

    /**
     * 回复某条评论（可带图）
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
        if (replyTag) {
            Common.click(replyTag, 0.2);
            Common.sleep(1200 + 800 * Math.random());
        }
        return this.msg(0, msg, imagePath);
    },

    closeCommentWindow() {
        let isVideo = this.isVideo();
        if (isVideo) {
            Common.back();
            Common.sleep(1000 + 500 * Math.random());
        }
        return true;
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

            let arr = _childs[2].text().split(' ');
            Log.log('评论内容', _childs[1].text(), index, arr);
            childs.push({
                content: _childs[1].text(),
                ip: arr[arr.length - 2] || '-',
                zanTag: _childs[3].parent(),
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
        return tag ? tag.text() : '';
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

        Gesture.click(tagBounds[0].left + tagBounds[0].width() * Math.random(), tagBounds[0].top + tagBounds[0].height() * Math.random());
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
            UiSelector().editable(true).isVisibleToUser(true).findOne().setText(msg);
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
