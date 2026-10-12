let api = require('./api.js');
let config = require('./config.js');

module.exports = {
  cacheKey: config.storagePrefix + 'activation',

  saveCache(data) {
    if (!data) {
      return;
    }
    let prev = this.readCache() || {};
    let code = data.activationCode || data.activation_code || prev.activationCode || '';
    Storage.putObj(this.cacheKey, {
      activated: !!data.activated,
      plan: data.plan || '',
      state: data.state || '',
      expiresAt: data.expiresAt || null,
      free: !!data.free,
      activationCode: code ? String(code) : '',
      checkedAt: Date.now()
    });
  },

  saveActivationCode(code) {
    let text = String(code || '').trim();
    if (!text) {
      return;
    }
    let cur = this.readCache() || {};
    cur.activationCode = text;
    Storage.putObj(this.cacheKey, cur);
  },

  readActivationCode() {
    let cur = this.readCache() || {};
    return String(cur.activationCode || '').trim();
  },

  readCache() {
    return Storage.getObj(this.cacheKey) || null;
  },

  clearCache() {
    Storage.remove(this.cacheKey);
  },

  formatStatus(data) {
    if (!data) {
      return { activated: false, text: '待激活', detail: '激活后，才能正常使用本APP' };
    }
    if (data.free || data.state === 'free' || (data.activated && data.plan === 'free')) {
      return { activated: true, text: '免费使用', detail: data.freeUntil ? ('限免至 ' + data.freeUntil) : '当前工具免费' };
    }
    if (data.activated) {
      let planName = data.plan || '会员';
      let exp = data.expiresAt ? String(data.expiresAt).replace('T', ' ').substring(0, 16) : '长期';
      return { activated: true, text: '已开通 · ' + planName, detail: '到期：' + exp };
    }
    if (data.state === 'expired') {
      return { activated: false, text: '已过期', detail: '续费后可继续使用' };
    }
    if (data.state === 'revoked') {
      return { activated: false, text: '已失效', detail: '请联系客服或重新开通' };
    }
    return { activated: false, text: '待激活', detail: '激活后，才能正常使用本APP' };
  },

  checkOnline() {
    let res = api.checkActivation();
    if (!res.ok) {
      return { ok: false, message: res.message || '检测失败', status: this.formatStatus(this.readCache()) };
    }
    this.saveCache(res.data);
    return { ok: true, data: res.data, status: this.formatStatus(res.data) };
  },

  ensurePaid() {
    let online = this.checkOnline();
    if (!online.ok) {
      return { ok: false, needPay: false, message: online.message || '无法检测开通状态，请检查网络' };
    }
    if (online.status && online.status.activated) {
      return { ok: true, needPay: false, data: online.data, status: online.status };
    }
    return { ok: false, needPay: true, message: '待激活，激活后才能正常使用本APP', data: online.data, status: online.status };
  }
};
