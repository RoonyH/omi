var redis = require('redis');
var crypto = require('crypto');
var underscore = require('underscore');

var redisPort = process.env.REDIS_PORT;
var redisHost = process.env.REDIS_HOST;
var redisPass = process.env.REDIS_PASS;

var client = redis.createClient(redisPort, redisHost);

client.auth(redisPass, function(){
  console.log("Connected to "+redisHost+":"+redisPort);
  console.log("authenticated!");
})

var gameStatus = {
  WAITING_PLAYER_JOIN: 1,
  WAITING_TRUMPS_PICK: 2,
  WAITING_CARD_PLAY: 3
}


function registerGame(callback){
  client.incr('omi-games', function(err, gameId){
    createDeck(gameId, 1, function(deck){
      addInitialHands(gameId, deck, function(){
        setTurn(gameId, 1, function(){;
          createPlayers(gameId, function(){
            setTrumps(gameId, {playerId: 1}, function(){
              callback(gameId);
            });
          });
        });
      });
    });
  });
}


function registerPlayer(gameId, callback){
  client.incr('g'+gameId+'pc', function(err, id){

    if(id>4){
      //Game is full
      callback('Game is full', null, null)
      return;
    }

    sec = random();
    client.set('g'+gameId+'p'+id+'sec', sec, function(err){
      client.set(sec, JSON.stringify({gameId: gameId, playerId:id}), function(err){
        callback(null, id, sec);
      })
    })
  });
}


function random(){
  return crypto.randomBytes(8).toString('hex')
}


function setStatus(gameId, status, callback){
  console.log(">>>>>>>LLLLLL----" + status)
  client.set('g' + gameId + 'status', status, function(){
    callback(status);
  });
}


function getStatus(gameId, callback){
  client.get('g' + gameId + 'status', function(err, status){
    if(!status)
      status="2"
    callback(parseInt(status));
  });
}


function validateUser(gameId, playerId, entered_sec, callback){
  client.get('g'+gameId+'p'+id+'sec', function(err, sec){
    if(sec===entered_sec)
      callback(true);
    else
      callback(false);
  })
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


function getDeck(gameId, callback){
  console.log('getting deck');

  var roundId = 1;

  var deckId = 'g' + gameId + 'r' + roundId + 'deck';

  client.get(deckId, function(err, deck){
    if(deck){
      var deck = JSON.parse(deck);
      callback(err, deck);
      return;
    } else {
      callback("No deck for id: " + gameId);
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
        if(player){
          ps.push({
            socketId: player.socketId,
            id: player.playerId,
            name: player.name
          });
        }
      });
      callback(err, ps);
    } else {
      callback("No players for id: " + id);
    }
  });
}


function addPlayer(gameId, playerId, player, callback){
  client.lset('players-'+gameId, (playerId-1), JSON.stringify(player), function(err, players){
    if(err)
      throw err;
    callback(player)
  });
}


function createDeck(gameId, roundId, callback){
  console.log('Game: ' + gameId + ' Round: ' + roundId + ' Creating deck');

  var deckId = 'g' + gameId + 'r' + roundId + 'deck';

  client.get(deckId, function(err, deck){
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

      deck = underscore.shuffle(deck)

      client.set(deckId, JSON.stringify(deck), function(){
        callback(deck);
        return;
      });
    }
  });
}


function createPlayers(gameId, callback){
  console.log('Game: ' + gameId + ' Creating empty players');

  client.lpush('players-'+gameId, null, null, null, null, function(err, num){
    callback(err, []);
  });
}


function addInitialHands(gameId, deck, callback){
  var addHand = function(playerId){
    var first = deck.slice((playerId-1)*4, (playerId-1)*4+4);
    var second = deck.slice(16 + (playerId-1)*4, 16 + (playerId-1)*4+4);
    setHand(gameId, playerId, first.concat(second), function(){
      playerId = playerId+1;
      if(playerId<=4)
        addHand(playerId++);
      else
        callback(deck);
    });
  };

  addHand(1);
}


function setHand(gameId, playerId, hand, callback){
  var handId = 'g' + gameId + 'p' + playerId + 'hand';

  client.set(handId, JSON.stringify(hand), function(){
    callback(hand);
    return;
  });
}


function getHand(gameId, playerId, callback){
  var handId = 'g' + gameId + 'p' + playerId + 'hand';

  client.get(handId, function(err, hand){
    callback(JSON.parse(hand));
    return;
  });
}


function setHandKind(gameId, kind, callback){
  client.set('handkind-'+gameId, kind, function(){
    callback(kind);
    return;
  });
}


function getHandKind(gameId, callback){
  client.get('handkind-'+gameId, function(err, kind){
    if(!kind)
      kind = "n"
    callback(kind);
    return;
  });
}


function setTrumps(id, trumps, callback){
  console.log('setting trumps: ' + trumps);
  client.set('trumps-'+id, JSON.stringify(trumps), function(err, t){
    if(err)
      throw err;
    callback(t);
  });
}


function getTrumps(id, callback){
  console.log('getting trumps for: ' + id);
  client.get('trumps-'+id, function(err, trumps){
    if(err)
      throw err;
    if(trumps)
      callback(JSON.parse(trumps));
    else
      throw "No trumps set";
  });
}


function setTurn(gameId, turn, callback){
  client.set('g'+gameId+'turn', turn, function(){
    callback(turn);
    return;
  });
}


function getTurn(gameId, callback){
  client.get('g'+gameId+'turn', function(err, turn){
    callback(parseInt(turn));
    return;
  });
}


function addToTable(gameId, card, callback){
  client.lpush('g'+gameId+'table', JSON.stringify(card), function(){
    callback(card);
    return;
  });
}


function getTable(gameId, callback){
  client.lrange('g'+gameId+'table', 0, -1, function(err, t){
    var table = []
  
    t.forEach(function(c, i){
      table.push(JSON.parse(c))
    });
  
    callback(table);
    return;
  });
}

function resetTable(gameId, winner, callback){
  client.del('g'+gameId+'table')
  setTurn(gameId, winner, function(){
    setHandKind(gameId, 'n', function(){
      callback();
    });  
  })

}


function gameBegined(gameId, callback){
  getTrumps(gameId, function(trumphs){
    console.log(JSON.stringify(trumphs))

    if(trumphs.kind){
      callback(true)
    } else {
      callback(false)
    }
  });
}


function getGameBySec(sec, callback){
  client.get(sec, function(err, game){
    if(err)
      throw err;
    if(game)
      callback(null, JSON.parse(game));
    else
      callback("No such game", null);
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

Game.prototype.addPlayer = function(id, connectionId, name){
  console.log('adding player: ' + id + ' to game: ' + this.id);

  player = {id: id, connectionId: connectionId, name: name};
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
    console.log(players)
    players.forEach(function(player, i){
      var player = JSON.parse(player);
      if(player){
        if(player.id && player.id!=id)
          conns.push(player.connectionId);
      }
    });
    callback(conns);
  });
}

exports.getGame = getGame;
exports.registerGame = registerGame;
exports.registerPlayer = registerPlayer;
exports.setTrumps = setTrumps;
exports.getTrumps = getTrumps;
exports.setHand = setHand;
exports.getHand = getHand;
exports.setHandKind = setHandKind;
exports.getHandKind = getHandKind;
exports.setTurn = setTurn;
exports.getTurn = getTurn;
exports.addToTable = addToTable;
exports.getTable = getTable;
exports.resetTable = resetTable;
exports.gameBegined = gameBegined;
exports.getGameBySec = getGameBySec;
exports.gameStatus = gameStatus;
exports.setStatus = setStatus;
exports.getStatus = getStatus;
exports.getPlayers = getPlayers;
exports.addPlayer = addPlayer;