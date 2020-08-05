const Discord = require('discord.js');
const commando = require('discord.js-commando');
const pyShell = require('python-shell');

const EmbedBuilder = require('../../core/simulator/EmbedBuilder.js');


module.exports = class SimulateCommand extends commando.Command {
    constructor(client) {
        super(client, {
            name: 'simulate',
            group: 'simulator',
            memberName: 'simulate',
            description: 'Generates text as if it was a specific user.',
            examples: ['!simulate Hazelyn'],
            argsPromptLimit: 0,
            args: [
                {
                    key: 'target',
                    prompt: "Please provide a simulator target.",
                    type: 'user'
                }
            ]
        });

        this._simulatedResponses = {};
    }

    /**
     * 
     * @param {Discord.GuildMember} target 
     * @param {Function.<Error, any>} callback 
     */
    getGenerated(target, callback) {
        pyShell.run('gpt_generate.py', {
            mode: 'text',
            pythonOptions: ['-u'],
            pythonPath: 'python3',
            scriptPath: '../../core/simulator/',
            args: ['run', target.id]
        }, function (err, results) {
            if(err) {
                console.log(err);
            }
            
            callback(err, results);
        });
    }

    /**
     * 
     * @param {Discord.Message} message 
     * @param {Object} args
     * @param {Discord.User} args.target
     */
    async run(message, { target }) {
        target = message.guild.members.cache.get(target.id);

        if (this._simulatedResponses[target.id] === undefined) {
            message.channel.send(`Initializing for ${target.displayName}...`);
            
            this.getGenerated(target, (err, results) => {
                if (err) {
                    message.channel.send(err);
                } else {
                    this._simulatedResponses[target.id] = results;
                    message.channel.send(
                        new EmbedBuilder.generatedMessage(
                            target,
                            this._simulatedResponses[target.id].shift()
                        )
                    );
                }
            })
        } else {
            message.channel.send(
                new EmbedBuilder.generatedMessage(
                    target,
                    this._simulatedResponses[target.id].shift()
                )
            );

            if (this._simulatedResponses[target.id].length < 5) {
                this.getGenerated(target, (err, results) => {
                    if (err) {
                        message.channel.send(err);
                    } else {
                        this._simulatedResponses[target.id].concat(results);
                    }
                })
            }
        }

    }
}
