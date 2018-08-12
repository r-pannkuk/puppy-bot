module.exports = function(client, message) {
    if(message.channel.type !== 'text') {
        return;
    }

    if(message.author === client.user) {
        return;
    }

    var content = message.content.toLowerCase();
    var traps = message.guild.battleSystem.traps;

    var validKey = Object.keys(traps).find(key => 
        content.indexOf(key) > -1 && traps[key].messageId !== message.id
    );

    if(validKey !== undefined) {

        if(content === `!disarmtrap ${validKey}` || content === `!removetrap ${validKey}`) {
            return;
        }

        client.emit('sprungTrap', { message: message, key: validKey });

        message.guild.battleSystem.springTrap(message, validKey);
    }
};