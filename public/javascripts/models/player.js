define(["backbone", "views/player", "collections/cards"], 
  function(Backbone, playerView, cardCollection) {
  var Player = Backbone.Model.extend({
    defaults: function() {
      return {
        id: 3,
        name: 'Player',
        cards: new cardCollection.CardCollection()
      };
    },

    initialize: function(){
      var pv = new playerView.PlayerView({model: this});
      pv.render();
    },

    giveCard: function(card) {
      card.set('player', this);
      this.get('cards').add(card);
      console.log('card: ' + card.get('kind') + card.get('value') +
                  ' given to the player: ' + this.get('id'));
    },

    takeCard: function(card){
      this.get('cards').remove(card);
      return card;
    },

    playCard: function(card, table){
      table.placeCard(this.takeCard(card));
    }
  });

  return {
    Player: Player
  }
});
