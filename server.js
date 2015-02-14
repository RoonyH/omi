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

var messages = {
  not_started: "The game is not started yet!",
  not_turn: "It's not your turn!"
}


io.on('connection', function (socket) {
  console.log('------------------>  connected!  <---------------------');

  socket.on('start', function (data) {

    console.log('start ' + JSON.stringify(data))

    var opt = {
      gameId: data.gameId,
      playerId: data.playerId,
      name: data.name,
      socketId: socket.id
    }

    routes.game(opt, function(game){
      console.log(JSON.stringify(game));

      game.players.forEach(function(player){
        var details = {
          id: data.playerId,
          name: data.name,
          status: game.status
        }

        io.to(player.socketId).emit('other-player-got-first-hand', details);
      });

      gameDetails = {
        hand: game.hand,
        players: game.players,
        trumphs: game.trumphs,
        trumpher: game.trumpher,
        table: game.table,
        status: game.status,
        score: game.score
      }

      socket.emit('game', gameDetails);
    });
  });

  socket.on('trumphs-picked', function(data){

    routes.trumpsPicked(data, function(err, game){
      console.log(game)

      if(err){
        socket.emit("error", {msg: err});
        return;
      }

      game.players.forEach(function(player){
        details = {
          trumphs: data.trumphs,
          hand: game.hands[player.id-1].slice(4, 8)
        };

        io.to(player.socketId).emit('trumps-and-next-hand', details);
      });
    })
  });


  socket.on('card-played', function(data){
    console.log('card-played')
    console.log(data);

    routes.cardPlayed(data, function(err, game, winner, end){
      if(err){
        socket.emit("cant-play-card", {msg: err, card: data.card});
        return;
      }
     

      
      game.players.forEach(function(player){
        details = {
          player: data.playerId,
          card: data.card,
          score: game.score
        };

        if(winner){
          details.winner = winner
        }

        if(end){
          details.end = end;
        }

        console.log('cardPlayed: ' + JSON.stringify(game.players));

        io.to(player.socketId).emit('played-card', details);
      });
    })

  });

  socket.on('round', function(data){

    var opt = {
      gameId: data.gameId,
      playerId: data.playerId
    }

    routes.round(opt, function(err, game){
      gameDetails = {
        hand: game.hand,
        trumpher: game.trumpher,
        players: [],
        table: [],
        status: 2 // WAITING_TRUMPHS_PICK
      }

      socket.emit('new-round', gameDetails);
    })
  })

  socket.on('disconnect', function(){

    // var opt = {
    //   gameId: data.gameId,
    //   playerId: data.playerId
    // }

    // routes.round(opt, function(err, game){
    //   gameDetails = {
    //     hand: game.hand,
    //     trumpher: game.trumpher,
    //     players: [],
    //     table: [],
    //     status: 2 // WAITING_TRUMPHS_PICK
    //   }

    //   socket.emit('new-round', gameDetails);
    // })
  })
});

server.listen(app.get('port'), function(){
  console.log('Express server listening on port ' + app.get('port'));
});
