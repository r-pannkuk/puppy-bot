const commando = require('discord.js-commando');
const Discord = require('discord.js');


module.exports = class CheckTrapCommand extends commando.Command {
    constructor(client) {
        super(client, {
            name: 'checktrap',
            group: 'traps',
            memberName: 'checktrap',
            description: 'Reminds the user of the trap they set.',
            guildOnly: true,
            examples: [ '!checktrap' ]
        });
    }

    
    async run(message) {
        var user = message.guild.battleSystem.fetch(message.author.id);

        var promise = message.author.createDM();

        if(user.traps.length === 0) {
            promise.then( channel => channel.send('No trap was found.') );
        } else {
            promise.then( channel => {

                for(var i in user.traps) {
                    var trap = message.guild.battleSystem.getTrapByID(user.traps[i]);
                    var owner = this.client.users.get(trap.userid);
                    var embed = new Discord.RichEmbed()
                    .setColor('RED');
                    
                    embed.setAuthor(`${owner.username}'s Trap: ${trap.phrase}`, owner.avatarUrl);
                    
                    embed.setDescription(
                        `**Phrase**: ${trap.phrase}\n` + 
                        `**Owner**: ${owner}\n` +
                        `**Time Set**: ${new Date(trap.createdAt).toString()}\n` +
                        `**Current Damage**: ${trap.getDamage()}\n` +
                        `*Traps deal more damage the longer they are alive for.*`
                    );
                        
                    embed.setFooter(``, owner.avatarUrl);
                        
                    channel.sendEmbed(embed);
                }
            });
        }

        message.channel.send(`Trap information was sent to ${message.author}.`);
    }
}