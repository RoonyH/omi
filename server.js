var express = require('express');
var http = require('http');
var path = require('path');

var routes = require('./routes');


var app = express();

app.set('port', process.env.PORT || 3001);
app.use(express.static(path.join(__dirname, 'public')));

app.use(express.favicon());

app.get('/game', routes.game);

http.createServer(app).listen(app.get('port'), function(){
  console.log('Express server listening on port ' + app.get('port'));
});
