require('dotenv').config();

const Discord = require('discord.js');
const commando = require('discord.js-commando');
const bot = new commando.Client({
    owner: process.env.USER,
    unknownCommandResponse: false
});

bot.registry.registerGroup('rng', 'Random');
bot.registry.registerDefaults();
bot.registry.registerCommandsIn(__dirname + '/commands');

bot.login(process.env.TOKEN);