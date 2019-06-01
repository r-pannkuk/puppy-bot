const challonge = require('challonge');

module.exports = class Challonge {
    constructor(guildSettings, config) {
        this._apiKey = config.apiKey;
        this._client = challonge.createClient({
            apiKey: this._apiKey
        });
    }

    getTournament(tournamentID, callback) {
        var tournament = this._client.tournaments.show({
            id: tournamentID,
            callback: callback
        });
    }
}