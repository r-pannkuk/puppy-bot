const Discord = require('discord.js');

const config = require('./config.json')
const Trap = require('./Trap.js');
const User = require('./User.js');
const RichEmbedBuilder = require('./RichEmbedBuilder.js');


module.exports = class BattleSystem {
    constructor(guildSettings) {
        if (guildSettings.get('battle') === undefined) {
            console.log("Battle settings not found, creating.");
            guildSettings.set('battle', {});
        }

        this.guildSettings = guildSettings;

        var battle = guildSettings.get('battle');

        if (battle.users === undefined) {
            console.log("Users not found, creating.");
            battle.users = {};
        }

        if (battle.items === undefined) {
            console.log("Items not found, creating.");
            battle.items = config.items;
        }

        if (battle.levels === undefined) {
            console.log("Levels not found, creating.");
            battle.levels = config.levels;
        }

        if (battle.traps === undefined) {
            console.log("Traps not found, creating.");
            battle.traps = {};
        }

        this.guildSettings.set('battle', battle);

        for (var user in this.users) {
            this.serialize_user(user);
        }

    }

    get settings() { return this.guildSettings.get('battle'); }
    set settings(obj) { this.guildSettings.set('battle', obj); }

    get traps() { return this.settings.traps; }
    get users() { return this.settings.users; }

    serialize_user(user_id) {
        var temp = this.settings;
        var storedUser = temp.users[user_id];

        // Creating a user object from existing user, or creating new one if none exists.
        var user = new User(storedUser || { _id: user_id });

        temp.users[user_id] = user;

        this.settings = temp;

        return user;
    }

    retrieve(user_id) {
        var stats = this.users[user_id];

        if (stats === undefined) {
            stats = this.serialize_user(user_id);
        }

        return stats;
    }

    set(user_id, stats) {
        var temp = this.settings;
        temp.users[user_id] = stats;

        this.settings = temp;
    }

    addTrap(message, phrase, user, callback) {
        var temp = this.settings;
        var key = phrase.toLowerCase();

        if (Object.values(temp.traps).find(t => t.phrase.toLowerCase() === key)) {
            return false;
        }

        var userObj = this.retrieve(user.id);

        if (userObj.traps.length >= 1) {
            return false;
        }

        var newTrap = new Trap({
            phrase: phrase,
            userid: user.id,
            createdAt: Date.now(),
            callback: callback,
            messageId: message.id
        });

        temp.traps[newTrap.id] = newTrap;

        userObj.traps.push(newTrap.id);
        temp.users[userObj.id] = userObj;

        this.guildSettings.set('battle', temp);

        return true;
    }

    trapList() {
        return this.settings.traps;
    }

    getTrap(id) {
        return new Trap(this.settings.traps[id]);
    }

    removeTrap(trapWord) {
        var temp = this.settings;
        var trap = new Trap(Object.values(temp.traps).find(t => t.phrase === trapWord));
        var user = this.retrieve(trap.userid);

        user.traps.splice(user.traps.indexOf(trap.id), 1);

        delete temp.traps[trap.id];
        temp.users[user.id] = user;

        this.settings = temp;

        return trap;
    }

    springTrap(message, trapWord) {
        var trap = this.removeTrap(trapWord);

        var temp = this.settings;
        var owner = this.retrieve(message.author.id);
        var victim = this.retrieve(trap.userid)

        victim.damage(owner, trap.getDamage());

        if (trap !== undefined) {
            var embed = RichEmbedBuilder.trapTriggered(trap, message);

            message.channel.send(embed);

            var trapChannelID = message.guild.admin.trapChannelID;

            if (trapChannelID !== null) {
                var channel = message.client.channels.get(trapChannelID);
                channel.send(embed).catch((error) => console.log(error));
            }
        }

        this.settings = temp;
    }
};