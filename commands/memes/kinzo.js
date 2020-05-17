const commando = require('discord.js-commando');
const pyShell = require('python-shell');


module.exports = class KinzoCommand extends commando.Command {
    constructor(client) {
        super(client, {
            name: 'kinzo',
            group: 'memes',
            aliases: ['kinzo', 'whine'],
            memberName: 'kinzo',
            description: 'This is really dumb.',
            examples: ['!kinzo', '!kinzo @Dog What a horrible thought', '!kinzo https://discordapp.com/channels/478122196812693504/478122196812693506/708536816470458389'],
            argsPromptLimit: 0,
            args: [
                {
                    key: 'whineObject',
                    prompt: 'Provide a link to a discord message where a user is whining.',
                    parse: async (val, msg) => {
                        var isDiscordLink = /(https?:\/\/)?(www\.)?(discordapp\.com\/channels\/([0-9]+|\@me)\/[0-9]+\/[0-9]+)/g.test(val);

                        if (isDiscordLink) {
                            var parts = val.split('\/');

                            var guild = await this.client.guilds.get(parts[4]);
                            var channel = await guild.channels.get(parts[5]);
                            var message = await channel.fetchMessage(parts[6]);

                            console.log(`Guild was found?  ${guild !== null}`)
                            console.log(`Channel was found?  ${channel !== null}`)
                            console.log(`Message was found?  ${message !== null}`)
                            console.log(`User was found?  ${message.author !== null}`)

                            var user = await guild.member(message.author).displayName;
                            var content = message.content;
                        } else {
                            var parts = val.split(/ +/g);
                            var userID = parts[0].substr(2, parts[0].length - 3);

                            if(userID.startsWith('!')) {
                                userID = userID.substr(1);
                            }

                            parts.shift();

                            var user = msg.guild.member(userID).displayName;
                            var content = parts.join(' ');
                        }
                        return { user, content };
                    },
                    validate: async (val, msg) => {
                        var isDiscordLink = /(https?:\/\/)?(www\.)?(discordapp\.com\/channels\/([0-9]+|\@me)\/[0-9]+\/[0-9]+)/g.test(val);
                        if (isDiscordLink) {
                            var parts = val.split('\/');

                            var guild = await this.client.guilds.get(parts[4]);

                            if (!guild) {
                                msg.channel.send("This bot is not a member of that server.");
                                return false;
                            }

                            return true;
                        } else {
                            var parts = val.split(/ +/g);

                            return /<@(!)?[0-9]+>/g.test(parts[0]) && parts.length > 1;
                        }
                    }
                }
                // {
                //     key: 'user',
                //     prompt: "Enter a user who whines.",
                //     type: 'user',
                //     default: ''
                // },
                // {
                //     key: 'whine',
                //     prompt: "Please whine about something.",
                //     type: 'string',
                //     infinte: true,
                //     default: ''
                // }
            ]
        });
    }

    async run(source, { whineObject }) {
        var user = whineObject.user;
        var content = whineObject.content;

        pyShell.run('kinzo.py', {
            mode: 'text',
            pythonOptions: ['-u'],
            pythonPath: 'python3',
            scriptPath: './commands/memes/scripts/',
            args: [user.displayName || user.username, content]
        }, function (err, results) {
            console.log(err);
            // Trim white space and carriage return from the call
            if (results === undefined) {
                results = [];
            }
            results = results.map((value) => value.replace(/\s+/g, ''));
            source.channel.send({
                files: results
            });
        });
    }
}
