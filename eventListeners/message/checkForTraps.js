module.exports = function(client, message) {
    if(message.channel.type !== 'text') {
        return;
    }

    var content = message.content.toLowerCase();
    var traps = client.battleSystem._enmap.get('traps');

    var validKey = Object.keys(traps).find(key => 
        content.indexOf(key) > -1 && traps[key].messageId !== message.id
    );

    if(validKey !== undefined) {

        if(content === `!disarmtrap ${validKey}` || content === `!removetrap ${validKey}`) {
            return;
        }

        client.emit('sprungTrap', { message: message, key: validKey });

        client.battleSystem.springTrap(message, validKey);
    }
};