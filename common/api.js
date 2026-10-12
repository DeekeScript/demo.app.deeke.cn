let config = require('./config.js');
let device = require('./device.js');

function encode(v) {
  try {
    return encodeURIComponent(String(v == null ? '' : v));
  } catch (e) {
    return String(v == null ? '' : v);
  }
}

function ensureTimeout() {
  try {
    let sec = config.httpTimeoutSec || 30;
    Http.setTimeout(sec);
  } catch (e) {}
}

module.exports = {
  baseUrl() {
    let base = config.apiBase || (config.apiHost + (config.apiPrefix || '/api/v1'));
    if (!base) {
      base = 'https://app.deeke.cn/api/v1';
    }
    // 去掉末尾斜杠，避免 //app
    while (base.length > 8 && base.charAt(base.length - 1) === '/') {
      base = base.substring(0, base.length - 1);
    }
    return base;
  },

  versionName() {
    let versionName = config.versionName || '1.0.0';
    try {
      let n = App.currentVersionName();
      if (n) {
        versionName = String(n);
      }
    } catch (e) {}
    return versionName;
  },

  // APP_API：Accept / X-Tool-Code / X-App-Version 必填；X-Device-Id 建议
  headers(forPost) {
    let h = {
      Accept: 'application/json',
      'X-Device-Id': device.getDeviceId(),
      'X-Tool-Code': config.toolCode,
      'X-App-Version': this.versionName()
    };
    if (forPost) {
      // Http.post 本身也会带 JSON Content-Type；这里再声明一次更稳
      h['Content-Type'] = 'application/json; charset=utf-8';
    }
    return h;
  },

  parse(raw, url) {
    if (raw == null || raw === '') {
      return {
        ok: false,
        message: '网络异常，请检查手机网络或域名 ' + (config.apiHost || 'https://app.deeke.cn'),
        url: url || ''
      };
    }
    let text = String(raw);
    // 个别环境会带 BOM
    if (text.charCodeAt(0) === 0xfeff) {
      text = text.substring(1);
    }
    let obj = null;
    try {
      obj = JSON.parse(text);
    } catch (e) {
      let preview = text.length > 80 ? text.substring(0, 80) + '…' : text;
      return { ok: false, message: '接口返回无法解析：' + preview, url: url || '' };
    }
    if (!obj) {
      return { ok: false, message: '接口返回为空', url: url || '' };
    }
    if (obj.code === 0 || obj.code === '0') {
      return { ok: true, data: obj.data, message: obj.message || 'ok', url: url || '' };
    }
    return {
      ok: false,
      data: obj.data,
      message: obj.message || obj.error || '请求失败',
      error: obj.error || obj.code,
      url: url || ''
    };
  },

  url(path) {
    let p = path || '';
    if (p.indexOf('http://') === 0 || p.indexOf('https://') === 0) {
      return p;
    }
    if (p.charAt(0) !== '/') {
      p = '/' + p;
    }
    return this.baseUrl() + p;
  },

  get(path) {
    ensureTimeout();
    let u = this.url(path);
    let raw = null;
    try {
      raw = Http.get(u, this.headers(false));
    } catch (e) {
      console.log('Http.get error ' + u + ' ' + e);
      return { ok: false, message: '请求失败：' + e, url: u };
    }
    console.log('Http.get ' + u + ' len=' + (raw == null ? 0 : String(raw).length));
    return this.parse(raw, u);
  },

  post(path, body) {
    ensureTimeout();
    let u = this.url(path);
    let raw = null;
    try {
      raw = Http.post(u, body || {}, this.headers(true));
    } catch (e) {
      console.log('Http.post error ' + u + ' ' + e);
      return { ok: false, message: '请求失败：' + e, url: u };
    }
    // 个别运行时对带 headers 的 post 异常，再试一次无自定义 Content-Type
    if (raw == null || raw === '') {
      try {
        raw = Http.post(u, body || {}, {
          Accept: 'application/json',
          'X-Device-Id': device.getDeviceId(),
          'X-Tool-Code': config.toolCode,
          'X-App-Version': this.versionName()
        });
      } catch (e2) {
        console.log('Http.post retry error ' + u + ' ' + e2);
      }
    }
    console.log('Http.post ' + u + ' len=' + (raw == null ? 0 : String(raw).length));
    return this.parse(raw, u);
  },

  pricing() {
    let id = encode(device.getDeviceId());
    return this.get('/app/tools/' + config.toolCode + '/pricing?device_id=' + id);
  },

  checkActivation() {
    return this.post('/app/activation/check', {
      code: config.toolCode,
      device_id: device.getDeviceId()
    });
  },

  activate(payload) {
    let body = {
      code: config.toolCode,
      device_id: device.getDeviceId()
    };
    if (payload && payload.activation_code) {
      body.activation_code = payload.activation_code;
    }
    if (payload && payload.order_no) {
      body.order_no = payload.order_no;
    }
    return this.post('/app/activate', body);
  },

  createOrder(plan, channel) {
    return this.post('/app/orders', {
      code: config.toolCode,
      plan: plan,
      device_id: device.getDeviceId(),
      pay_method: 'alipay',
      channel: channel || 'app'
    });
  },

  getOrder(orderNo) {
    let id = encode(device.getDeviceId());
    return this.get('/app/orders/' + encode(orderNo) + '?device_id=' + id);
  },

  mockPay(orderNo) {
    return this.post('/app/orders/' + encode(orderNo) + '/mock-pay', {
      device_id: device.getDeviceId()
    });
  },

  qrImageUrl(content) {
    // 已弃用：请用底座 QrCode.toFile(content, options) 本地生成。
    return 'https://api.qrserver.com/v1/create-qr-code/?size=240x240&data=' + encode(content || '');
  },

  checkUpdate(versionCode) {
    let code = encode(config.toolCode);
    let vc = encode(versionCode == null ? '' : versionCode);
    let id = encode(device.getDeviceId());
    return this.get('/app/update/check?code=' + code + '&versionCode=' + vc + '&deviceId=' + id);
  },

  versionHistory() {
    return this.get('/apps/' + encode(config.toolCode) + '/versions');
  }
};
