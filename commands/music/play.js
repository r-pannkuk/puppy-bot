const commando = require('discord.js-commando');
const Discord = require('discord.js');

const MusicPlayer = require('../../core/music/MusicPlayer.js');

/**
 * 
 * @param {number} current 
 * @param {number} end 
 * @param {Object} options
 * @param {number} options.scale
 * @param {string} options.token
 * @param {Object} options.bookend
 * @param {Object} options.bookend.start
 * @param {Object} options.bookend.end
 */
function visualProgressBar(current, end, {
    scale = 100,
    token = "█",
    blank = "░",
    bookend = {
        start: "▌",
        end: "▐"
    }
}) {
    var interval = Math.floor(current / end * scale);

    var string = bookend.start;

    for (var i = 0; i < interval; ++i) {
        string += token;
    }
    while (i < scale) {
        string += blank;
        ++i;
    }

    string += bookend.end;

    return string;
}


/**
 * 
 * @param {string | number} epoch 
 */
function toHHMMSS(epoch) {
    var sec_num = parseInt(epoch.toString(), 10); // don't forget the second param
    var hours = Math.floor(sec_num / 3600);
    var minutes = Math.floor((sec_num - (hours * 3600)) / 60);
    var seconds = sec_num - (hours * 3600) - (minutes * 60);

    if (hours < 10) { hours = "0" + hours; }
    if (minutes < 10) { minutes = "0" + minutes; }
    if (seconds < 10) { seconds = "0" + seconds; }
    return hours + ':' + minutes + ':' + seconds;
}

module.exports = class PlayCommand extends commando.Command {
    constructor(client) {
        super(client, {
            name: 'play',
            group: 'music',
            memberName: 'play',
            description: "Plays music from the specified YouTube or SoundCloud link.",
            examples: [
                '!play https://www.youtube.com/watch?v=BOnp3G4h7cg'
            ],
            argsPromptLimit: 0,
            args: [
                {
                    key: 'source',
                    prompt: "Please enter a valid YouTube or Soundcloud link to play.",
                    type: 'string',
                    validate: input => {
                        // Validate Youtube and Soundcloud links here
                        return true;
                    }
                }
            ]
        });
    }

    /**
     * 
     * @param {Discord.Message} message 
     * @param {Object} args
     * @param {string} args.source
     */
    async run(message, { source }) {
        var guild = message.guild;
        var messageChannel = message.channel;

        /** @type {MusicPlayer} */
        var musicPlayer = guild.musicPlayer;

        musicPlayer.enqueue(source, function (err, videoInfo) {
            if(err) {
                messageChannel.send(`Not a valid video ID.`);
                return;
            }
            messageChannel.send(`Added track: **${videoInfo.title}**`);

            if (!musicPlayer.isPlaying()) {
                var voiceChannel = message.member.voice.channel;

                if (voiceChannel === undefined || voiceChannel === null) {
                    voiceChannel = message.guild.channels.cache.find(c => c.type === 'voice');

                    if (voiceChannel === undefined || voiceChannel === null) {
                        messageChannel.send(`Cannot find a voice channel to join.`);
                        return;
                    }
                }

                musicPlayer.play(videoInfo, voiceChannel);
            }
        }, async function (videoInfo) {
            var playingMsg = await messageChannel.send(`Now playing: **${videoInfo.title}**`);
            var content = playingMsg.content;

            // musicPlayer._dispatcher.on('start', () => {
                var progressBar = `${visualProgressBar(0, musicPlayer._totalDuration, {
                    scale: 30
                })}`;
                var timeCurrent = toHHMMSS(0);
                var timeTotal = toHHMMSS(musicPlayer._totalDuration / 1000);

                /** Strip unnecessary HH if less than 1 Hour */
                if (musicPlayer._totalDuration < 1000 * 60 * 60) {
                    timeCurrent = timeCurrent.substr(timeCurrent.indexOf(':') + 1, timeCurrent.length);
                    timeTotal = timeTotal.substr(timeTotal.indexOf(':') + 1, timeTotal.length);
                }

                playingMsg.edit(`${content}\n${progressBar}  ${timeCurrent} / ${timeTotal}`);

                var timer = setInterval(async function () {

                    var progressBar = `${visualProgressBar(musicPlayer._dispatcher.streamTime, musicPlayer._totalDuration, {
                        scale: 30
                    })}`;
                    var timeCurrent = toHHMMSS(musicPlayer._dispatcher.streamTime / 1000);
                    var timeTotal = toHHMMSS(musicPlayer._totalDuration / 1000);

                    /** Strip unnecessary HH if less than 1 Hour */
                    if (musicPlayer._totalDuration < 1000 * 60 * 60) {
                        timeCurrent = timeCurrent.substr(timeCurrent.indexOf(':') + 1, timeCurrent.length);
                        timeTotal = timeTotal.substr(timeTotal.indexOf(':') + 1, timeTotal.length);
                    }

                    playingMsg.edit(`${content}\n${progressBar}  ${timeCurrent} / ${timeTotal}`);
                }, 5000);

                musicPlayer._dispatcher.addListener('finish', (reason) => {
                    var progressBar = `${visualProgressBar(musicPlayer._totalDuration, musicPlayer._totalDuration, {
                        scale: 30
                    })}`;
                    var timeTotal = toHHMMSS(musicPlayer._totalDuration / 1000);

                    /** Strip unnecessary HH if less than 1 Hour */
                    if (musicPlayer._totalDuration < 1000 * 60 * 60) {
                        timeTotal = timeTotal.substr(timeTotal.indexOf(':') + 1, timeTotal.length);
                    }

                    playingMsg.edit(`${content}\n${progressBar}  ${timeTotal} / ${timeTotal}`);
                    clearInterval(timer);
                });
            // });
        });
    }
}