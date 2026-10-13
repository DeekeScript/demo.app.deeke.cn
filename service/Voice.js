// 评论截流 II 不使用语音评论，保留接口以免 Comment.commentMsg 报错
module.exports = {
    isOpen() {
        return false;
    },

    tts() {
        return false;
    }
};
