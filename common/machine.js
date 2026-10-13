let machine = {
    db() {
        return Storage;
    },

    get(key, type) {
        if (type == undefined) {
            type = 'string';
        }
        let db = this.db();
        Log.log('key:' + key + ':type:' + type);
        if (type == 'string') {
            return db.get(key);
        }
        if (type == 'int') {
            return db.getInteger(key);
        }
        if (type == 'float') {
            return db.getDouble(key);
        }
        if (type == 'object') {
            return db.getObj(key);
        }
        if (type == 'bool') {
            return db.getBoolean(key);
        }
        return undefined;
    },

    isFloat(num) {
        return num % 1 !== 0;
    },

    set(key, value) {
        let db = this.db();
        if (typeof value == 'string') {
            db.put(key, value);
        } else if (typeof value == 'boolean') {
            db.putBoolean(key, value);
        } else if (typeof value == 'object') {
            db.putDouble(key, value);
        } else if (typeof value == 'undefined' || value == null) {
            db.putObj(key, value);
        } else if (typeof value === 'number' && isFinite(value) && Math.floor(value) === value) {
            db.putInteger(key, value);
        } else if (this.isFloat(value)) {
            db.putDouble(key, value);
        } else {
            db.putObj(key, value);
        }
        return true;
    }
};

module.exports = machine;
