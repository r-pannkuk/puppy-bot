const commando = require('discord.js-commando');
const Discord = require('discord.js');
const request = require('request-promise-native')

const GameKeys = require('../GameKeys.js');

module.exports = class MHWHost extends commando.Command {
    constructor(client) {
        super(client, {
            name: 'mhw-db',
            group: 'games',
            memberName: 'mhw-db',
            description: `Look up Monster Hunter World info.  Please make sure to use 'query=...' with one of the following: 
            armor, armor-set[s], charm[s], item[s], value[s] / motion-value[s], skill[s], weapon[s]`,
            argsPromptLimit: 0,
            examples: [ '!mhw-db query=armor id=123' ],
            args: [
                {
                    key: 'searchParams',
                    prompt: `Search parameters for the Monster Hunter World database.`,
                    infinite: true,
                    label: 'search query',
                    validate: (val) => {
                        if(!val) return false;
                        if(!val.match(/[.\S]*=[.\S]*/)) return false;
                        return true;
                    },
                    parse: val => {
                        var queries = val.split('=');

                        return queries;
                    }
                }
            ]
        });
    }

    
    async run(message, { searchParams }) {
        var queryObj = searchParams.reduce((accum, curr) => {
            accum[curr[0]] = curr[1]; 
            return accum; 
        }, {});

        function invalidQueryError() {
            message.channel.send(`Invalid query string.  Please use one of the following:
            query=armor
            query=armor-set[s]
            query=charm[s]
            query=item[s]
            query=value[s]
            query=motion-value[s]
            query=skill[s]
            query=weapon[s]`);
        }

        var query = queryObj.query;

        if(query === undefined) {
            invalidQueryError();
            return;
        }
                        
        var endpoint = 'https://mhw-db.com/';

        switch(query) {
            case 'armor':
                endpoint += 'armor';
                break;
            case 'armor-set':
            case 'armor-sets':
                endpoint += 'armor/sets';
                break;
            case 'charm':
            case 'charms':
                endpoint += 'charms';
                break;
            case 'decoration':
            case 'decorations':
                endpoint += 'decorations';
                break;
            case 'item':
            case 'items':
                endpoint += 'items';
                break;
            case 'value':
            case 'values':
            case 'motion-value':
            case 'motion-values':
                endpoint += 'motion-values';
                break;
            case 'skill':
            case 'skills':
                endpoint += 'skills';
                break;
            case 'weapon':
            case 'weapons':
                endpoint += 'weapons';
                break;
            default:
                invalidQueryError();
                return;
        }

        var params = queryObj;
        delete params.query;

        request.get(endpoint).then(data => {
            data = JSON.parse(data);

            var results = data.filter(entry => {
                for(var key in params) {
                    if(!(key in entry) || (typeof(entry[key]) === 'string') ? entry[key].indexOf(params[key]) === -1 : entry[key].toString() !== params[key].toString()) {
                        return false;
                    }
                }

                return true;
            });

            console.log(results.length);

            if(results.length > 1) {
                results = results.map(result => `#**${result.id}**: ${result.name} ${(result.slug !== undefined) ? '(*' + result.slug + '*)\n' : ''}`);

                results = [`Found results for [${message.argString} ]:\n`].concat(results);

                var length = 0;
                var index = 0;
                var LIMIT = 2000;

                var parts = [""];

                for(var i in results) {
                    if(length + results[i].length > 2000) {
                        ++index;
                        length = 0;

                        parts.push("");
                    }

                    parts[index] += results[i];
                    length += results[i].length;
                }

                message.channel.send(`Found ${results.length} results for [${message.argString} ].  Sent to ${message.author}.`);
                parts.forEach(conjoinedText => message.author.send(conjoinedText));
            }
            else if(results.length === 0) {
                message.channel.send(`No results found for [${message.argString}].`);
            }
            else {
                var result = results[0];

                var richEmbed = new Discord.RichEmbed()
                .setThumbnail(result.assets.imageFemale)
                .setTitle(result.name)
                .setFooter(result.id + ':' + result.slug);

                switch(query) {
                case 'armor':
                case 'armor-set':
                case 'armor-sets':
                case 'charm':
                case 'charms':
                case 'decoration':
                case 'decorations':
                case 'item':
                case 'items':
                case 'value':
                case 'values':
                case 'motion-value':
                case 'motion-values':
                case 'skill':
                case 'skills':
                case 'weapon':
                case 'weapons':
                Object.keys(result).forEach(key => {
                    if(!this.isEmpty(result[key])) richEmbed.addField(key, JSON.stringify(result[key]));
                });
                break;
                }

                message.channel.send(richEmbed);
            }
        });
    }

    isEmpty(value) {
        if(value === undefined) return true;
        if(value === null) return true;
        if(typeof value === 'string' && value.length === 0) return true;
        if(value.constructor === Array && value.length === 0) return true;
        if(typeof value === 'object' && value === {}) return true;
        return false;
    }
}