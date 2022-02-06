const Discord = require('discord.js');
const fs = require('fs');
const ytdl = require('ytdl-core');
const request = require('request');
const validURL = require('valid-url');
const URL = require('url');
const getYTID = require('get-youtube-id');
const scdl = require('soundcloud-downloader').default;

module.exports = class MusicPlayer {
    constructor(guildSettings, config) {
        /**
         * @name guildSettings - The settings for the guild the music player is in.
         */
        this.guildSettings = guildSettings;

        this._apiKeyYT = config.youtube;
        this._apiKeySC = config.soundcloud;
        this._queue = [];
        this._isPlaying = false;
        /** @type {Discord.StreamDispatcher} */
        this._dispatcher = null;
        /** @type {Discord.VoiceChannel} */
        this._voiceChannel = null;
        /** @type {Number} */
        this._totalDuration = null;
    }

    enqueue(source, fetchCallback, playCallback) {
        var musicPlayer = this;

        this.getID(source, async function (err, { type, data }) {
            if (err) {
                fetchCallback(err, null);
            }

            if (type === 'YouTube') {
                try {
                    var videoInfo = await ytdl.getInfo(data);
                } catch(e) {
                    console.log(e);
                    return;
                }

                var ret = videoInfo.videoDetails;

                ret.type = 'YouTube';
                ret.callback = playCallback;

                musicPlayer._queue.push(ret);

                console.log("Added to queue: **" + ret.title + "**");

                fetchCallback(null, ret);
            }

            else if (type === 'SoundCloud') {
                data.type = type;
                data.callback = playCallback;

                musicPlayer._queue.push(data);

                console.log(`Added to queue: **${data.title}**`);

                fetchCallback(null, data);
            }
        });
    }

    setChannel(channel) {
        this._voiceChannel = channel;
    }

    play(videoInfo, voiceChannel) {

        if (voiceChannel !== undefined) {
            this.setChannel(voiceChannel);
        }

        if (this._voiceChannel === undefined || this._voiceChannel === null) {
            console.log("Channel not found!");
            return;
        }

        /**
         * @callback
         * @property {Discord.VoiceConnection} connection
         */
        this._voiceChannel.join().then(async (connection) => {
            var stream;
            var streamOptions = {
                volume: 0.5,
                plp: 0.5,
                bitrate: 192000
            };

            if (videoInfo.type === 'YouTube') {
                var stream = await ytdl(videoInfo.video_url, {
                    quality: 'highestaudio',
                    filter: 'audioonly'
                });
                // streamOptions.type = 'opus';
                this._totalDuration = parseInt(videoInfo.lengthSeconds) * 1000;
            } else if (videoInfo.type === 'SoundCloud') {
                ;
                var stream = await scdl.download(videoInfo.uri, this._apiKeySC);
                this._totalDuration = videoInfo.duration;
            }

            this._dispatcher = await connection.play(stream, streamOptions);

            videoInfo.callback(videoInfo);

            this._isPlaying = true;

            this._dispatcher.addListener('error', console.error);

            this._dispatcher.addListener('finish', (reason) => {

                this._queue.shift();

                if (this._queue.length === 0) {
                    this.stop();
                } else {
                    this.play(this._queue[0]);
                }
            })
        }).catch(console.error);
    }

    skip() {
        this._dispatcher.end();
    }

    stop() {
        if (this._dispatcher !== null) {
            this._dispatcher.end();
        }

        if (this._voiceChannel !== null) {
            this._voiceChannel.leave();
        }

        this._queue = [];
        this._isPlaying = false;
        this._voiceChannel = null;
    }

    pause() {
        this._dispatcher.pause();
        this._isPlaying = false;
    }

    resume() {
        this._dispatcher.resume();
        this._isPlaying = true;
    }

    isPlaying() {
        return this._isPlaying;
    }


    getID(source, callback) {
        console.log(source);
        if (this.isYouTube(source)) {
            console.log("Determined to be YT Link.");
            this.getYouTubeID(source, function (err, id) {
                if (err) {
                    callback(err, { type: null, data: null});
                }
                else {
                    console.log("YouTube ID found: " + id);
                    callback(null, {
                        type: 'YouTube',
                        data: id
                    });
                }
            });
        }
        else if (this.isSoundCloud(source)) {
            console.log("Determined to be SoundCloud Link.");
            this.getSoundCloudID(source, function (err, data) {
                if (err) {
                    callback(err, { type: null, data: null});
                }
                else {
                    console.log("Soundcloud ID found: " + data.id);
                    callback(null, {
                        type: 'SoundCloud',
                        data: data
                    });
                }
            });
        }
        else {
            console.log("Nothing found.  Defaulting to search.");
            this.searchYouTube(source, function (err, results) {
                callback(err, results);
            });
        }
    }

    isYouTube(url) {
        if (!validURL.isWebUri(url)) {
            return false;
        }

        var data = URL.parse(url, true);

        const regex = /[a-zA-Z0-9-_]+$/g;

        if (data.host === 'youtube.com' || data.host === 'www.youtube.com') {
            if (data.pathname === '/watch') {


                if (!data.query.v === 'v') {
                    return false;
                }

                return data.query.v.match(regex) !== null;
            } else if (data.pathname === '/playlist') {
                if (!data.query.list) {
                    return false;
                }

                return data.query.list.match(regex) !== null;
            }
        } else if (data.host === 'youtu.be') {
            return data.pathname.substring(1).match(regex) !== null;
        }

        return false;
    }

    isSoundCloud(url) {
        if (!validURL.isWebUri(url)) {
            return false;
        }

        var data = URL.parse(url, true);

        if (data.host.indexOf('soundcloud.com') === -1) {
            return false;
        }

        // var tokens = data.pathname.split('/').slice(1);

        // const regex = /[a-zA-Z0-9-Z]+/g;
        // var validLength = 3;

        // for (var index in tokens) {
        //     --validLength;

        //     if (tokens[index] === 'sets') {
        //         continue;
        //     }

        //     if (tokens[index].match(regex) === null) {
        //         return false;
        //     }
        // }

        // if (validLength !== 0) {
        //     return false;
        // }

        return true;
    }



    getYouTubeID(query, callback) {
        var results = getYTID(query);

        if (results === null) {
            callback('No YouTube ID found in the URL.', null);
        } else {
            callback(null, results);
        }
    }

    searchYouTube(query, callback) {
        request(`https://googleapis.com/youtube/v3/search?` +
            `part=id&` +
            `type=video&` +
            `q=${encodeURIComponent(query)}&` +
            `key=${this._apiKeyYT}`
            , function (error, body) {
                if (error) {
                    callback(error);
                }

                var json = JSON.parse(body);
                callback(null, json.items[0].id.videoId);
            });
    }

    async getSoundCloudID(query, callback) {
        var results = await scdl.getInfo(query, this._apiKeySC);

        if (results === null) {
            callback(`No soundcloud found in the URL.`, null);
        } else {
            callback(null, results);
        }
    }

}