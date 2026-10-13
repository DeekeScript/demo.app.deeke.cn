let storage = require('./storage.js');

function bump(key) {
    let time = statistics.getDate();
    let count = storage.get(key + time, 'int') || 0;
    storage.set(key + time, count + 1);
}

let statistics = {
    getDate() {
        let d = new Date();
        let m = d.getMonth() + 1;
        let date = d.getDate();
        return (m >= 10 ? m : ('0' + m)) + '.' + (date >= 10 ? date : ('0' + date));
    },

    viewVideo() {
        bump('s_viewVideo');
    },

    viewTargetVideo() {
        bump('s_viewTargetVideo');
    },

    zan() {
        bump('s_zan');
    },

    comment() {
        bump('s_comment');
    },

    zanComment() {
        bump('s_zanComment');
    },

    privateMsg() {
        bump('s_privateMsg');
    },

    focus() {
        bump('s_focus');
    },

    viewUser() {
        bump('s_viewUser');
    }
};

module.exports = statistics;
