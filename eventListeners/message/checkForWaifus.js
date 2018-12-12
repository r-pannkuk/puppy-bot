const GameKeys = require('../../commands/games/GameKeys.js');

module.exports = function(client, message) {
    if(message.channel.type !== 'text') {
        return;
    }

    if(message.author === client.user) {
        return;
    }

    if(!(message.author.bot)) {
        return;
    }

    if(message.embeds.length === 0) {
        return;
    }

    var description = message.embeds[0].description.toLowerCase();

    if(description.match(/[\n]#[0-9]*[\n]?/g)) {
        return;
    }

    var title = message.embeds[0].author.name.toLowerCase();
    var waifus = message.guild.gameManager.getAll(GameKeys.Mudamaid6, 'waifu');

    var validKey = waifus.find(waifuTarget => 
        description.indexOf(waifuTarget.waifu.toLowerCase()) > -1 ||
        title.indexOf(waifuTarget.waifu.toLowerCase()) > -1
    );

    if(validKey !== undefined) {
        message.guild.gameManager.delete(GameKeys.Mudamaid6, validKey.user, 'waifu');
        message.react("💖");
    }
};