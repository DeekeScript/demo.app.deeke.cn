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
    activateTip: '',
    savedActivationCode: '',
    activateBoundHint: '当前设备已绑定激活码',
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
      showActivateForm: !code,
      activateBoundHint: code ? '当前设备已绑定激活码' : ''
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
    this.setData({ activateOpen: true, activateTip: '' });
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
    this.setData({
      qrOpen: false,
      qrImage: '',
      polling: false,
      pendingOrderNo: ''
    });
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
    this.showLoading('正在调起支付宝…');
    let res = api.createOrder(plan, 'app');
    if (!res.ok) {
      this.hideLoading();
      this.toast(res.message || '下单失败');
      return;
    }
    let pay = (res.data && res.data.payParams) || {};
    let orderNo = res.data.orderNo || res.data.order_no || '';
    if (!pay.orderString) {
      this.hideLoading();
      if (pay.mockPayUrl) {
        this.toast('当前为模拟通道，请用模拟支付');
        return;
      }
      this.toast('支付参数为空');
      return;
    }
    Storage.put(config.storagePrefix + 'lastOrderString', String(pay.orderString));
    Storage.put(config.storagePrefix + 'lastOrderNo', String(orderNo));
    let payResult = null;
    try {
      // 不要对 Java 注入对象用 typeof，Rhino 会报「JavaScript 值无效」
      payResult = Alipay.pay(String(pay.orderString));
    } catch (e) {
      this.hideLoading();
      this.toast((e && e.message) || '调起支付宝失败');
      return;
    }
    this.hideLoading();
    this.pollOrder(orderNo);
    let ok = false;
    try {
      ok = !!(payResult && (payResult.ok === true || String(payResult.resultStatus) === '9000'));
    } catch (e2) {
      ok = false;
    }
    if (ok) {
      this.toast('支付完成，正在确认开通…');
      return;
    }
    let memo = '';
    try {
      if (payResult && payResult.memo) {
        memo = String(payResult.memo);
      }
    } catch (e3) {}
    this.toast(memo || '支付未完成，可稍后点「我已支付」或使用扫码');
  },

  onPayQr() {
    let plan = this.requirePlan();
    if (!plan) {
      return;
    }
    // 先用整页 loading，下单完成后再一次性打开弹窗，避免弹窗二次 setData 闪一下
    this.showLoading('生成二维码…');
    let self = this;
    setTimeout(function () {
      let res = api.createOrder(plan, 'qr');
      if (!res.ok) {
        self.hideLoading();
        self.toast(res.message || '下单失败');
        return;
      }
      let pay = (res.data && res.data.payParams) || {};
      let orderNo = res.data.orderNo || res.data.order_no || '';
      let qrText = pay.qrCode || pay.url || '';
      if (!qrText) {
        self.hideLoading();
        self.toast('未返回二维码');
        return;
      }
      // 底座 QrCode 本地生成，不依赖外网或第三方 JS
      let qrPath = null;
      try {
        qrPath = QrCode.toFile(String(qrText), {
          size: 440,
          margin: 1,
          level: 'M',
          format: 'png'
        });
      } catch (e) {
        self.hideLoading();
        self.toast((e && e.message) || '二维码生成失败');
        return;
      }
      self.hideLoading();
      if (!qrPath) {
        self.toast('二维码生成失败');
        return;
      }
      self.setData({
        qrOpen: true,
        qrImage: String(qrPath),
        qrStatus: '请扫码，支付后自动确认',
        pendingOrderNo: orderNo,
        polling: false
      });
      self.pollOrder(orderNo);
    }, 30);
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
    this.setData({
      qrOpen: false,
      qrImage: '',
      polling: false
    });
  },

  onCheckOrder() {
    let orderNo = this.data.pendingOrderNo;
    if (!orderNo) {
      this.toast('没有待确认订单');
      return;
    }
    this.showLoading('确认支付中…');
    let res = api.getOrder(orderNo);
    this.hideLoading();
    if (res.ok && res.data && res.data.status === 'paid') {
      this.afterPaid(orderNo);
      return;
    }
    // 查单接口成功时 message 常为 "ok"，不能直接 toast 给用户
    let tip = '尚未到账，请支付完成后稍候再试';
    if (!res.ok) {
      tip = (res && res.message) ? String(res.message) : '查询失败，请稍后重试';
    }
    this.setData({ qrStatus: tip });
    this.toast(tip);
    this.pollOrder(orderNo);
  },

  onActivateCode() {
    let code = String(this.data.activationCode || '').trim();
    if (!code) {
      this.setData({ activateTip: '请输入激活码' });
      this.toast({ text: '请输入激活码', duration: 'long' });
      return;
    }
    this.setData({ activateTip: '正在激活…' });
    this.showLoading('正在激活…');
    let res = api.activate({ activation_code: code });
    this.hideLoading();
    if (!res.ok) {
      let msg = res.message || '激活失败';
      this.setData({ activateTip: msg });
      this.toast({ text: msg, duration: 'long' });
      return;
    }
    let payload = res.data || {};
    payload.activationCode = code;
    activation.saveCache(payload);
    activation.saveActivationCode(code);
    // 弹窗保持打开，立刻切到「已绑定激活码」视图
    this.setData({
      activationCode: '',
      activateTip: '',
      activateOpen: true,
      savedActivationCode: code,
      showActivateCode: true,
      showActivateForm: false,
      activateBoundHint: '激活成功，当前设备已绑定激活码'
    });
    this.loadPricing();
    this.toast({ text: '激活成功', duration: 'long' });
  }
});
