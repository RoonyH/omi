function Game(){
  this.createDeck()
}

Game.prototype.start = function(){

}

Game.prototype.createDeck = function(){
  var kinds = ['c', 'd', 'h', 's'];
  var values = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13];

  var deck = [];

  kinds.forEach(function(kind){
    values.forEach(function(value){
      deck.push({kind: kind, value: value});
    });
  });

  console.log('Deck created ' + deck);
  this.deck = deck;
  this.table = [];
  this.players = [];
}

exports.Game = Game;
