const Discord = require('discord.js');
const commando = require('discord.js-commando');
const Source = require('../../core/points/Source.js');
const Account = require('../../core/points/Account.js');

module.exports = class AwardChallongeCommand extends commando.Command {
    constructor(client) {
        super(client, {
            name: 'award-challonge',
            group: 'points',
            memberName: 'award-challonge',
            aliases: ['award-c', 'awardchallonge', 'awardc'],
            description: 'Pays out players based on challonge rankings.',
            examples: ['!award soku-123 total 1000', '!award soku-123 matches 1000 500 250'],
            argsPromptLimit: 0,
            guildOnly: true,
            args: [{
                    key: 'challonge',
                    prompt: "Please provide the user to award.",
                    type: 'string',
                    // validate: (val, msg, arg) => {
                    // },
                    parse: (val, msg, arg) => {
                        if (val.match(/[-a-zA-Z0-9@:%_\+.~#?&//=]{2,256}\.[a-z]{2,4}\b(\/[-a-zA-Z0-9@:%_\+.~#?&//=]*)?/gi)) {
                            return this.stripChallongeID(val);
                        }

                        return val;
                    }
                },
                {
                    key: 'point_allocation',
                    prompt: 'Please enter a point allocation from the following: **total**, **matches**, **games**, **rank**.',
                    type: 'string',
                    oneOf: ['total', 'matches', 'games', 'rank']
                },
                {
                    key: 'amounts',
                    prompt: "Enter the amounts to award the players with.",
                    type: 'integer',
                    infinite: true
                }
            ]
        });
    }

    stripChallongeID(challonge) {
        var result = '';
        if (challonge.indexOf('https://') === 0) {
            challonge = challonge.substr(8);
        }

        if (challonge.indexOf('challonge.com') !== 0) {
            result += challonge.substr(0, challonge.indexOf('.')) + '-';
            challonge = challonge.substr(challonge.indexOf('.') + 1);
        }

        result += challonge.substr(challonge.indexOf('.com/') + 5);

        return result;
    }

    async run(message, { challonge, point_allocation, amounts }) {
        if (!msg.guild.members.get(msg.author.id).hasPermission('MANAGE_CHANNELS')) {
            msg.channel.send(`You don't have permission to use that command.`);
            return;
        }

        var tournament = await message.guild.challonge._tournamentGet({ _id: challonge });

        if (tournament.tournament.state !== 'complete') {
            message.channel.send(`Tournament **${challonge}** has not been completed.  Please wait until it has finished to award players.`);
            return;
        }

        var participants = Object.values(await message.guild.challonge._participantsGetAll({ _id: challonge }));
        var matches = Object.values(await message.guild.challonge._matchesGetAll({ _id: challonge }));

        var participantPerformances = participants
            .filter(p => p.participant.finalRank !== null)
            .map(p => {
                return {
                    id: p.participant.id,
                    challongeId: p.participant.challongeUsername,
                    displayName: p.participant.displayName,
                    rank: p.participant.finalRank,
                    wonMatches: matches.
                    filter(m => m.match.winnerId === p.participant.id)
                    .length,
                    wonGames: matches
                        .filter(m => m.match.player1Id === p.participant.id)
                        .reduce((prev, m) => {
                            var scores = m.match.scoresCsv.split('-').map(i => parseInt(i));
                            return prev + scores[0];
                        }, 0) +
                        matches
                        .filter(m => m.match.player2Id === p.participant.id)
                        .reduce((prev, m) => {
                            var scores = m.match.scoresCsv.split('-').map(i => parseInt(i));
                            return prev + scores[1];
                        }, 0)
                }
            });

        /* Sorting and assigning shares to participants based on the type of
         * point allocation that was decided upon.  
         */
        switch (point_allocation) {
            case 'rank':
            case 'total':
                var sortedUsers = participantPerformances.sort((p1, p2) => {
                    return p1.rank - p2.rank;
                }).map(u => {
                    u.shares = participantPerformances.length - u.rank;
                    return u;
                });
                break;
            case 'matches':
                var sortedUsers = participantPerformances.sort((p1, p2) => {
                    return p2.wonMatches - p1.wonMatches;
                }).map(u => {
                    u.shares = u.wonMatches;
                    return u;
                });
                break;
            case 'games':
                var sortedUsers = participantPerformances.sort((p1, p2) => {
                    return p2.wonGames - p1.wonGames;
                }).map(u => {
                    u.shares = u.wonGames;
                    return u;
                });
                break;
        }

        var source = new Source({
            _type: Source.TYPE.Tournament,
            _id: challonge
        });

        var totalShares = sortedUsers.reduce((prev, u) => prev + u.shares, 0);

        var finalAmount = null;

        for (var i in sortedUsers) {
            var userResult = sortedUsers[i];

            if (i >= amounts.length - 1) {
                finalAmount = finalAmount || amounts[amounts.length - 1];
                userResult.award = Math.ceil(finalAmount * userResult.shares / totalShares) || 0;
                finalAmount -= userResult.award;
            } else {
                userResult.award = amounts[i];
            }

            totalShares -= userResult.shares;

            if (userResult.award === 0) {
                continue;
            }

            var user = message.guild.pointSystem.getUserByAccount(new Account({
                _service: Account.SERVICE.Challonge,
                _username: userResult.challongeId || userResult.displayName
            }));

            if (!user) {
                message.channel.send(`Attempted to find a user for **${userResult.displayName}**, but none was found.  Would have awarded **${userResult.award}**`);
                continue;
            }

            var award = message.guild.pointSystem.awardUser(
                user,
                message.author,
                userResult.award,
                source
            );

            if (award !== undefined) {
                message.channel.send(`${message.guild.members.get(user._id)} was awarded **${award._amount}** by ${message.author} for: Placing [**${parseInt(i) + 1}**] in **${challonge}**.`);
            } else {
                message.channel.send(`Something went wrong.  No award given.`);
            }
        }
    }
}