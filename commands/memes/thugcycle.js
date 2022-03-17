const Discord = require('discord.js');

const commando = require('discord.js-commando');
let {PythonShell} = require('python-shell');

THUGS_ID = '304354673647812608'

module.exports = class ThugCycleCommand extends commando.Command {
    constructor(client) {
        super(client, {
            name: 'thugcycle',
            group: 'memes',
            memberName: 'thugcycle',
            description: 'This is really dumb.',
            aliases: ['thugscycle'],
            examples: ['!thugcycle', '!thugcycle league'],
            hidden: true,
            args: [
                {
                    key: 'state',
                    prompt: "Please provide a state: league, ffxiv, wow, or none.",
                    type: 'string',
                    default: ''
                }
            ]
        });
    }

    async run(message, { state }) {

        /** @type {Discord.Guild} */
        var guild = message.guild
        var media = '';

        if (state !== '') {
            switch (state) {
                case 'league':
                case 'lol':
                    media = './commands/memes/media/thugcycle/ThugCycle_League.png';
                    break;
                case 'ffxiv':
                case 'ff14':
                case 'ff':
                    media = './commands/memes/media/thugcycle/ThugCycle_FF14.png';
                    break;
                case 'wow':
                case 'worldofwarcraft':
                case 'warcraft':
                    media = './commands/memes/media/thugcycle/ThugCycle_WoW.png';
                    break;
                case 'none':
                case 'any':
                default:
                    media = './commands/memes/media/thugcycle/ThugCycle_Any.png';
                    break;
            }
        } else {

            if (guild.members.cache.has(THUGS_ID)) {
                /** @type {Discord.GuildMember} */
                var Thugs = guild.members.cache.get(THUGS_ID);

                if (Thugs.presence.status === 'online') {
                    switch (Thugs.presence.game) {
                        case 'League of Legends':
                            media = './commands/memes/media/thugcycle/ThugCycle_League.png';
                            break;
                        case 'FINAL FANTASY XIV':
                            media = './commands/memes/media/thugcycle/ThugCycle_FF14.png';
                            break;
                        case 'World of Warcraft':
                        case 'World of Warcraft Classic':
                            media = './commands/memes/media/thugcycle/ThugCycle_WoW.png';
                            break;
                        default:
                            media = './commands/memes/media/thugcycle/ThugCycle_Any.png';
                            break;
                    }
                } else {
                    await message.channel.send("Thugs isn't online at the moment.");
                    return;
                }
            } else {
                message.channel.send("Thugs isn't in this server.");
                return;
            }
        }

        message.channel.send({
            files: [media]
        });
    }
}
