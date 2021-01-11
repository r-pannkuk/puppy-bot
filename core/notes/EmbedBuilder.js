const Discord = require('discord.js');
const commando = require('discord.js-commando');

const Note = require('./Note.js');
const Notepad = require('./Notepad.js');

function noteDescription(author, note) {
    return `**Key**: \`${note.key}\`
    **Author**: ${author}
    **Note**:
    ${note.fullNote}`;

}

function noteFooter(note) {
    return `Created: ${new Date(parseInt(note.createdAt) || note.createdAt).toString()}\n` +
        `Last Modified: ${new Date(parseInt(note.modifiedAt)).toString()}`;
}

/**
 * 
 * @param {*} resolvable 
 * @param {Note} note 
 */
async function keyDescription(resolvable, note) {
    var author = await resolvable.fetch(note.authorId);
    return `\`${note.key}\` - ${author}`;
}

/**
 * 
 * @param {commando.CommandoGuild|commando.CommandoClient} resolvable - Notepad resolvable to fetch user data. 
 * @param {Note} note - The note object to report.
 */
module.exports.displayNote = async function (resolvable, note) {
    var embed = new Discord.MessageEmbed()
        .setColor('GOLD');

    if (resolvable instanceof commando.CommandoGuild) {
        /** @type {Discord.GuildMember} */
        var author = await resolvable.members.fetch(note.authorId);
        embed.setAuthor(`${author.displayName}'s Note`, author.user.displayAvatarURL());
    } else if (resolvable instanceof commando.CommandoClient) {
        /** @type {Discord.User} */
        var author = await resolvable.users.fetch(note.authorId);
        embed.setAuthor(`${author.username}'s Note`, author.displayAvatarURL());
    }

    embed.setDescription(noteDescription(author, note));

    embed.setFooter(noteFooter(note));

    return embed;
}

/**
 * 
 * @param {commando.CommandoGuild|commando.CommandoClient} resolvable - Notepad resolvable to fetch user data. 
 * @param {Note} note - The note object to report.
 */
module.exports.setNote = async function (resolvable, note) {
    var embed = new Discord.MessageEmbed()
        .setColor('GOLD');

    if (resolvable instanceof commando.CommandoGuild) {
        /** @type {Discord.GuildMember} */
        var author = await resolvable.members.fetch(note.authorId);
    } else if (resolvable instanceof commando.CommandoClient) {
        /** @type {Discord.User} */
        var author = await resolvable.users.fetch(note.authorId);
    }

    embed.setAuthor(`Note set`);

    embed.setDescription(noteDescription(author, note));

    embed.setFooter(noteFooter(note));

    return embed;
}

/**
 * 
 * @param {commando.CommandoGuild|commando.CommandoClient} resolvable - Notepad resolvable to fetch user data. 
 * @param {Note} note - The note object to report.
 */
module.exports.displayKeys = async function (resolvable, notes) {
    var embed = new Discord.MessageEmbed().setColor('GOLD');

    if (resolvable instanceof commando.CommandoGuild) {
        /** @type {Discord.GuildMember} */
        var resolver = resolvable.members;
    } else if (resolvable instanceof commando.CommandoClient) {
        /** @type {Discord.User} */
        var resolver = resolvable.users;
    }

    embed.setAuthor(`Found keys`);

    var description = await notes.reduce(
        async (prev, curr) => {
            var description = await keyDescription(resolver, curr);
            return await prev + '\n' + description;
        }, '')

    embed.setDescription(description);

    return embed;
}

/**
 * 
 * @param {commando.CommandoGuild|commando.CommandoClient} resolvable - Notepad resolvable to fetch user data. 
 * @param {Note} note - The note object to report.
 */
module.exports.deleteNote = async function (resolvable, note) {

    if (resolvable instanceof commando.CommandoGuild) {
        /** @type {Discord.GuildMember} */
        var author = await resolvable.members.fetch(note.authorId);
    } else if (resolvable instanceof commando.CommandoClient) {
        /** @type {Discord.User} */
        var author = await resolvable.users.fetch(note.authorId);
    }

    return `Deleted ${author}'s key \`${note.key}\`.`
}