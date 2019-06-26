const Challonge = require('../core/challonge/Challonge.js');
const Tournament = require('../core/challonge/Tournament.js');
const Match = require('../core/challonge/Match.js');
const Participant = require('../core/challonge/Participant.js');

require('dotenv').config();

async function execute() {

    var guildSettings = { obj: {} };
    guildSettings.get = (id) => {
        return guildSettings.obj[id];
    };
    guildSettings.set = (id, obj) => {
        guildSettings.obj[id] = obj;
    };

    var client = new Challonge(guildSettings, { apiKey: process.env.CHALLONGE });

    var tournament = new Tournament({
        _challongeObj: {
            name: 'Test',
            tournamentType: 'single elimination',
            url: Date.now(),
            gameName: 'Touhou Hisoutensoku',
            subdomain: 'puppybot',
            description: 'testing tournament creation functionality',
            openSignup: false,
            holdThirdPlaceMatch: false,
            showRounds: true,
            private: true,
            signupCap: 123
        }
    });

    var tournament = await client._tournamentCreate(tournament).catch(err => console.log(err));
    var listedTournaments = await client._tournamentGetAll().catch(err => console.log(err));
    var ToT5 = await client._tournamentGet({
        _id: 'ToT05top8'
    });

    var matches = await client._matchesGetAll({
        _id: ToT5.tournament.url,
        _challongeObj: ToT5.tournament
    });
    var participants = await client._participantsGetAll({
        _id: ToT5.tournament.url,
        _challongeObj: ToT5.tournament
    });
}

execute();