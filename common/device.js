let config = require('./config.js');

module.exports = {
  getDeviceId() {
    let key = config.storagePrefix + 'deviceId';
    let saved = Storage.get(key);
    if (saved) {
      return saved;
    }
    let id = '';
    try {
      id = Device.getUuid() || '';
    } catch (e) {
      id = '';
    }
    if (!id) {
      id = 'a-' + String(Date.now()) + Math.floor(Math.random() * 100000);
    }
    Storage.put(key, id);
    return id;
  }
};
