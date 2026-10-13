let target = require('../../common/target.js');

Page({
  data: {
    showEmpty: true,
    showMain: false,
    showVersions: false,
    showNote: false,
    showOfficial: false,
    hasPackage: false,
    emptyHint: '加载中…',
    appName: '',
    packageLine: '',
    compatTag: '',
    compatTagBg: '#EEF2F1',
    compatTagColor: '#667',
    localTag: '',
    localTagBg: '#EEF2F1',
    localTagColor: '#667',
    localDetail: '',
    note: '',
    disclaimer: '',
    autoUpdateTip: '',
    versions: [],
    officialUrl: ''
  },

  onLoad() {
    this.reload(true);
  },

  onShow() {
    this.reload(false);
  },

  onBack() {
    this.back();
  },

  reload(force) {
    let loaded = target.load(!!force);
    let data = loaded.target;
    if (!data) {
      this.setData({
        showEmpty: true,
        showMain: false,
        showVersions: false,
        showNote: false,
        emptyHint: loaded.ok
          ? '当前工具未配置目标 App，无需单独下载。'
          : (loaded.message || '加载失败，请稍后重试')
      });
      return;
    }
    let st = target.evaluate(data);
    let versions = [];
    for (let i = 0; i < (data.versions || []).length; i++) {
      let v = data.versions[i];
      let hasDownload = !!v.downloadUrl;
      versions.push({
        version: v.version,
        versionText: data.name + ' ' + v.version,
        note: v.note || '',
        hasNote: !!v.note,
        isRecommended: !!v.isRecommended,
        downloadUrl: v.downloadUrl || '',
        hasDownload: hasDownload,
        sourceLine: v.downloadSource ? ('来源：' + v.downloadSource) : '',
        hasSource: !!v.downloadSource
      });
    }
    let linked = 0;
    for (let j = 0; j < versions.length; j++) {
      if (versions[j].hasDownload) {
        linked++;
      }
    }
    let disclaimer =
      '「去下载」为第三方链接，请确认来源安全；本站不提供 ' +
      data.name +
      ' 的安装包。';
    if (!data.downloadUrl && linked === 0) {
      disclaimer = '本站不提供 ' + data.name + ' 安装包，请在官方渠道或应用宝下载对应版本。';
    }
    let autoUpdateTip =
      '请在应用市场（应用宝 / 华为 / 小米 / OPPO / vivo 等）关闭「' +
      data.name +
      '」的自动更新，避免版本被悄悄升级后脚本失效。';
    if (data.compat === 'specific') {
      autoUpdateTip += '当前仅支持指定版本，务必关闭自动更新。';
    }
    this.setData({
      showEmpty: false,
      showMain: true,
      showVersions: versions.length > 0,
      showNote: !!data.note,
      showOfficial: !!data.downloadUrl,
      hasPackage: !!data.package,
      appName: data.name,
      packageLine: data.package ? ('包名：' + data.package) : '',
      compatTag: data.compat === 'specific' ? '仅支持指定版本' : '全版本支持',
      compatTagBg: data.compat === 'specific' ? '#FFF6E8' : '#E8F6F4',
      compatTagColor: data.compat === 'specific' ? '#A35B00' : '#0B6E6A',
      localTag: st.tag,
      localTagBg: st.tagBg,
      localTagColor: st.tagColor,
      localDetail: st.detail,
      note: data.note || '',
      disclaimer: disclaimer,
      autoUpdateTip: autoUpdateTip,
      versions: versions,
      officialUrl: data.downloadUrl || ''
    });
  },

  onOpenOfficial() {
    let done = target.openDownload(this.data.officialUrl);
    if (!done.ok) {
      this.toast(done.message || '打开失败');
    }
  },

  onDownloadVersion(e) {
    let item = e && e.item ? e.item : null;
    if (!item || !item.downloadUrl) {
      this.toast('该版本暂无下载链接');
      return;
    }
    let done = target.openDownload(item.downloadUrl);
    if (!done.ok) {
      this.toast(done.message || '打开失败');
    }
  }
});
