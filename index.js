require('dotenv').config();

const Discord = require('discord.js');
const commando = require('discord.js-commando');
const path = require('path');
const Enmap = require('enmap');
const EnmapLevel = require('enmap-level');
const Sqlite = require('sqlite');

/* Bot client creation. */
const client = new commando.Client({
    owner: process.env.USER,
    unknownCommandResponse: false
});

/* Guild settings load. */

client.setProvider(
    Sqlite.open(path.join(__dirname, 'settings.sqlite3')).then(db =>
    new commando.SQLiteProvider(db))
).catch(console.error);

/* Enhanced map for points allocation. */
const pointProvider = new EnmapLevel({
    name: "points"
});

client.points = new Enmap({
    provider: pointProvider
});

/* Command group registry. */

client.registry.registerGroups([
    [ 'rng', 'Random Number Generators' ],
    [ 'points', 'Level System' ],
    [ 'memes', 'Memes and Stupidity' ]
]);
client.registry.registerDefaults();
client.registry.registerCommandsIn(__dirname + '/commands');

/* Startup */

client.login(process.env.TOKEN);


/*** This section of code allows us to prevent sleeping by Heroku by simulating an active web client */


const express = require('express');
const app = express();

// set the port of our application
// process.env.PORT lets the port be set by Heroku
const port = process.env.PORT || 5000;

// set the view engine to ejs
app.set('view engine', 'ejs');

// make express look in the `public` directory for assets (css/js/img)
app.use(express.static(__dirname + '/public'));

// set the home page route
app.get('/', (request, response) => {
    // ejs render automatically looks in the views folder
    response.render('index');
});

app.listen(port, () => {
    // will echo 'Our app is running on http://localhost:5000 when run locally'
    console.log('Our app is running on http://localhost:' + port);
});


setInterval(() => {
    http.get('http://your-app-name.herokuapp.com');
  }, 900000);