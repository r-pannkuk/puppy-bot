const commando = require('discord.js-commando');
const Discord = require('discord.js');


module.exports = class TrapCommand extends commando.Command {
    constructor(client) {
        super(client, {
            name: 'trap',
            group: 'pelt',
            memberName: 'trap',
            description: 'Sabotage a word or phrase to deal damage the next time a user says it in chat.',
            examples: [ '!trap ', '!status @Dog' ],
            argsPromptLimit: 0,
            guildOnly: true,
            args: [
                {
                    key: 'phrase',
                    prompt: "Enter the phrase you want to trap on.  The longer the trap goes unsprung, the more damage it will do.",
                    type: 'string'
                }
            ]
        });
    }

    
    async run(message, { phrase }) {
        var success = this.client.battleSystem.addTrap(message, phrase, message.author, (trap, message) => {
            var victim = message.author;
            var owner = trap.owner;
            
            var victimStats = this.client.battleSystem.retrieve(victim.id);
            var ownerStats = this.client.battleSystem.retrieve(owner.id);

            var embed = new Discord.RichEmbed()
            .setColor('RED');

            if(owner.id === victim.id) {
                embed.setAuthor(`${owner.username} Blew Themselves Up!`, 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/53/Skull_and_crossbones.svg/2000px-Skull_and_crossbones.svg.png')
            } 
            else {
                embed.setAuthor(`${owner.username}'s Trap Sprung!`, owner.avatarUrl);
            }

            // Damage is done in hours
            var hours = Math.floor((Date.now() - trap.startTime) / (60*60*1000));

            var damage = 0;

            for(var i = 0; i < hours; ++i) {
                ++damage;

                // 8 Hours
                if(i >= 8) {
                    ++damage;
                }
                // 1 Day
                if(i >= 24) {
                    ++damage;
                }
                // 3 Days
                if(i >= 72) {
                    ++damage;
                }
                // 1 Week
                if(i >= 168) {
                    ++damage;
                }
                // 2 Weeks
                if(i >= 336) {
                    ++damage;
                }
                // 3 Weeks
                if(i >= 504) {
                    ++damage;
                }
                // 4 Weeks
                if(i >= 672) {
                    ++damage;
                }
            }

            victimStats.hp -= damage;

            ownerStats.xp += damage;

            if(victimStats.hp <= 0) {
                victimStats.hp = 0;
                embed.setThumbnail('https://www.galabid.com/wp-content/uploads/2017/11/rip-gravestone-md.png');
            }

            embed.setDescription(
                `**Phrase**: ${trap.phrase}\n` + 
                `**Owner**: <@${owner.id}>\n` +
                `**Damage**: ${damage}\n\n` + 
                `**Victim**: ${victim}\n` +
                `**Remaining Health**: ${victimStats.hp}\n\n` +
                `*Traps deal more damage the longer they are alive for.*`);

            embed.setFooter(`Trap set at ${new Date(trap.startTime).toString()}`, owner.avatarUrl);

            message.channel.send(embed);
        });

        if(success) {
            message.channel.send(`New trap set for phrase: "${phrase}"`)
            .then(msg => {
                msg.delete(10000);
                message.delete(10000);
            });
        }
        else {
            message.channel.send(`You've already set too many traps, type removetrap to remove your own trap.`);
        }
    }
}