var redis = require('redis')

var client = redis.createClient();


function registerGame(callback){
  client.incr('omi-games', function(err, id){
    createDeck(id, function(){
      createPlayers(id, function(){
        callback(id);
      });
    });
  });
}


function registerPlayer(gameId, callback){
  client.incr('omi-players-' + gameId, function(err, id){
    callback(id);
  });
}


function getGame(id, callback){
  console.log('looking for game: ' + id);

  getDeck(id, function(err, deck){
    if(err)
      throw err;
  
    getPlayers(id, function(err, players){
      if(err)
        throw err;    

      var game = new Game(id, deck, null, players);
      callback(game);
    });
  });
}


function getDeck(id, callback){
  console.log('getting deck');

  client.get('deck-'+id, function(err, deck){
    if(deck){
      var deck = JSON.parse(deck);
      callback(err, deck);
      return;
    } else {
      callback("No deck for id: " + id);
    }
  });
}


function getPlayers(id, callback){
  client.lrange('players-'+id, 0, -1, function(err, players){
    console.log(players)
    if(players.length){
      var ps = [];
      players.forEach(function(player, i){
        var player = JSON.parse(player);
        ps.push(player.connectionId);
      });
      callback(err, ps);
    } else {
      callback("No players for id: " + id);
    }
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


function createPlayers(id, callback){
  console.log('creating empty players')
  client.lpush('players-'+id, '{}', '{}', '{}', '{}', function(err, num){
    callback(err, []);
  });
}


function Game(id, deck, table, players){
  this.id = id;
  this.deck = deck;
  this.table = [];
  this.players = players;
}

Game.prototype.start = function(){
  this.players
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
