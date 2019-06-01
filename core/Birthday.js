const Discord = require('discord.js');

module.exports = class Admin {
    constructor(guildSettings) {
        if(guildSettings.get('birthday') === undefined) {
            console.log("Birthday settings not found, creating.");
            guildSettings.set('birthday', {
                
            });
        }

        this.guildSettings = guildSettings;
    }

    get birthdays() { return this.guildSettings.get('birthday'); }
    set birthdays(value) { this.guildSettings.set('birthday', value); }

    getUserBirthday(user_id) {
        return this.birthdays.get(user_id);
    }

    setUserBirthday(user_id, date, callback) {
        var birthdays = this.birthdays;

        this.birthdays[user_id] = {
            date: date,
            fn: callback
        };

        this.birthday = birthdays;
    }

    deleteUserBirthday(user_id) {
        var birthdays = this.birthdays;

        delete this.birthdays[user_id];

        this.birthdays = birthdays;
    }

    
}