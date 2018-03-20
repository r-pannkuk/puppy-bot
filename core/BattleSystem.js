const Enmap = require('enmap');
const EnmapSQLite = require('enmap-sqlite');
const Discord = require('discord.js');

module.exports = class BattleSystem {
    constructor(settings) {
        this._enmap = new Enmap({
            provider: new EnmapSQLite({
                name: settings.name
            })
        });

        this._enmap.defer.then(() => {
            if(this._enmap.get('users') === undefined) {
                console.log("Users not found, creating.");
                this._enmap.set('users', {});
            }
    
            if(this._enmap.get('items') === undefined) {
                console.log("Items not found, creating.");
                this._enmap.set('items', settings.items);
            }
    
            if(this._enmap.get('levels') === undefined) {
                console.log("Levels not found, creating.");
                this._enmap.set('levels', settings.levels);
            }
    
            if(this._enmap.get('traps') === undefined) {
                console.log("Traps not found, creating.");
                this._enmap.set('traps', {});
            }
        });
    }
    
    retrieve(user_id) {
        var users = this._enmap.get('users');

        var stats = users[user_id];

        if(stats === undefined) {
            stats = {
                xp: 0,
                inventory: [
                    this._enmap.get('items').pebble
                ],
                hp: 10
            };

            users[user_id] = stats;

            this._enmap.set('users', users);
        }

        return stats;
    }

    set(user, stats) {
        var users = this._enmap.get('users');
        users[user] = stats;

        this._enmap.set('users', users);
    }

    addTrap(message, phrase, user, callback) {
        var traps = this._enmap.get('traps');
        var key = phrase.toLowerCase();

        if(Object.keys(traps).indexOf(key) > -1) {
            return false;
        }

        var status = this.retrieve(user.id);

        if('trapActive' in status && status.trapActive) {
            return false;
        }

        traps[key] = {
            phrase: phrase,
            owner: {
                id: user.id,
                avatarUrl: user.avatarUrl,
                username: user.username
            },
            startTime: Date.now(),
            callback: callback,
            messageId: message.id
        };

        status.trapActive = true;


        this._enmap.set('traps', traps);

        this.set(user.id, status);

        return true;
    }

    checkForTraps(message) {
        if(message.channel.type !== 'text') {
            return;
        }

        var content = message.content.toLowerCase();
        var traps = this._enmap.get('traps');

        var validKey = Object.keys(traps).find(key => 
            content.indexOf(key) > -1 && traps[key].messageId !== message.id
        );

        if(validKey !== undefined) {

            if(content === `!disarmtrap ${validKey}`) {
                return;
            }

            this.springTrap(message, validKey);
        }
    }

    trapList() {
        return this._enmap.get('traps');
    }

    removeTrap(trapWord) {
        var traps = this._enmap.get('traps');

        var trap = traps[trapWord];

        var status = this.retrieve(trap.owner.id);

        delete traps[trapWord];

        status.trapActive = false;

        this._enmap.set('traps', traps);

        this.set(trap.owner.id, status);

        return trap;
    }

    springTrap(message, trapWord) {
        var trap = this.removeTrap(trapWord);

        if(trap !== undefined) { 
            trap.callback(trap, message);
        }
    }
}