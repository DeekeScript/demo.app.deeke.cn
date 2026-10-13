let config = require('./config.js');
let device = require('./device.js');
let update = require('./update.js');

let MAX_FILES = 14;

function pad(n) {
  return n < 10 ? '0' + n : String(n);
}

function formatDateTime(d) {
  return (
    d.getFullYear() +
    '-' +
    pad(d.getMonth() + 1) +
    '-' +
    pad(d.getDate()) +
    ' ' +
    pad(d.getHours()) +
    ':' +
    pad(d.getMinutes()) +
    ':' +
    pad(d.getSeconds())
  );
}

function nowText() {
  return formatDateTime(new Date());
}

function todayName() {
  let d = new Date();
  return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()) + '.txt';
}

function logsDir() {
  let base = '';
  try {
    base = Files.getFilesPath();
  } catch (e) {
    base = '';
  }
  if (!base) {
    return '';
  }
  let dir = base + '/logs';
  try {
    if (!Files.exists(dir)) {
      Files.mkdirs(dir);
    }
  } catch (e2) {}
  return dir;
}

function todayPath() {
  let dir = logsDir();
  if (!dir) {
    return '';
  }
  return dir + '/' + todayName();
}

function ensureHeader(path) {
  try {
    if (Files.exists(path)) {
      let cur = Files.read(path) || '';
      if (cur) {
        return;
      }
    }
  } catch (e) {}
  let head =
    '=== Deeke Diagnostic Log ===\n' +
    'app: ' +
    (config.appName || '') +
    '\n' +
    'tool: ' +
    (config.toolCode || '') +
    '\n' +
    'device: ' +
    device.getDeviceId() +
    '\n' +
    'version: ' +
    update.currentVersionName() +
    ' (' +
    update.currentVersionCode() +
    ')\n' +
    '---\n';
  try {
    Files.write(path, head);
  } catch (e2) {}
}

function pruneOldFiles(dir) {
  let names = [];
  try {
    names = Files.list(dir) || [];
  } catch (e) {
    return;
  }
  let files = [];
  for (let i = 0; i < names.length; i++) {
    let n = String(names[i] || '');
    if (/\.txt$/i.test(n)) {
      files.push(n);
    }
  }
  files.sort();
  while (files.length > MAX_FILES) {
    let old = files.shift();
    try {
      Files.delete(dir + '/' + old);
    } catch (e2) {}
  }
}

function push(level, tag, message) {
  let line =
    nowText() +
    ' [' +
    (level || 'I') +
    ']' +
    (tag ? ' ' + tag : '') +
    ' ' +
    String(message == null ? '' : message) +
    '\n';
  let path = todayPath();
  if (path) {
    ensureHeader(path);
    try {
      Files.append(path, line);
    } catch (e) {}
    pruneOldFiles(logsDir());
  }
  try {
    console.log(line.trim());
  } catch (e2) {}
}

function listFiles() {
  let dir = logsDir();
  if (!dir) {
    return [];
  }
  let names = [];
  try {
    names = Files.list(dir) || [];
  } catch (e) {
    return [];
  }
  let files = [];
  for (let i = 0; i < names.length; i++) {
    let n = String(names[i] || '');
    if (!/\.txt$/i.test(n)) {
      continue;
    }
    let path = dir + '/' + n;
    let sizeText = '';
    try {
      let content = Files.read(path) || '';
      let bytes = content.length;
      if (bytes >= 1024) {
        sizeText = (Math.round((bytes / 1024) * 10) / 10) + ' KB';
      } else {
        sizeText = bytes + ' B';
      }
    } catch (e2) {
      sizeText = '';
    }
    let mtime = 0;
    try {
      mtime = Files.lastModified(path) || 0;
    } catch (e3) {
      mtime = 0;
    }
    let updatedText = mtime > 0 ? formatDateTime(new Date(mtime)) : '';
    let detailParts = [];
    if (updatedText) {
      detailParts.push('更新 ' + updatedText);
    }
    if (sizeText) {
      detailParts.push(sizeText);
    }
    detailParts.push('点击分享');
    files.push({
      name: n,
      path: path,
      title: n.replace(/\.txt$/i, ''),
      sizeText: sizeText,
      updatedText: updatedText,
      mtime: mtime,
      detail: detailParts.join(' · ')
    });
  }
  // 最近更新在前
  files.sort(function (a, b) {
    if (a.mtime !== b.mtime) {
      return (b.mtime || 0) - (a.mtime || 0);
    }
    if (a.name < b.name) {
      return 1;
    }
    if (a.name > b.name) {
      return -1;
    }
    return 0;
  });
  return files;
}

/**
 * 分享日志文件：Share.shareFile（底座 FileProvider + createChooser）。
 * 不要对 Share 使用 typeof（Rhino 会报错）。失败不写剪贴板，提示路径即可。
 */
function shareFile(path, displayName) {
  let title = (config.appName || 'Deeke') + ' 诊断日志 ' + (displayName || '');
  let absPath = String(path || '');
  try {
    let content = Files.read(absPath) || '';
    if (!String(content).trim()) {
      return { ok: false, path: absPath, message: '日志文件为空\n位置：' + absPath };
    }
  } catch (eRead) {
    return { ok: false, path: absPath, message: '读取日志失败\n位置：' + absPath };
  }

  try {
    let r = Share.shareFile(absPath, title, 'text/plain');
    if (r && r.ok) {
      return { ok: true, via: 'Share.shareFile', path: absPath };
    }
    let detail = (r && r.message) ? String(r.message) : '当前环境不支持分享';
    return {
      ok: false,
      path: absPath,
      unsupported: true,
      message: detail + '\n日志位置：' + absPath
    };
  } catch (e1) {
    return {
      ok: false,
      path: absPath,
      unsupported: true,
      message: '当前环境不支持分享\n日志位置：' + absPath
    };
  }
}

module.exports = {
  maxFiles: MAX_FILES,

  info(tag, message) {
    push('I', tag, message);
  },

  warn(tag, message) {
    push('W', tag, message);
  },

  error(tag, message) {
    push('E', tag, message);
  },

  listFiles: listFiles,

  clear() {
    let dir = logsDir();
    if (!dir) {
      return;
    }
    let names = [];
    try {
      names = Files.list(dir) || [];
    } catch (e) {
      return;
    }
    for (let i = 0; i < names.length; i++) {
      try {
        Files.delete(dir + '/' + names[i]);
      } catch (e2) {}
    }
  },

  shareFile(path, displayName) {
    return shareFile(path, displayName);
  },

  shareByName(name) {
    let dir = logsDir();
    if (!dir || !name) {
      return { ok: false, message: '文件不存在' };
    }
    return shareFile(dir + '/' + name, String(name).replace(/\.txt$/i, ''));
  }
};
