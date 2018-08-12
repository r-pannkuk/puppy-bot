module.exports = function(client) {
    client.user.setPresence({
        status: 'online',
        game: {
            name: 'Woof!',
            type: 'LISTENING'
        }
    });
};

