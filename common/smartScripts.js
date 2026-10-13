let config = require('./config.js');

let PROVIDERS = {
  deepseek: {
    label: 'DeepSeek',
    baseUrl: 'https://api.deepseek.com/v1/chat/completions',
    model: 'deepseek-flash'
  },
  qwen: {
    label: '通义千问',
    baseUrl: 'https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions',
    model: 'qwen-plus'
  },
  zhipu: {
    label: '智谱 GLM',
    baseUrl: 'https://open.bigmodel.cn/api/paas/v4/chat/completions',
    model: 'glm-4-flash'
  },
  moonshot: {
    label: 'Kimi',
    baseUrl: 'https://api.moonshot.cn/v1/chat/completions',
    model: 'moonshot-v1-8k'
  },
  openai: {
    label: 'OpenAI',
    baseUrl: 'https://api.openai.com/v1/chat/completions',
    model: 'gpt-4o-mini'
  },
  custom: {
    label: '自定义',
    baseUrl: '',
    model: ''
  }
};

let STYLES = [
  {
    key: 'industry',
    label: '行业',
    options: [
      { value: 'general', label: '通用获客', tip: '不限定品类，围绕视频内容自然互动' },
      { value: 'edu', label: '教育培训', tip: '学习成长、课程咨询场景' },
      { value: 'beauty', label: '美妆护肤', tip: '妆容、护肤、变美相关' },
      { value: 'local', label: '本地生活', tip: '到店、同城服务' },
      { value: 'ecommerce', label: '电商带货', tip: '种草、下单、福利' },
      { value: 'career', label: '职场技能', tip: '求职、副业、效率' },
      { value: 'health', label: '健康养生', tip: '作息、身材、调理' },
      { value: 'home', label: '房产家居', tip: '装修、居住、置业' },
      { value: 'custom', label: '自定义', tip: '下方自行填写行业' }
    ]
  },
  {
    key: 'sentence',
    label: '句式',
    options: [
      { value: 'statement', label: '陈述肯定', tip: '用肯定句，禁止问号和疑问尾' },
      { value: 'praise', label: '赞美细节', tip: '夸一个具体点，不空泛' },
      { value: 'resonate', label: '共鸣体验', tip: '说出自己也有过类似感受' },
      { value: 'addon', label: '补充观点', tip: '顺着内容补一句自己的看法' },
      { value: 'light', label: '轻松调侃', tip: '轻松但不冒犯，仍用陈述句' }
    ]
  },
  {
    key: 'tone',
    label: '语气',
    options: [
      { value: 'sincere', label: '真诚自然', tip: '像朋友随口一说' },
      { value: 'pro', label: '专业克制', tip: '稳重、少感叹' },
      { value: 'lively', label: '活泼轻松', tip: '有点温度，不油腻' },
      { value: 'gentle', label: '温和礼貌', tip: '客气但不生硬' }
    ]
  },
  {
    key: 'goal',
    label: '目的',
    options: [
      { value: 'interact', label: '互动认可', tip: '先互动，不急着要联系方式' },
      { value: 'dm', label: '引导私信', tip: '为后续私信铺垫，仍不发问句' },
      { value: 'seed', label: '种草兴趣', tip: '让对方对你/产品有印象' },
      { value: 'consult', label: '预约咨询', tip: '软性提到可以交流，不逼单' },
      { value: 'friend', label: '加好友', tip: '自然表示想认识，不审问' }
    ]
  },
  {
    key: 'person',
    label: '人称',
    options: [
      { value: 'peer', label: '对等交流', tip: '像同行/朋友' },
      { value: 'learn', label: '请教学习', tip: '谦虚但不用问句' },
      { value: 'fan', label: '观众视角', tip: '以刚刷到内容的观众口吻' }
    ]
  },
  {
    key: 'length',
    label: '长度',
    options: [
      { value: 'tiny', label: '极短', tip: '评论 8～14 字，私信 1 句' },
      { value: 'one', label: '一句', tip: '评论 1 句，私信 1～2 句' },
      { value: 'two', label: '两句', tip: '评论最多 2 句，私信 2 句' },
      { value: 'long', label: '稍长', tip: '评论 2 句，私信 3 句内' }
    ]
  },
  {
    key: 'address',
    label: '称呼',
    options: [
      { value: 'none', label: '不称呼', tip: '直接说内容' },
      { value: 'jie', label: '姐妹', tip: '适合女向内容' },
      { value: 'teacher', label: '老师', tip: '适合干货/教学' },
      { value: 'boss', label: '老板', tip: '适合商务/本地' }
    ]
  },
  {
    key: 'emoji',
    label: '表情',
    options: [
      { value: 'none', label: '不用', tip: '纯文字' },
      { value: 'one', label: '最多一个', tip: '结尾可选一个常见表情' },
      { value: 'mild', label: '适度', tip: '不超过两个，不连续刷表情' }
    ]
  },
  {
    key: 'approach',
    label: '获客方式',
    options: [
      { value: 'soft', label: '先认可再带', tip: '先夸内容，再轻轻露出来意' },
      { value: 'pure', label: '只互动不推销', tip: '完全不提产品、微信、加好友' },
      { value: 'hook', label: '软性留钩', tip: '留一句可继续聊的陈述，不是提问' },
      { value: 'direct', label: '直接说明', tip: '简洁说明刷到了、想交流，仍禁止疑问句' }
    ]
  },
  {
    key: 'focus',
    label: '评论重点',
    options: [
      { value: 'content', label: '内容本身', tip: '抓住视频讲的点' },
      { value: 'skill', label: '表达/镜头', tip: '夸讲得清楚或拍得好' },
      { value: 'view', label: '观点认同', tip: '认同某个判断' },
      { value: 'use', label: '实用收获', tip: '强调能用上、学到了' }
    ]
  }
];

let DEFAULT_AGENT =
  '你是短视频获客助手，通过评论和私信把感兴趣的人自然转化为可沟通对象。\n' +
  '硬性规则：\n' +
  '1. 只输出可直接发送的正文，不要标题、引号、解释。\n' +
  '2. 必须用陈述句或感叹句。禁止问句，禁止问号，禁止用「吗」「呢」「吧？」结尾，不要邀请对方回答问题。\n' +
  '3. 语气口语、真诚、不油腻、不硬广、不堆砌表情。\n' +
  '4. 评论围绕视频里一个具体细节，像随口一说。\n' +
  '5. 私信先提刚刷到内容，再给一个具体理由，最后用陈述句表示想交流。';

function asText(v) {
  return String(v == null ? '' : v);
}

function asBool(v, fallback) {
  if (v === true) {
    return true;
  }
  if (v === false) {
    return false;
  }
  return fallback === true;
}

function styleField(key) {
  for (let i = 0; i < STYLES.length; i++) {
    if (STYLES[i].key === key) {
      return STYLES[i];
    }
  }
  return null;
}

function optionOf(key, value) {
  let field = styleField(key);
  if (!field) {
    return null;
  }
  let opts = field.options || [];
  for (let i = 0; i < opts.length; i++) {
    if (opts[i].value === value) {
      return opts[i];
    }
  }
  return opts[0] || null;
}

module.exports = {
  key: config.storagePrefix + 'smartScripts.v1',
  providers: PROVIDERS,
  styles: STYLES,
  defaultAgent: DEFAULT_AGENT,

  defaults() {
    return {
      mode: 'platform',
      dmSmart: true,
      provider: 'deepseek',
      apiKey: '',
      model: PROVIDERS.deepseek.model,
      baseUrl: '',
      agent: '',
      industry: 'general',
      industryCustom: '',
      sentence: 'statement',
      tone: 'sincere',
      goal: 'interact',
      person: 'fan',
      length: 'one',
      address: 'none',
      emoji: 'none',
      approach: 'soft',
      focus: 'content'
    };
  },

  providerOf(id) {
    return PROVIDERS[id] || PROVIDERS.deepseek;
  },

  pickStyle(key, value) {
    let field = styleField(key);
    let d = this.defaults();
    let fallback = d[key];
    let opt = optionOf(key, value) || optionOf(key, fallback);
    return {
      value: opt ? opt.value : fallback,
      label: opt ? opt.label : '',
      tip: opt ? opt.tip : '',
      fieldLabel: field ? field.label : key
    };
  },

  normalize(raw) {
    let d = this.defaults();
    let src = raw || {};
    let provider = asText(src.provider || d.provider);
    if (!PROVIDERS[provider]) {
      provider = 'deepseek';
    }
    let model = asText(src.model);
    if (!model) {
      model = PROVIDERS[provider].model;
    }
    return {
      mode: src.mode === 'smart' ? 'smart' : 'platform',
      dmSmart: asBool(src.dmSmart, true),
      provider: provider,
      apiKey: asText(src.apiKey).trim(),
      model: model.trim(),
      baseUrl: asText(src.baseUrl).trim(),
      agent: asText(src.agent),
      industry: this.pickStyle('industry', src.industry).value,
      industryCustom: asText(src.industryCustom).trim(),
      sentence: this.pickStyle('sentence', src.sentence).value,
      tone: this.pickStyle('tone', src.tone).value,
      goal: this.pickStyle('goal', src.goal).value,
      person: this.pickStyle('person', src.person).value,
      length: this.pickStyle('length', src.length).value,
      address: this.pickStyle('address', src.address).value,
      emoji: this.pickStyle('emoji', src.emoji).value,
      approach: this.pickStyle('approach', src.approach).value,
      focus: this.pickStyle('focus', src.focus).value
    };
  },

  industryName(conf) {
    let c = conf || this.load();
    if (c.industry === 'custom' && c.industryCustom) {
      return c.industryCustom;
    }
    return this.pickStyle('industry', c.industry).label;
  },

  styleLines(conf) {
    let c = conf || this.load();
    let keys = ['industry', 'sentence', 'tone', 'goal', 'person', 'length', 'address', 'emoji', 'approach', 'focus'];
    let lines = [];
    for (let i = 0; i < keys.length; i++) {
      let k = keys[i];
      let p = this.pickStyle(k, c[k]);
      let label = p.label;
      if (k === 'industry') {
        label = this.industryName(c);
      }
      lines.push(p.fieldLabel + '：' + label + '（' + p.tip + '）');
    }
    return lines;
  },

  buildAgent(conf) {
    let c = conf || this.load();
    let industry = this.industryName(c);
    let lines = this.styleLines(c);
    let rules =
      '当前生成配置：\n- ' +
      lines.join('\n- ') +
      '\n硬性规则：\n' +
      '1. 只输出可直接发送的正文，不要标题、引号、解释、前后缀。\n' +
      '2. 必须用陈述句或感叹句。严禁疑问句、问号、「吗 / 呢 / 是不是 / 要不要」这类问法，不要让对方回答问题。\n' +
      '3. 口语、真诚、不油腻、不硬广。按「表情」配置决定是否带表情。\n' +
      '4. 评论抓住视频一个具体细节；私信先提刷到内容，再给具体理由，最后用陈述句表示想交流。\n' +
      '5. 严格遵守长度、称呼、获客方式和目的，不要跑偏成问卷或推销话术。';
    return (
      '你是「' +
      industry +
      '」方向的短视频获客助手，通过评论和私信把感兴趣的人自然转化成可沟通对象。\n' +
      rules
    );
  },

  payload(conf) {
    let c = this.normalize(conf);
    return {
      mode: c.mode,
      dmSmart: c.dmSmart,
      provider: c.provider,
      apiKey: c.apiKey,
      model: c.model,
      baseUrl: c.baseUrl,
      agent: c.agent,
      industry: c.industry,
      industryCustom: c.industryCustom,
      sentence: c.sentence,
      tone: c.tone,
      goal: c.goal,
      person: c.person,
      length: c.length,
      address: c.address,
      emoji: c.emoji,
      approach: c.approach,
      focus: c.focus
    };
  },

  load() {
    let raw = null;
    try {
      raw = Storage.getObj(this.key);
    } catch (e) {}
    return this.normalize(raw);
  },

  save(patch) {
    let next = this.normalize(Object.assign({}, this.load(), patch || {}));
    Storage.putObj(this.key, this.payload(next));
    return next;
  },

  isSmart() {
    return this.load().mode === 'smart';
  },

  ready() {
    let c = this.load();
    if (!c.apiKey) {
      return false;
    }
    if (!c.model) {
      return false;
    }
    if (c.provider === 'custom' && !c.baseUrl) {
      return false;
    }
    return true;
  },

  endpoint(conf) {
    let c = conf || this.load();
    if (c.provider === 'custom') {
      return asText(c.baseUrl).trim();
    }
    return this.providerOf(c.provider).baseUrl;
  },

  parseReply(raw) {
    if (raw == null || raw === '') {
      return { ok: false, message: '大模型无响应，请检查网络或 Key' };
    }
    let text = String(raw);
    let obj = null;
    try {
      obj = JSON.parse(text);
    } catch (e) {
      let preview = text.length > 80 ? text.substring(0, 80) + '…' : text;
      return { ok: false, message: '返回无法解析：' + preview };
    }
    if (obj && obj.error) {
      let err = obj.error;
      let msg = typeof err === 'string' ? err : (err.message || err.code || '请求失败');
      return { ok: false, message: String(msg) };
    }
    let content = '';
    try {
      content = obj.choices[0].message.content;
    } catch (e2) {
      try {
        content = obj.output && obj.output.text;
      } catch (e3) {}
    }
    content = asText(content).trim();
    content = content.replace(/^["「『]+/, '').replace(/["」』]+$/, '').trim();
    content = this.asStatement(content);
    if (!content) {
      return { ok: false, message: '模型没有生成话术，请换个输入再试' };
    }
    return { ok: true, text: content };
  },

  asStatement(text) {
    let t = asText(text).trim();
    t = t.replace(/[？?]+/g, '。');
    t = t.replace(/吗。/g, '。').replace(/呢。/g, '。').replace(/吧。/g, '。');
    t = t.replace(/吗！/g, '！').replace(/呢！/g, '！').replace(/吧！/g, '！');
    t = t.replace(/吗$/g, '').replace(/呢$/g, '').replace(/吧$/g, '');
    t = t.replace(/。+/g, '。');
    t = t.replace(/^[。！]+/g, '').replace(/[。！]+$/g, '');
    return t.trim();
  },

  generate(kind, input) {
    let c = this.load();
    if (!this.ready()) {
      return { ok: false, message: '请先配置大模型 Key 和模型名称' };
    }
    let url = this.endpoint(c);
    if (!url) {
      return { ok: false, message: '请填写接口地址' };
    }
    let role = kind === 'dm' ? '私信' : '评论';
    let scene = asText(input).trim() || '短视频获客，对方刚发布了一条有共鸣的内容';
    let user =
      '请生成一条「' +
      role +
      '」话术。\n视频/场景：' +
      scene +
      '\n行业：' +
      this.industryName(c) +
      '\n句式：' +
      this.pickStyle('sentence', c.sentence).label +
      '\n必须使用陈述句，禁止任何问句和问号。\n只输出可直接发送的正文。';
    let body = {
      model: c.model,
      temperature: 0.75,
      messages: [
        { role: 'system', content: this.buildAgent(c) },
        { role: 'user', content: user }
      ]
    };
    let raw = null;
    try {
      Http.setTimeout(45);
      raw = Http.post(url, body, {
        Accept: 'application/json',
        'Content-Type': 'application/json; charset=utf-8',
        Authorization: 'Bearer ' + c.apiKey
      });
    } catch (e) {
      return { ok: false, message: '请求失败：' + e };
    }
    return this.parseReply(raw);
  }
};
