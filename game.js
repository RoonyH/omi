var redis = require('redis')

var client = redis.createClient();

function getGame(id, callback){
  console.log('looking for game: ' + id);

  client.get('deck-'+id, function(err, deck){
    if(deck){
      deck = JSON.parse(deck);
    }
    var game = new Game(id, deck);
    callback(game);
  });
}


function Game(id, deck, table, players){
  this.id = id;
  if(deck)
    this.deck = deck;
  else
    this.createDeck();
  this.table = [];
  if(players)
    this.players = players;
  else
    this.createPlayers();
}

Game.prototype.start = function(){
  this.players
}

Game.prototype.createDeck = function(){
  console.log('creating deck')

  var kinds = ['c', 'd', 'h', 's'];
  var values = [1, 7, 8, 9, 10, 11, 12, 13];

  var deck = [];

  kinds.forEach(function(kind){
    values.forEach(function(value){
      deck.push({kind: kind, value: value});
    });
  });

  this.deck = deck;
  client.set('deck-'+this.id, JSON.stringify(deck))
}

Game.prototype.createPlayers = function(){
  client.lpush('players-'+this.id, ['nil', 'nil', 'nil', 'nil']);
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

Game.prototype.connectPlayer = function(id){

}

Game.prototype.connectOtherPlayers = function(id){

}

exports.getGame = getGame;
