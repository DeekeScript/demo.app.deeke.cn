let api = require('./api.js');
let config = require('./config.js');

// 与后台 Plans 标签一致；接口未带 planName 时兜底
let PLAN_LABELS = {
  day: '1 天',
  month: '30 天',
  quarter: '90 天',
  half_year: '180 天',
  year: '1 年',
  free: '免费',
  trial: '体验版',
  standard: '标准版'
};

module.exports = {
  cacheKey: config.storagePrefix + 'activation',

  planLabel(data) {
    if (!data) {
      return '会员';
    }
    let name = data.planName || data.plan_name || '';
    if (name) {
      return String(name);
    }
    let plan = String(data.plan || '');
    if (PLAN_LABELS[plan]) {
      return PLAN_LABELS[plan];
    }
    return plan || '会员';
  },

  saveCache(data) {
    if (!data) {
      return;
    }
    let prev = this.readCache() || {};
    let activated = !!data.activated;
    let free = !!data.free || data.state === 'free';
    // 失效/过期/未开通：清掉本地绑定的激活码，弹窗回到输入态
    let code = '';
    if (activated || free) {
      code = data.activationCode || data.activation_code || prev.activationCode || '';
    }
    let plan = data.plan || prev.plan || '';
    let planName = data.planName || data.plan_name || prev.planName || PLAN_LABELS[plan] || '';
    Storage.putObj(this.cacheKey, {
      activated: activated,
      plan: plan,
      planName: planName ? String(planName) : '',
      state: data.state || '',
      expiresAt: data.expiresAt || null,
      free: !!free,
      activationCode: code ? String(code) : '',
      checkedAt: Date.now()
    });
  },

  saveActivationCode(code) {
    let text = String(code || '').trim();
    if (!text) {
      return;
    }
    // 必须新建普通对象：getObj 返回的 Java/JSON 对象不能直接改完再 putObj（Rhino NPE）
    this.writeCache(this.readCache(), { activationCode: text });
  },

  clearActivationCode() {
    this.writeCache(this.readCache(), { activationCode: '' });
  },

  /** 把缓存写成可 JSON 化的纯对象再存盘 */
  writeCache(prev, patch) {
    let p = prev || {};
    let next = patch || {};
    Storage.putObj(this.cacheKey, {
      activated: next.activated != null ? !!next.activated : !!p.activated,
      plan: next.plan != null ? String(next.plan || '') : String(p.plan || ''),
      planName: next.planName != null ? String(next.planName || '') : String(p.planName || ''),
      state: next.state != null ? String(next.state || '') : String(p.state || ''),
      expiresAt: next.expiresAt !== undefined ? next.expiresAt : (p.expiresAt || null),
      free: next.free != null ? !!next.free : !!p.free,
      activationCode: next.activationCode != null
        ? String(next.activationCode || '')
        : String(p.activationCode || ''),
      checkedAt: next.checkedAt != null ? next.checkedAt : (p.checkedAt || Date.now())
    });
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
      let planName = this.planLabel(data);
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
    let st = online.status || {};
    let tip = '待激活，激活后才能正常使用本APP';
    if (online.data && online.data.state === 'revoked') {
      tip = '激活已失效，请重新激活后再使用';
    } else if (st.detail) {
      tip = st.text ? (st.text + '：' + st.detail) : st.detail;
    }
    return { ok: false, needPay: true, message: tip, data: online.data, status: online.status };
  }
};
