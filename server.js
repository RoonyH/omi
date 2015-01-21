var express = require('express');
var http = require('http');
var path = require('path');

var routes = require('./routes');


var app = express();

app.set('port', process.env.PORT || 3001);
app.use(express.static(path.join(__dirname, 'public')));
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');
app.use(express.cookieParser());
app.use(express.favicon());

app.get('/', routes.index);
app.post('/', routes.index);

var server = http.createServer(app);
var io = require('socket.io')(server);

io.on('connection', function (socket) {
  console.log('connected!');

  socket.on('start', function (data) {
    routes.game({gameId: data.gameId}, function(game){
      console.log(JSON.stringify(game));
      var players = [];

      game.players.forEach(function(p){
        players.push(p);
      });

      game.addPlayer(data.playerId, socket.id, data.name);
      game.connectOtherPlayers(data.playerId, function(playerConArr){
        playerConArr.forEach(function(con){
          io.to(con).emit('other-player-got-first-hand', {id: data.playerId});
        });
      });

      var firstHand = game.getPlayerFirstHand(data.playerId);

      gameDetails = {
        hand: firstHand,
        players: players,
        trumpher: data.playerId == 1
      }

      socket.emit('game', gameDetails);
    });
  });

  socket.on('trumphs-picked', function(data){
    console.log('trumps')
    console.log(data);

    routes.trumpsPicked(data, function(err, game){
      if(err){
        socket.emit("error", {msg: err});
        return;
      }
      
      game.players.forEach(function(player){
        details = {
          trumphs: data.trumphs,
          hand: game.getPlayerSecondHand(player.id)
        };

        io.to(player.connectionId).emit('trumps-and-next-hand', details);
      });
    })
  });
  

  socket.on('card-played', function(data){
    console.log('card-played')
    console.log(data);

    routes.cardPlayed(data, function(err, game, winner){
      if(err){
        socket.emit("cant-play-card", {msg: err, card: data.card});
        return;
      }
     
      
      game.players.forEach(function(player){
        details = {
          player: data.playerId,
          card: data.card
        };

        if(winner){
          details.winner = winner
        }

        io.to(player.connectionId).emit('played-card', details);
      });
    })

  });
});

server.listen(app.get('port'), function(){
  console.log('Express server listening on port ' + app.get('port'));
});
