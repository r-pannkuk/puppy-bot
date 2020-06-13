const fs = require('fs');
const ytdl = require('ytdl-core-discord');
const request = require('request');
const getYT = require('get-youtube-id');
const fetchYT = require('youtube-info');
const validURL = require('valid-url');
const URL = require('url');
const getYTID = require('get-youtube-id');

module.exports = class MusicPlayer {
    constructor(guildSettings, config) {
        /**
         * @name guildSettings - The settings for the guild the music player is in.
         */
        this.guildSettings = guildSettings;

        this._apiKeyYT = config.youtube;
        this._queue = [];
        this._isPlaying = false;
        this._dispatcher = null;
        this._voiceChannel = null;
    }

    enqueue(source, fetchCallback, playCallback) {
        var musicPlayer = this;

        this.getID(source, function(err, { type, id }) {
            if(err) {
                fetchCallback(err, null);
            }

            if(type === 'YouTube') {
                fetchYT(id, function(err, videoInfo) {
                    if(err) {
                        console.log(err);
                        return;
                    }

                    videoInfo.type = 'YouTube';
                    videoInfo.callback = playCallback;

                    musicPlayer._queue.push(videoInfo);

                    console.log("Added to queue: **" + videoInfo.title + "**");
        
                    fetchCallback(null, videoInfo);
                });
            }

            else if(type === 'Soundcloud') {
                // TBD
            }
        });
    }

    setChannel(channel) {
        this._voiceChannel = channel;
    }

    play(videoInfo, voiceChannel) {
        
        if(voiceChannel !== undefined) {
            this.setChannel(voiceChannel);
        }

        if(this._voiceChannel === undefined) {
            console.log("Channel not found!");
            return;
        }

        var musicPlayer = this;

        this._voiceChannel.join().then(async (connection) => {
            var stream;
            var streamOptions = {
                volume: 1,
                passes: 2,
                bitrate: 192000
            };

            if(videoInfo.type === 'YouTube') {
                musicPlayer._dispatcher = await connection.playOpusStream(
                    await ytdl(videoInfo.url, {
                        quality: 'highestaudio',
                        filter: 'audioonly'
                    })
                );
            } else if(videoInfo.type === 'Soundcloud') {
                // SoundCloud download
            }

            videoInfo.callback(videoInfo);

            musicPlayer._isPlaying = true;

            musicPlayer._dispatcher.on('error', console.error);

            musicPlayer._dispatcher.on('end', (reason) => {

                musicPlayer._queue.shift();

                if(musicPlayer._queue.length === 0) {
                    musicPlayer.stop();
                } else {
                    musicPlayer.play(musicPlayer._queue[0]);
                }
            })
        }).catch(console.error);
    }

    skip() {
        this._dispatcher.end();
    }

    stop() {
        if(this._dispatcher !== null) {
            this._dispatcher.end();
        }

        if(this._voiceChannel !== null) {
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
        if (MusicPlayer.isYouTube(source)) {
            console.log("Determined to be YT Link.");
            MusicPlayer.getYouTubeID(source, function(err, id) {
                if(err) {
                    callback(err, null);
                }
                else {
                    console.log("YouTube ID found: " + id);
                    callback(null, {
                        type: 'YouTube',
                        id: id
                    });
                }
            });
        }
        else if (MusicPlayer.isSoundCloud(source)) {
            console.log("Determined to be SoundCloud Link.");
            MusicPlayer.GetSoundCloudID(source, function(err, id) {
                if(err) {
                    callback(err, null);
                }
                else {
                    console.log("Soundcloud ID found: " + id);
                    callback(null, {
                        type: 'SoundCloud',
                        id: id
                    });
                }
            });
        }
        else {
            console.log("Nothing found.  Defaulting to search.");
            MusicPlayer.searchYouTube(source, function(err, results) {
                callback(err, results);
            });
        }
    }

    static isYouTube(url) {
        if (!validURL.isWebUri(url)) {
            return false;
        }

        var data = URL.parse(url, true);

        const regex = /[a-zA-Z0-9-_]+$/g;

        if(data.host === 'youtube.com' || data.host === 'www.youtube.com') {
            if(data.pathname === '/watch') {
                
                
                if(!data.query.v === 'v') {
                    return false;
                }

                return data.query.v.match(regex) !== null;
            } else if (data.pathname === '/playlist') {
                if(!data.query.list) {
                    return false;
                }

                return data.query.list.match(regex) !== null;
            }
        } else if(data.host === 'youtu.be') {
            return data.pathname.substring(1).match(regex) !== null;
        }

        return false;
    }

    static isSoundCloud(url) {
        if (!validURL.isWebUri(url)) {
            return false;
        }

        var data = URL.parse(url, true);

        if (data.host.indexOf('soundcloud.com') === -1) {
            return false;
        }

        var tokens = data.pathname.split('/').slice(1);

        const regex = /[a-zA-Z0-9-Z]+/g;
        var validLength = 3;

        for (var index in tokens) {
            --validLength;

            if (tokens[index] === 'sets') {
                continue;
            }

            if (tokens[index].match(regex) === null) {
                return false;
            }
        }

        if (validLength !== 0) {
            return false;
        }

        return true;
    }

    

    static getYouTubeID(query, callback) {
        var results = getYTID(query);

        if(results === null) {
            callback('No YouTube ID found in the URL.', null);
        } else {
            callback(null, results);
        }
    }

    static searchYouTube(query, callback) {
        request(`https://googleapis.com/youtube/v3/search?` +
            `part=id&` +
            `type=video&` +
            `q=${encodeURIComponent(query)}&` +
            `key=${this.apiKeyYT}`
            , function (error, body) {
                if(error) {
                    callback(error);
                }

                var json = JSON.parse(body);
                callback(null, json.items[0].id.videoId);
            });
    }

    static getSoundCloudID(query, callback) {
        callback('Not implemented.', null);
    }

}