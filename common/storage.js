let storage = {
    get(key, type) {
        if (type == undefined) {
            type = 'string';
        }
        Log.log('key:' + key + ':type:' + type);
        if (type == 'string') {
            return Storage.get(key);
        }
        if (type == 'int') {
            return Storage.getInteger(key);
        }
        if (type == 'float') {
            return Storage.getDouble(key);
        }
        if (type == 'object') {
            return Storage.getObj(key);
        }
        if (type == 'bool') {
            return Storage.getBoolean(key);
        }
        return undefined;
    },

    exist(key) {
        return Storage.exist(key);
    },

    isFloat(num) {
        return num % 1 !== 0;
    },

    set(key, value) {
        if (typeof value == 'string') {
            Storage.put(key, value);
        } else if (typeof value == 'boolean') {
            Storage.putBoolean(key, value);
        } else if (typeof value == 'object') {
            Storage.putDouble(key, value);
        } else if (typeof value == 'undefined' || value == null) {
            Storage.putObj(key, value);
        } else if (typeof value === 'number' && isFinite(value) && Math.floor(value) === value) {
            Storage.putInteger(key, value);
        } else if (this.isFloat(value)) {
            Storage.putDouble(key, value);
        } else {
            Storage.putObj(key, value);
        }
        return true;
    }
};

module.exports = storage;
