const commando = require('discord.js-commando');
const Discord = require('discord.js');


module.exports = class AdminTrapCommand extends commando.Command {
    constructor(client) {
        super(client, {
            name: 'admintrap',
            group: 'traps',
            memberName: 'admintrap',
            description: 'Admin tool for adding traps with a custom timestamp.',
            examples: [ '!admintrap <phrase> <userId> <timestamp>' ],
            argsPromptLimit: 0,
            ownerOnly: true,
            args: [
                {
                    key: 'phrase',
                    prompt: "Enter the phrase you want to trap on.  The longer the trap goes unsprung, the more damage it will do.",
                    type: 'string',
                },
                {
                    key: 'ownerId',
                    prompt: "Enter the owner's id for the trap.",
                    type: 'int'
                },
                {
                    key: 'date',
                    prompt: "Enter the timestamp for the trap.",
                    type: 'string',
                    validator: (val, msg, arg) => {
                        console.log(val);
                        regex = /^\\s*(201[0-9]\\W([0]?[0-9]|1[012])\\W([012]?[0-9]|3[01]))?\\s?(([01]?[0-9]|2[0-3])\\W([0-5][0-9])(\\W([0-5][0-9]))?(\\s*[AaPp][Mm])?)?\\s*$/;
                        regex.test(val);
                    },
                    parser: (val, msg, arg) => {
                        console.log(val);
                        return Date.parse(val);
                    }
                }
            ]
        });
    }

    
    async run(msg, { phrase, ownerId, date }) {
        if(!this.client.isOwner(msg.author)) {
            return;
        }

        var traps = this.client.battleSystem._enmap.get('traps');

        var key = phrase.toLowerCase();

        if(Object.keys(traps).indexOf(key) > -1) {
            msg.channel.send('Trap was already found.');
            return false;
        }

        var status = this.client.battleSystem.retrieve(ownerId);

        if('trapActive' in status && status.trapActive) {
            msg.channel.send('User already has a trap set.');
            return false;
        }

        traps[key] = this.client.battleSystem.generateTrap(key, ownerId, Date.parse(date), (trap, message) => {
            var victim = message.author;
            var owner = this.client.users.get(trap.ownerId);
            
            var embed = new Discord.RichEmbed()
            .setColor('RED');

            if(owner.id === victim.id) {
                embed.setAuthor(`${owner.username} Blew Themselves Up!`, 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/53/Skull_and_crossbones.svg/2000px-Skull_and_crossbones.svg.png')
            } 
            else {
                embed.setAuthor(`${owner.username}'s Trap Sprung!`, owner.avatarUrl);
            }

            var victimStats = this.client.battleSystem.retrieve(victim.id);

            if(victimStats.hp === 0) {
                embed.setThumbnail('https://www.galabid.com/wp-content/uploads/2017/11/rip-gravestone-md.png');
            }

            embed.setDescription(
                `**Phrase**: ${trap.phrase}\n` + 
                `**Owner**: ${owner}\n` +
                `**Damage**: ${trap.getDamage()}\n\n` + 
                `**Victim**: ${victim}\n` +
                `**Remaining Health**: ${victimStats.hp}\n\n` +
                `*Traps deal more damage the longer they are alive for.*`);

            embed.setFooter(`Trap set at ${new Date(trap.startTime).toString()}`, owner.avatarUrl);

            message.channel.send(embed);
        }, msg);

        status.trapActive = true;

        this.client.battleSystem.set(ownerId, status);
        
        this.client.battleSystem._enmap.set('traps', traps);

        msg.channel.send("Trap set succesfully.");
    }
}