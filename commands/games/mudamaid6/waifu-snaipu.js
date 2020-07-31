const commando = require('discord.js-commando');
const Discord = require('discord.js');

const GameKeys = require('../../../core/games/GameKeys.js');


module.exports = class WaifuSnaipuCommand extends commando.Command {
    constructor(client) {
        super(client, {
            name: 'waifu-snaipu',
            group: 'games',
            memberName: 'waifu-snaipu',
            description: 'Snipes a waifu from Mudamaid.',
            examples: [ '!waifu-snaipu Doggo' ],
            adminOnly: true,
            args: [
                {
                    key: 'waifu',
                    prompt: 'Enter your waifu\'s or husbando\'s name.',
                    type: 'string',
                    default: ''
                }
            ]
        });
    }

    
    async run(message, {waifu}) {
        // var guild = message.guild;

        // if(waifu !== '') {
        //     guild.gameManager.set(GameKeys.Mudamaid6, message.author.id, 'waifu', waifu);
        // }

        // var waifuTracker = guild.gameManager.get(GameKeys.Mudamaid6, message.author.id, 'waifu');

        // if(waifuTracker !== undefined) {
        //     message.channel.send(`Tracking ${message.author}'s Waifu / Husbando: ${waifuTracker}`);
        // }
        // else {
        //     message.channel.send(`Not currently tracking a waifu or husbando.`);
        // }
    }
}