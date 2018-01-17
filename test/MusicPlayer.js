const MusicPlayer = require('../core/MusicPlayer.js');
const assert = require('assert');

var musicPlayer = new MusicPlayer({
    youtube: process.env.YOUTUBE
});

// assert.equal(MusicPlayer.isYouTube('https://www.youtube.com/watch?v=g11rnxpMNko&list=LLlatb1naRTSmgK3dSXKoNVw&index=6'), true, 'Valid URl check fail');
// musicPlayer.getID('https://www.youtube.com/watch?v=g11rnxpMNko&list=LLlatb1naRTSmgK3dSXKoNVw&index=6', (err, data) => {
//     assert.equal(data, 'g11rnxpMNko', 'Not retrieving ID.');
// });

musicPlayer.enqueue("https://www.youtube.com/watch?v=h5o5XojstYs", function(err, videoId) {
    musicPlayer.play(videoId);
});