const challonge = require('challonge');
const Tournament = require('./Tournament.js');
const Match = require('./Match.js');
const Participant = require('./Participant.js');

module.exports = class Challonge {
    constructor(guildSettings, config) {
        if (guildSettings.get('challonge') === undefined) {
            console.log("Challonge settings not found, creating.");
            guildSettings.set('challonge', {});
        }

        this.guildSettings = guildSettings;
        this._apiKey = config.apiKey;
        this._client = challonge.createClient({
            apiKey: this._apiKey
        });
    }

    get settings() { return this.guildSettings.get('challonge'); }
    set settings(settings) { this.guildSettings.set('challonge', settings); }

    async _tournamentGetAll() {
        return new Promise((resolve, reject) => {
            this._client.tournaments.index({
                callback: (err, data) => {
                    if (err) reject(err);
                    else resolve(data);
                }
            });
        });
    }

    async _tournamentGet(tournamentObj) {
        return new Promise((resolve, reject) => {
            this._client.tournaments.show({
                id: tournamentObj._id,
                callback: (err, data) => {
                    if (err) reject(err);
                    else resolve(data);
                }
            });
        });
    }

    async _tournamentCreate(tournamentObj) {
        return new Promise((resolve, reject) => {
            this._client.tournaments.create({
                tournament: tournamentObj._challongeObj,
                callback: (err, data) => {
                    if (err) reject(err);
                    else resolve(data);
                }
            });
        });
    }

    async _tournamentUpdate(tournamentsObj, callback) {
        return new Promise((resolve, reject) => {
            this._client.tournaments.update({
                id: tournamentsObj._id,
                tournament: tournamentObj._challongeObj,
                callback: (err, data) => {
                    if (err) reject(err);
                    else resolve(data);
                }
            });
        });
    }

    async _tournamentDestroy(tournamentsObj) {
        return new Promise((resolve, reject) => {
            this._client.tournaments.destroy({
                id: tournamentsObj._id,
                callback: (err, data) => {
                    if (err) reject(err);
                    else resolve(data);
                }
            });
        });
    }

    async _tournamentProcessCheckIns(tournamentsObj) {
        return new Promise((resolve, reject) => {
            this._client.tournaments.processCheckIns({
                id: tournamentsObj._id,
                callback: (err, data) => {
                    if (err) reject(err);
                    else resolve(data);
                }
            });
        });
    }

    async _tournamentAbortCheckIn(tournamentsObj) {
        return new Promise((resolve, reject) => {
            this._client.tournaments.abortCheckIn({
                id: tournamentsObj._id,
                callback: (err, data) => {
                    if (err) reject(err);
                    else resolve(data);
                }
            });
        });
    }

    async _tournamentStart(tournamentsObj) {
        return new Promise((resolve, reject) => {
            this._client.tournaments.start({
                id: tournamentsObj._id,
                callback: (err, data) => {
                    if (err) reject(err);
                    else resolve(data);
                }
            });
        });
    }

    async _tournamentFinalize(tournamentsObj) {
        return new Promise((resolve, reject) => {
            this._client.tournaments.finalize({
                id: tournamentsObj._id,
                callback: (err, data) => {
                    if (err) reject(err);
                    else resolve(data);
                }
            });
        });
    }

    async _tournamentReset(tournamentsObj) {
        return new Promise((resolve, reject) => {
            this._client.tournaments.reset({
                id: tournamentsObj._id,
                callback: (err, data) => {
                    if (err) reject(err);
                    else resolve(data);
                }
            });
        });
    }

    async _participantsGetAll(tournamentsObj) {
        return new Promise((resolve, reject) => {
            this._client.participants.index({
                id: tournamentsObj._id,
                callback: (err, data) => {
                    if (err) reject(err);
                    else resolve(data);
                }
            })
        });
    }

    async _participantsGet(tournamentsObj, participantsObj) {
        return new Promise((resolve, reject) => {
            this._client.participants.show({
                id: tournamentsObj._id,
                participantId: participantsObj._id,
                callback: (err, data) => {
                    if (err) reject(err);
                    else resolve(data);
                }
            })
        });
    }

    async _participantsCreate(tournamentsObj, participantsObj) {
        return new Promise((resolve, reject) => {
            this._client.participants.create({
                id: tournamentsObj._id,
                participant: participantsObj._challongeObj,
                callback: (err, data) => {
                    if (err) reject(err);
                    else resolve(data);
                }
            })
        });
    }

    async _participantsUpdate(tournamentsObj, participantsObj) {
        return new Promise((resolve, reject) => {
            this._client.participants.update({
                id: tournamentsObj._id,
                participantId: participantsObj._id,
                participant: participantsObj._challongeObj,
                callback: (err, data) => {
                    if (err) reject(err);
                    else resolve(data);
                }
            })
        });
    }

    async _participantsDestroy(tournamentsObj, participantsObj) {
        return new Promise((resolve, reject) => {
            this._client.participants.destroy({
                id: tournamentsObj._id,
                participantId: participantsObj._id,
                callback: (err, data) => {
                    if (err) reject(err);
                    else resolve(data);
                }
            })
        });
    }

    async _participantsRandomize(tournamentsObj) {
        return new Promise((resolve, reject) => {
            this._client.participants.randomize({
                id: tournamentsObj._id,
                callback: (err, data) => {
                    if (err) reject(err);
                    else resolve(data);
                }
            })
        });
    }

    async _matchesGetAll(tournamentsObj) {
        return new Promise((resolve, reject) => {
            this._client.matches.index({
                id: tournamentsObj._id,
                callback: (err, data) => {
                    if (err) reject(err);
                    else resolve(data);
                }
            })
        });
    }

    async _matchesGet(tournamentsObj, matchesObj) {
        return new Promise((resolve, reject) => {
            this._client.matches.show({
                id: tournamentsObj._id,
                matchId: matchesObj._id,
                callback: (err, data) => {
                    if (err) reject(err);
                    else resolve(data);
                }
            })
        });
    }

    async _matchesUpdate(tournamentsObj, matchesObj) {
        return new Promise((resolve, reject) => {
            this._client.matches.update({
                id: tournamentsObj._id,
                matchId: matchesObj._id,
                match: matchesObj._challongeObj,
                callback: (err, data) => {
                    if (err) reject(err);
                    else resolve(data);
                }
            })
        });
    }
}