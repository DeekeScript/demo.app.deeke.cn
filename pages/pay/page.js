let api = require('../../common/api.js');
let device = require('../../common/device.js');
let activation = require('../../common/activation.js');
let config = require('../../common/config.js');

Page({
  data: {
    toolName: '加载中…',
    activationHint: '',
    isFree: false,
    freeHint: '',
    showPlans: false,
    plansEmpty: false,
    showPayActions: false,
    showMock: false,
    plans: [],
    selectedPlan: '',
    selectedPlanName: '',
    selectedPrice: '-',
    activationCode: '',
    activateOpen: false,
    savedActivationCode: '',
    showActivateCode: false,
    showActivateForm: true,
    qrOpen: false,
    qrImage: '',
    qrStatus: '等待支付…',
    pendingOrderNo: '',
    polling: false
  },

  syncActivatePanel() {
    let code = activation.readActivationCode();
    this.setData({
      savedActivationCode: code,
      showActivateCode: !!code,
      showActivateForm: !code
    });
  },

  onLoad() {
    this.syncActivatePanel();
    this.loadPricing();
  },

  onShow() {
    this.syncActivatePanel();
  },

  onBack() {
    this.back();
  },

  onOpenActivate() {
    this.syncActivatePanel();
    this.setData({ activateOpen: true });
  },

  onCopyActivateCode() {
    let code = this.data.savedActivationCode || activation.readActivationCode();
    if (!code) {
      this.toast('暂无激活码');
      return;
    }
    System.setClip(code);
    this.toast('已复制激活码');
  },

  loadPricing() {
    this.showLoading('加载中…');
    let res = api.pricing();
    if (!res.ok) {
      this.setData({
        toolName: '价格加载失败',
        activationHint: (res.message || '请检查网络与工具编号') + (res.url ? ('\n' + res.url) : ''),
        showPlans: false,
        plansEmpty: true,
        showPayActions: false
      });
      this.hideLoading();
      return;
    }
    let data = res.data || {};
    let act = data.activation || null;
    if (act) {
      activation.saveCache(act);
    }
    let st = activation.formatStatus(act);
    let methods = data.methods || {};
    let alipayScenes = methods.alipay || [];
    let channels = data.channels || [];
    let showMock = false;
    let canApp = false;
    let canQr = false;
    for (let i = 0; i < channels.length; i++) {
      if (channels[i] === 'mock') {
        showMock = true;
      }
    }
    for (let s = 0; s < alipayScenes.length; s++) {
      if (alipayScenes[s] === 'app' || alipayScenes[s] === 'h5') {
        canApp = true;
      }
      if (alipayScenes[s] === 'qr') {
        canQr = true;
      }
    }
    if (data.free) {
      this.setData({
        toolName: data.name || config.toolCode,
        activationHint: st.text + ' · ' + st.detail,
        isFree: true,
        freeHint: data.freeSource === 'global' ? '全站限时免费' : '该工具当前免费，无需购买',
        showPlans: false,
        plansEmpty: false,
        showPayActions: false,
        showMock: false
      });
      this.hideLoading();
      return;
    }
    let plans = [];
    let raw = data.plans || [];
    let selected = this.data.selectedPlan;
    for (let i = 0; i < raw.length; i++) {
      let p = raw[i];
      if (!p || !p.available) {
        continue;
      }
      let price = p.couponPrice != null ? p.couponPrice : p.price;
      let sub = (p.days || '') + ' 天';
      if (p.originalPrice) {
        sub += ' · 原价 ¥' + p.originalPrice;
      }
      if (p.dailyPrice != null) {
        sub += ' · 约 ¥' + p.dailyPrice + '/天';
      }
      let active = selected ? selected === p.plan : plans.length === 0;
      plans.push({
        plan: p.plan,
        name: p.name || p.plan,
        sub: sub,
        price: price,
        priceText: '¥' + price,
        cardBg: active ? '#E8F6F4' : '#FFFFFF',
        borderColor: active ? '#0B6E6A' : '#E6EEEE'
      });
      if (active) {
        selected = p.plan;
      }
    }
    let selectedItem = null;
    for (let j = 0; j < plans.length; j++) {
      if (plans[j].plan === selected) {
        selectedItem = plans[j];
      }
    }
    this.setData({
      toolName: data.name || config.toolCode,
      activationHint: st.text + ' · ' + st.detail,
      isFree: false,
      showPlans: plans.length > 0,
      plansEmpty: plans.length === 0,
      showPayActions: plans.length > 0,
      showMock: showMock,
      plans: plans,
      selectedPlan: selectedItem ? selectedItem.plan : '',
      selectedPlanName: selectedItem ? selectedItem.name : '',
      selectedPrice: selectedItem ? selectedItem.price : '-',
      canApp: canApp,
      canQr: canQr
    });
    this.hideLoading();
  },

  onSelectPlan(e) {
    let item = e && e.item ? e.item : null;
    if (!item || !item.plan) {
      return;
    }
    let plans = (this.data.plans || []).slice();
    for (let i = 0; i < plans.length; i++) {
      let active = plans[i].plan === item.plan;
      plans[i] = {
        plan: plans[i].plan,
        name: plans[i].name,
        sub: plans[i].sub,
        price: plans[i].price,
        priceText: plans[i].priceText,
        cardBg: active ? '#E8F6F4' : '#FFFFFF',
        borderColor: active ? '#0B6E6A' : '#E6EEEE'
      };
    }
    this.setData({
      plans: plans,
      selectedPlan: item.plan,
      selectedPlanName: item.name,
      selectedPrice: item.price
    });
  },

  requirePlan() {
    if (!this.data.selectedPlan) {
      this.toast('请先选择套餐');
      return null;
    }
    return this.data.selectedPlan;
  },

  afterPaid(orderNo) {
    let act = api.activate({ order_no: orderNo });
    if (act.ok) {
      activation.saveCache(act.data);
    } else {
      activation.checkOnline();
    }
    this.setData({ qrOpen: false, polling: false, pendingOrderNo: '' });
    this.toast('开通成功');
    this.loadPricing();
  },

  pollOrder(orderNo) {
    if (!orderNo) {
      return;
    }
    this.setData({ polling: true, pendingOrderNo: orderNo });
    let self = this;
    let times = 0;
    let tick = function () {
      if (!self.data.polling || self.data.pendingOrderNo !== orderNo) {
        return;
      }
      times++;
      let res = api.getOrder(orderNo);
      if (res.ok && res.data && res.data.status === 'paid') {
        self.afterPaid(orderNo);
        return;
      }
      if (times >= config.pollMaxTimes) {
        self.setData({
          qrStatus: '仍未确认到账，可点「我已支付」重试',
          polling: false
        });
        return;
      }
      self.setData({ qrStatus: '等待支付确认…(' + times + ')' });
      setTimeout(tick, config.pollIntervalMs);
    };
    setTimeout(tick, config.pollIntervalMs);
  },

  onPayApp() {
    let plan = this.requirePlan();
    if (!plan) {
      return;
    }
    // 直接调起支付宝：优先 H5（可拉起支付宝 App）；不可用再试 app 通道拿到 orderString。
    // 打包版若已集成支付宝 SDK，用 payParams.orderString 调 PayTask 即可。
    let res = api.createOrder(plan, 'h5');
    if (!res.ok) {
      res = api.createOrder(plan, 'app');
    }
    if (!res.ok) {
      this.toast(res.message || '下单失败');
      return;
    }
    let pay = (res.data && res.data.payParams) || {};
    let orderNo = res.data.orderNo || res.data.order_no || '';
    if (pay.payUrl) {
      App.openUrl(pay.payUrl, config.alipayPackage);
      this.pollOrder(orderNo);
      this.toast('已调起支付宝');
      return;
    }
    if (pay.orderString) {
      Storage.put(config.storagePrefix + 'lastOrderString', String(pay.orderString));
      Storage.put(config.storagePrefix + 'lastOrderNo', String(orderNo));
      this.toast('已拿到支付串，请用扫码或集成 SDK 后支付');
      return;
    }
    if (pay.mockPayUrl) {
      this.toast('当前为模拟通道，请用模拟支付');
      return;
    }
    this.toast('支付参数为空');
  },

  onPayQr() {
    let plan = this.requirePlan();
    if (!plan) {
      return;
    }
    let res = api.createOrder(plan, 'qr');
    if (!res.ok) {
      this.toast(res.message || '下单失败');
      return;
    }
    let pay = (res.data && res.data.payParams) || {};
    let orderNo = res.data.orderNo || res.data.order_no || '';
    let qr = pay.qrCode || pay.url || '';
    if (!qr) {
      this.toast('未返回二维码');
      return;
    }
    this.setData({
      qrOpen: true,
      qrImage: api.qrImageUrl(qr),
      qrStatus: '请扫码，支付后自动确认',
      pendingOrderNo: orderNo
    });
    this.pollOrder(orderNo);
  },

  onPayMock() {
    let plan = this.requirePlan();
    if (!plan) {
      return;
    }
    let mockOrder = api.post('/app/orders', {
      code: config.toolCode,
      plan: plan,
      device_id: device.getDeviceId(),
      pay_method: 'mock',
      channel: 'app'
    });
    if (!mockOrder.ok) {
      this.toast(mockOrder.message || '模拟下单失败');
      return;
    }
    let orderNo = mockOrder.data.orderNo || mockOrder.data.order_no;
    let paid = api.mockPay(orderNo);
    if (!paid.ok) {
      this.toast(paid.message || '模拟支付失败');
      return;
    }
    this.afterPaid(orderNo);
  },

  onCloseQr() {
    this.setData({ qrOpen: false, polling: false });
  },

  onCheckOrder() {
    let orderNo = this.data.pendingOrderNo;
    if (!orderNo) {
      this.toast('没有待确认订单');
      return;
    }
    let res = api.getOrder(orderNo);
    if (res.ok && res.data && res.data.status === 'paid') {
      this.afterPaid(orderNo);
      return;
    }
    this.setData({ qrStatus: '尚未到账，请稍后再试' });
    this.pollOrder(orderNo);
  },

  onActivateCode() {
    let code = (this.data.activationCode || '').trim();
    if (!code) {
      this.toast('请输入激活码');
      return;
    }
    let res = api.activate({ activation_code: code });
    if (!res.ok) {
      this.toast(res.message || '激活失败');
      return;
    }
    let payload = res.data || {};
    payload.activationCode = code;
    activation.saveCache(payload);
    activation.saveActivationCode(code);
    this.setData({
      activationCode: '',
      activateOpen: false
    });
    this.syncActivatePanel();
    this.toast('激活成功');
    this.loadPricing();
  }
});
