const commando = require('discord.js-commando');
const Discord = require('discord.js');

module.exports = class GetTournament extends commando.Command {
    constructor(client) {
        super(client, {
            name: 'get-tournament',
            group: 'tournament',
            memberName: 'get-tournament',
            description: `Fetches a tournament from a given Challonge url.`,
            argsPromptLimit: 0,
            examples: [ '!get-tournament https://challonge.com/sokusat107' ],
            args: [
                {
                    key: 'url',
                    prompt: `URL for the tournament to pull data from.`,
                    infinite: false,
                    label: 'Tournament',
                    validate: (val) => {
                        if(!val) return false;
                        if(!val.match(/^(http:\/\/www\.|https:\/\/www\.|http:\/\/|https:\/\/)?(challonge.com\/).*/)) return false;
                        return true;
                    },
                    parse: (val) => val
                }
            ]
        });
    }

    
    async run(message, { url }) {
        message.guild.challonge.getTournament(url, (err, data) => {
            if(err) {
                message.channel.send(`Error: ${JSON.stringify(err)}`);
            } else {
                message.channel.send(`Tournament Found: ${data.name}`);
                console.log(data);
            }
        });
    }
}