const Enmap = require('enmap');
const EnmapLevel = require('enmap-level');

module.exports = class BattleSystem {
    constructor(settings) {
        this._enmap = new Enmap({
            provider: new EnmapLevel({
                name: settings.name
            })
        });

        this._levels = settings.levels;
        this._items = settings.items;
        this._traps = {};  // Will need to be an enmap eventually
    }
    
    retrieve(user) {
        var stats = this._enmap.get(user);

        if(stats === undefined) {
            stats = {
                xp: 0,
                inventory: [
                    this._items.pebble
                ],
                hp: 10
            };

            this._enmap.set(user, stats);
        }

        return stats;
    }

    set(user, stats) {
        this._enmap.set(user, stats);
    }

    addTrap(message, phrase, user, callback) {
        var key = phrase.toLowerCase();

        if(Object.keys(this._traps).indexOf(key) > -1) {
            return false;
        }

        this._traps[key] = {
            phrase: phrase,
            owner: user,
            startTime: Date.now(),
            callback: callback,
            messageId: message.id
        };

        return true;
    }

    checkForTraps(message) {
        if(message.channel.type !== 'text') {
            return;
        }

        var content = message.content.toLowerCase();
        var traps = this._traps;

        var validKey = Object.keys(this._traps).find(key => 
            content.indexOf(key) > -1 && traps[key].messageId !== message.id
        );

        if(validKey !== undefined) {
            this.springTrap(message, validKey);
        }
    }

    springTrap(message, trapWord) {
        var trap = this._traps[trapWord];

        delete this._traps[trapWord];

        trap.callback(trap, message);
    }
}