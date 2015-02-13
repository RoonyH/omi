var redis = require('redis');
var crypto = require('crypto');
var underscore = require('underscore');

var redisPort = process.env.REDIS_PORT||'6379';
var redisHost = process.env.REDIS_HOST||'localhost';
var redisPass = process.env.REDIS_PASS||'pass';

var client = redis.createClient(redisPort, redisHost);

var ROUNDS_PER_MATCH = 2;

client.auth(redisPass, function(){
  console.log("Connected to "+redisHost+":"+redisPort);
  console.log("authenticated!");
})

var gameStatus = {
  NO_GAME: 0,
  WAITING_PLAYER_JOIN: 1,
  WAITING_TRUMPS_PICK: 2,
  WAITING_CARD_PLAY: 3
}


function registerGame(callback){
  client.incr('omi-games', function(err, gameId){
    setStatus(gameId, gameStatus.WAITING_PLAYER_JOIN, function(){
      createPlayers(gameId, function(){
        registerRound(gameId, function(){
          client.rpush('opengames', gameId, function(){
            callback(gameId);
          });
        });
      });
    });
  });
}


function registerPlayer(gameId, callback){
  client.incr('g'+gameId+'pc', function(err, id){

    if(id>4){
      // Game is full.
      callback('game-full', null, null)
      return;
    }

    if(id==4){
      client.lrem('opengames', gameId, 1, function(){
        // Game is no longer open for player connections.
      })
    }

    sec = random(); // An identifier for the player. It should be a 'sec'ret.
    client.set('g'+gameId+'p'+id+'sec', sec, function(err){
      client.set(sec, JSON.stringify({gameId: gameId, playerId:id}), function(err){
        callback(null, id, sec);
      })
    })
  });
}


function registerRound(gameId, callback){
  var getFirstHand = function(deck, playerId){
    return deck.slice((playerId-1)*4, (playerId-1)*4+4);
  }

  var getSecondHand = function(deck, playerId){
    return deck.slice(16 + (playerId-1)*4, 16 + (playerId-1)*4+4);
  }

  client.hincrby('g'+gameId, 'round', 1, function(err, round){
    createDeck(gameId, round, function(deck){
      client.hmset('g'+gameId,
        'status', gameStatus.WAITING_TRUMPS_PICK,
        'p1hand', JSON.stringify(getFirstHand(deck, 1).concat(getSecondHand(deck, 1))),
        'p2hand', JSON.stringify(getFirstHand(deck, 2).concat(getSecondHand(deck, 2))),
        'p3hand', JSON.stringify(getFirstHand(deck, 3).concat(getSecondHand(deck, 3))),
        'p4hand', JSON.stringify(getFirstHand(deck, 4).concat(getSecondHand(deck, 4))),
        'p1wins', 0,
        'p2wins', 0,
        'p3wins', 0,
        'p4wins', 0,
        'turn', (round-1)%4+1,
        'trumpher', (round-1)%4+1,
        callback
      );
    });
  });
}


function clearRound(gameId, callback){
  setRoundWins(gameId, function(){
    client.hget('g'+gameId, 'round', function(err, round){
      if(round>=ROUNDS_PER_MATCH){
        callback('game-over');
      } else {
        callback('round-over');
      }
    });
  });
}


function getOpenGame(callback){
  client.lrange('opengames', 0, 0, function(err, games){
    console.log('getOpenGame: Oldest open game is ' + games[0])

    if(games){
      callback(games[0]);
    } else {
      callback(null);
    }
  })
}


function setRoundWins(id, callback){  
  client.hmget('g'+id,
    'p1wins', 'p2wins', 'p3wins', 'p4wins',
    function(err, res){
      var score = {
        teamA: parseInt(res[0]) + parseInt(res[2]),
        teamB: parseInt(res[1]) + parseInt(res[3])
      }

      var wonteam = 'draw'

      if(score.teamB > score.teamA){
        wonteam = 'teamBwins'
      }

      if(score.teamB < score.teamA){
        wonteam = 'teamAwins'
      }

      client.hincrby('g'+id, wonteam, 1, function(){
        callback(wonteam)
      })
    }
  );  
}


function random(){
  return crypto.randomBytes(8).toString('hex')
}


function setStatus(gameId, status, callback){
  client.hset('g' + gameId, 'status', status, function(){
    callback(status);
  });
}


function getStatus(gameId, callback){
  client.hget('g' + gameId, 'status', function(err, status){
    if(!status)
      status='0'
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

  var game = {};

  client.hmget('g'+id, 'p1hand', 'p2hand', 'p3hand', 'p4hand',
    function(err, hands){
      game.hands = underscore.map(hands, JSON.parse);;
      getPlayers(id, function(err, players){
        game.players = players;
        callback(game);
      });
    }
  );
}

function getScore(id, callback){
  console.log('looking for score of game: ' + id);

  client.hmget('g'+id,
    'p1wins', 'p2wins', 'p3wins', 'p4wins', 'teamAwins', 'teamBwins',
    function(err, res){
      var score = {
        teamA: parseInt(res[0]) + parseInt(res[2]),
        teamB: parseInt(res[1]) + parseInt(res[3]),
        roundTeamA: parseInt(res[4])||0,
        roundTeamB: parseInt(res[5])||0

      }

      callback(score)
    }
  );
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


function getPlayer(gameId, playerId, callback){
  client.lindex('players-'+gameId, (playerId-1), function(err, player){
    if(err)
      throw err;
    callback(JSON.parse(player))
  });
}


function createDeck(gameId, roundId, callback){
  console.log('Game: ' + gameId + ' Round: ' + roundId + ' Creating deck');

  var deckId = 'g' + gameId + 'r' + roundId + 'deck';

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
  client.hset('g'+gameId, 'p' + playerId + 'hand', JSON.stringify(hand),
    function(){
      callback(hand);
      return;
    });
}


function getHand(gameId, playerId, callback){
  client.hget('g'+gameId, 'p' + playerId + 'hand',
    function(err, hand){
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


function setTrumphs(gameId, trumphs, callback){
  console.log('setting trumphs: ' + trumphs);
  client.hset('g'+gameId, 'trumphs', trumphs, function(err, t){
    if(err)
      throw err;
    callback(t);
  });
}


function getTrumphs(id, callback){
  console.log('getting trumps for: ' + id);
  client.hget('g'+id, 'trumphs', function(err, trumphs){
    if(err)
      throw err;
    if(trumphs)
      callback(trumphs);
    else
      throw "No trumps set";
  });
}

function getTrumpher(id, callback){
  console.log('getting trumphers for: ' + id);
  client.hget('g'+id, 'trumpher', function(err, trumpher){
    if(err)
      throw err;
    if(trumpher)
      callback(trumpher);
    else
      throw "No trumps set";
  });
}


function setTurn(gameId, turn, callback){
  client.hset('g'+gameId, 'turn', turn, function(){
    callback(turn);
    return;
  });
}


function getTurn(gameId, callback){
  client.hget('g'+gameId, 'turn', function(err, turn){
    callback(parseInt(turn));
    return;
  });
}


function addToTable(gameId, card, callback){
  client.rpush('g'+gameId+'table', JSON.stringify(card), function(){
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
  client.hincrby('g'+gameId, 'p' + winner + 'wins', 1, function(err, res){
    console.log('adoee' + res)
    setTurn(gameId, winner, function(){
      setHandKind(gameId, 'n', function(){
        callback();
      });  
    });
  });

}


function newRound(gameId, playerId, callback){

  client.hmget('g'+gameId, 'p'+playerId+'hand', 'trumpher',
    function(err, result){
      var hand = result[0];
      var trumpher = result[1];

      callback(err, {
        hand: JSON.parse(hand).splice(0, 4),
        trumpher: trumpher
      });
    }
  );
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
      callback("no-such-game", null);
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
exports.registerRound = registerRound;
exports.setTrumphs = setTrumphs;
exports.getTrumphs = getTrumphs;
exports.setHand = setHand;
exports.getHand = getHand;
exports.setHandKind = setHandKind;
exports.getHandKind = getHandKind;
exports.setTurn = setTurn;
exports.getTurn = getTurn;
exports.addToTable = addToTable;
exports.getTable = getTable;
exports.resetTable = resetTable;
exports.newRound = newRound;
exports.gameBegined = gameBegined;
exports.getGameBySec = getGameBySec;
exports.gameStatus = gameStatus;
exports.setStatus = setStatus;
exports.getStatus = getStatus;
exports.getPlayers = getPlayers;
exports.addPlayer = addPlayer;
exports.getPlayer = getPlayer;
exports.createDeck = createDeck;
exports.getTrumpher = getTrumpher;
exports.getScore = getScore;
exports.getOpenGame = getOpenGame;
exports.clearRound = clearRound;