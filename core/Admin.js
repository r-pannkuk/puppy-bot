const Enmap = require('enmap');
const EnmapSQLite = require('enmap-sqlite');
const Discord = require('discord.js');

module.exports = class Admin {
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
                    deleteChannelID: null,
                    trapChannelID: null
                });
            }
        });
    }

    getDeleteChannel() {
        return this._enmap.get('admin').deleteChannelID;
    }

    getTrapChannel() {
        return this._enmap.get('admin').trapChannelID;
    }

    setTrapChannel(channel) {
        var admin = this._enmap.get('admin');

        admin.trapChannelID = channel.id;

        this._enmap.set('admin', admin);
    }

    setDeleteChannel(channel) {
        var admin = this._enmap.get('admin');

        admin.deleteChannelID = channel.id;

        this._enmap.set('admin', admin);
    }
}