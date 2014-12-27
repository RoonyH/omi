var express = require('express');
var http = require('http');
var path = require('path');

var routes = require('./routes');


var app = express();

app.set('port', process.env.PORT || 3001);
app.use(express.static(path.join(__dirname, 'public')));

app.use(express.favicon());

app.get('/game', routes.game);

var server = http.createServer(app);
var io = require('socket.io')(server);

io.on('connection', function (socket) {
  console.log('connected!');

  socket.on('start', function (data) {
    routes.game({gameId: data.gameId}, function(game){
      console.log(JSON.stringify(game));
      game.addPlayer(data.playerId, socket.id);
      game.connectOtherPlayers(data.playerId, function(playerConArr){
        playerConArr.forEach(function(con){
          io.to(con).emit('other-player-got-first-hand', {id: data.playerId});
        });
      });
      socket.emit('game', {hand: game.getPlayerFirstHand(data.playerId)});
    });
  });
});

server.listen(app.get('port'), function(){
  console.log('Express server listening on port ' + app.get('port'));
});
