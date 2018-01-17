const Discord = require('Discord.js');

const fs = require('fs');
const ytdl = require('ytdl-core');
const request = require('request');
const getYT = require('get-youtube-id');
const fetchYT = require('youtube-info');
const validURL = require('valid-url');
const URL = require('url');
const getYTID = require('get-youtube-id');

module.exports = class MusicPlayer {
    constructor(settings) {
        this._apiKeyYT = settings.youtube;
        this._queue = [];
        this._isPlaying = false;
        this._dispatcher = null;
        this._voiceChannel = null;
    }

    enqueue(source, callback) {
        var musicPlayer = this;

        this.getID(source, function(err, data) {
            if(err) {
                callback(err, null);
            }

            musicPlayer._queue.push(data);

            if(data.type === 'YouTube') {
                fetchYT(data.id, function(err, videoInfo) {
                    if(err) {
                        console.log(err);
                        return;
                    }

                    videoInfo.type = 'YouTube';
    
                    console.log("Added to queue: **" + videoInfo.title + "**");

                    callback(null, videoInfo);
                })

            }
        })
    }

    play(videoInfo, message) {
        this._voiceChannel = message.member.voiceChannel;
        var musicPlayer = this;

        this._voiceChannel.join().then(function(connection) {
            if(videoInfo.type === 'YouTube') {
                var stream = ytdl(videoInfo.url, {
                    filter: 'audioonly'
                });

                var skipRequest = 0;
                var skippers = [];

                musicPlayer._dispatcher = connection.playStream(stream);
            }
        }).catch(console.error);
    }

    stop() {
        this._dispatcher.end();
        this._voiceChannel.leave();
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
        } else if(host === 'youtu.be') {
            return parsed.pathname.substring(1).match(regex) !== null;
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