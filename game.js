var redis = require('redis')

var client = redis.createClient();


function registerGame(callback){
  client.incr('omi-games', function(err, id){
    callback(id);
  });
}


function registerPlayer(gameId, callback){
  client.incr('omi-players-' + gameId, function(err, id){
    callback(id);
  });
}


function getGame(id, callback){
  console.log('looking for game: ' + id);

  createDeck(id, function(deck){
    
    client.lrange('players-'+id, 0, -1, function(err, players){
      console.log(players)

      ps = null;

      if(players.length){
        var ps = [];
        console.log(players)
        players.forEach(function(player, i){
          var player = JSON.parse(player);
          ps.push(player.connectionId);
        });
      }

      var game = new Game(id, deck, null, ps);
      callback(game);
    });
  });
}

function createDeck(id, callback){
  console.log('creating deck');

  client.get('deck-'+id, function(err, deck){
    if(deck){
      var deck = JSON.parse(deck);
      callback(deck);
      return;
    } else {

      var kinds = ['c', 'd', 'h', 's'];
      var values = [1, 7, 8, 9, 10, 11, 12, 13];

      var deck = [];

      kinds.forEach(function(kind){
        values.forEach(function(value){
          deck.push({kind: kind, value: value});
        });
      });

      client.set('deck-'+id, JSON.stringify(deck), function(){
        callback(deck);
        return;
      });
    }
  });
}


function Game(id, deck, table, players){
  this.id = id;
  this.deck = deck;
  this.table = [];
  if(players)
    this.players = players;
  else
    this.createPlayers();
}

Game.prototype.start = function(){
  this.players
}

Game.prototype.createPlayers = function(){
  console.log('creating empty players')
  client.lpush('players-'+this.id, '{}', '{}', '{}', '{}');
  this.players = [];
}

Game.prototype.getPlayerFirstHand = function(playerId){
  console.log('getting first hand for pid: ' + playerId);
  return this.deck.slice((playerId-1)*4, (playerId-1)*4+4);
}

Game.prototype.getPlayerSecondHand = function(playerId){
  console.log('getting second hand for pid: ' + playerId);
  return this.deck.slice(16 + (playerId-1)*4, 16 + (playerId-1)*4+4);
}

Game.prototype.addPlayer = function(id, connectionId){
  console.log('adding player: ' + id + ' to game: ' + this.id);

  player = {id: id, connectionId: connectionId};
  this.players.push(player);
  client.lset('players-'+this.id, (id-1), JSON.stringify(player), function(err, players){
    if(err)
      throw err;
  });
}

// calls the callback function with the argument 'connectionId' of the player
// with the pid specified by param'id'.
// can be used to contact the player.
Game.prototype.connectPlayer = function(id, callback){
  console.log('connecting player: ' + id);

  client.lrange('players-'+this.id, (id-1), (id-1), function(err, player){
    if(err)
      throw err;
    var player = JSON.parse(player);
    callback(player.connectionId);
  });
}

// just like the 'connectPlayer' method, except callback called with
// 'connectionId's of players other than the specified.
Game.prototype.connectOtherPlayers = function(id, callback){
  console.log('connecting other players: ' + id);

  client.lrange('players-'+this.id, 0, 3, function(err, players){
    if(err)
      throw err;
      
    var conns = [];
    console.log('aa mennaa')
    console.log(players)
    players.forEach(function(player, i){
      if(player!='nil'){
        var player = JSON.parse(player);
        if(player.id && player.id!=id)
          conns.push(player.connectionId);
      }
    });
    callback(conns);
  });
}

exports.getGame = getGame;
exports.registerGame = registerGame;
exports.registerPlayer = registerPlayer
