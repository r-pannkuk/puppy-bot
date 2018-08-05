module.exports = function(client) {
    client.channels.find(c => c.name = 'roles').fetchMessages({limit: 100});

    client.user.setPresence({
        status: 'online',
        game: {
            name: 'Woof!',
            type: 'LISTENING'
        }
    });
};

