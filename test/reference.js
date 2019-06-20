var settings = {
    users: {},
    get: function(id) {
        return this.users[id];
    }
}

settings.users[1] = {
    _id: 10000
};

var test = function(settings) {
    settings.get(1).currentBalance = 50000
}

test(settings);

console.log(settings);