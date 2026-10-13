let config = require('./config.js');

module.exports = {
  appName: function () {
    return config.appName || '';
  }
};
