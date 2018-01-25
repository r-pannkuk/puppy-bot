const Enmap = require('enmap');
const EnmapLevel = require('enmap-level');

module.exports = class PointSystem {
    constructor(settings) {
        this._enmap = new Enmap({
            provider: new EnmapLevel({
                name: settings.name
            })
        });

        this._levels = settings.levels;
        this._items = settings.items;
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
}