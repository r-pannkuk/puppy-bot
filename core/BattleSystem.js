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
            if(this._enmap.get('admin') === undefined) {
                console.log("Admin settings not found, creating.");
                this._enmap.set('admin', {
                    trapChannelID: null
                });
            }

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

    getTrapChannel() {
        return this._enmap.get('admin').trapChannelID;
    }

    setTrapChannel(channel) {
        var admin = this._enmap.get('admin');

        admin.trapChannelID = channel.id;

        this._enmap.set('admin', admin);
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

    damage(victimId, damage, attackerId) {
        var victimStats = this.retrieve(victimId);
        var attackerStats = this.retrieve(attackerId);
        
        if(victimId !== attackerId) {
            attackerStats.xp += damage;
        }

        victimStats.hp -= damage;

        if(victimStats.hp <= 0) {
            victimStats.hp = 0;
        }

        this.set(victimId, victimStats);
        this.set(attackerId, attackerStats);

        return victimStats.hp;
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

        traps[key] = this.generateTrap(phrase, user.id, Date.now(), callback, message);

        status.trapActive = true;

        this._enmap.set('traps', traps);

        this.set(user.id, status);

        return true;
    }

    generateTrap(phrase, owner_id, startTime, callback, message) {
        return {
            phrase: phrase,
            ownerId: owner_id,
            startTime: startTime,
            callback: callback,
            messageId: message.id,
            getDamage: function() {
                var hours = Math.floor((Date.now() - this.startTime) / (60*60*1000));
    
                var damage = 0;
    
                for(var i = 0; i < hours; ++i) {
                    ++damage;
    
                    // 8 Hours
                    if(i >= 8) {
                        ++damage;
                    }
                    // 1 Day
                    if(i >= 24) {
                        ++damage;
                    }
                    // 3 Days
                    if(i >= 72) {
                        ++damage;
                    }
                    // 1 Week
                    if(i >= 168) {
                        ++damage;
                    }
                    // 2 Weeks
                    if(i >= 336) {
                        ++damage;
                    }
                    // 3 Weeks
                    if(i >= 504) {
                        ++damage;
                    }
                    // 4 Weeks
                    if(i >= 672) {
                        ++damage;
                    }
                }
    
                return damage;
            }
        };
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

            if(content === `!disarmtrap ${validKey}` || content === `!removetrap ${validKey}`) {
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

        var status = this.retrieve(trap.ownerId);

        delete traps[trapWord];

        status.trapActive = false;

        this._enmap.set('traps', traps);

        this.set(trap.ownerId, status);

        return trap;
    }

    springTrap(message, trapWord) {
        var trap = this.removeTrap(trapWord);
        var authorId = message.author.id;
        this.damage(authorId, trap.getDamage(), trap.ownerId);

        if(trap !== undefined) {
            trap.callback(trap, message);
        }
    }

    defaultTrapCallback(trap, message) {
        var victim = message.author;
        var owner = message.client.users.get(trap.ownerId);
        
        var embed = new Discord.RichEmbed()
        .setColor('RED');

        if(owner.id === victim.id) {
            embed.setAuthor(`${owner.username} Blew Themselves Up!`, 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/53/Skull_and_crossbones.svg/2000px-Skull_and_crossbones.svg.png')
        } 
        else {
            embed.setAuthor(`${owner.username}'s Trap Sprung!`, owner.avatarUrl);
        }

        var victimStats = this.retrieve(victim.id);

        if(victimStats.hp === 0) {
            embed.setThumbnail('https://www.galabid.com/wp-content/uploads/2017/11/rip-gravestone-md.png');
        }

        embed.setDescription(
            `**Phrase**: ${trap.phrase}\n` + 
            `**Owner**: ${owner}\n` +
            `**Damage**: ${trap.getDamage()}\n\n` + 
            `**Victim**: ${victim}\n` +
            `**Remaining Health**: ${victimStats.hp}\n\n` +
            `*Traps deal more damage the longer they are alive for.*`);
        embed.setFooter(`Trap set at ${new Date(trap.startTime).toString()}`, owner.avatarUrl);

        message.channel.send(embed);

        var trapChannelID = this.getTrapChannel();

        if(trapChannelID !== null) {
            var channel = message.client.channels.get(trapChannelID);
            channel.send(embed);
        }
    }
};