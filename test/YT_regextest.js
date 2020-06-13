const MusicPlayer = require('../core/music/MusicPlayer');

var callback = function(err, data) {
    console.log(data !== null);
}

MusicPlayer.getYouTubeID("http://www.youtube.com/watch?v=0zM3nApSvMg&feature=feedrec_grec_index", callback);
MusicPlayer.getYouTubeID("http://www.youtube.com/user/IngridMichaelsonVEVO#p/a/u/1/QdK8U-VIH_o", callback);
MusicPlayer.getYouTubeID("http://www.youtube.com/v/0zM3nApSvMg?fs=1&amp;hl=en_US&amp;rel=0", callback);
MusicPlayer.getYouTubeID("http://www.youtube.com/watch?v=0zM3nApSvMg#t=0m10s", callback);
MusicPlayer.getYouTubeID("http://www.youtube.com/embed/0zM3nApSvMg?rel=0", callback);
MusicPlayer.getYouTubeID("http://www.youtube.com/watch?v=0zM3nApSvMg", callback);
MusicPlayer.getYouTubeID("http://youtu.be/0zM3nApSvMg", callback);
MusicPlayer.getYouTubeID("https://youtube.com/watch?v=0zM3nApSvMg", callback);
MusicPlayer.getYouTubeID("https://youtube.com/thisisntreal", callback);