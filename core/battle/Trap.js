const uuid = require('uuid/v1');

module.exports = class Trap {
    constructor({
        id = uuid(),
        phrase = null,
        userid = null,
        createdAt = Date.now(),
        callback = null,
        messageId = null,
        getDamage = function () {
            var hours = Math.floor((Date.now() - this.createdAt) / (60 * 60 * 1000));

            var damage = 0;

            for (var i = 0; i < hours; ++i) {
                ++damage;

                // 8 Hours
                if (i >= 8) {
                    ++damage;
                }
                // 1 Day
                if (i >= 24) {
                    ++damage;
                }
                // 3 Days
                if (i >= 72) {
                    ++damage;
                }
                // 1 Week
                if (i >= 168) {
                    ++damage;
                }
                // 2 Weeks
                if (i >= 336) {
                    ++damage;
                }
                // 3 Weeks
                if (i >= 504) {
                    ++damage;
                }
                // 4 Weeks
                if (i >= 672) {
                    ++damage;
                }
            }

            return damage;
        }
    }) {
        this.id = id;
        this.phrase = phrase;
        this.userid = userid;
        this.createdAt = createdAt;
        this.callback = callback;
        this.messageId = messageId;
        this.getDamage = getDamage;
    }
}