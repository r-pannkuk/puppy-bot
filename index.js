const Discord = require('discord.js');
const commando = require('discord.js-commando');
const bot = new commando.Client({
    owner: '260288776360820736',
    unknownCommandResponse: false
});

bot.registry.registerGroup('rng', 'Random');
bot.registry.registerDefaults();
bot.registry.registerCommandsIn(__dirname + '/commands');

bot.login('MzMxNjY5MDg2ODEzODE0Nzg0.DTczvA.sI8aNlARrl6VGDYdPkWJeCpLyfE');