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


/******************* */


require('dotenv').config();

const Discord = require('discord.js');
const commando = require('discord.js-commando');
const bot = new commando.Client({
    owner: process.env.USER,
    unknownCommandResponse: false
});

bot.registry.registerGroup('rng', 'Random');
bot.registry.registerDefaults();
bot.registry.registerCommandsIn(__dirname + '/commands');

bot.login(process.env.TOKEN);