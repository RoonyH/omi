var Game = Backbone.Model.extend({
  defaults: function() {
    return {
      type: 'omi',
      players: new PlayerCollection()
    };
  },

  getPlayerById: function(id){
  },

  createCard: function(card){
    var card = new Card(card);
    return card;
  }

  createPlayer: function(player){
    var player = new Player(player);
    var pv = new PlayerView({model: player});
    this.get('players').add(player);
    return player;
  },

  giveCardToPlayer: function(card, player){
    this.get('players').get(player).giveCard(card);
    return card;
  }

  placeCardOnTable: function(){
  }
});

