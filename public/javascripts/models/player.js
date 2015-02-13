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

    giveCard: function(card) {
      this.get('cards').add(card);
    },

    takeCard: function(card){
      this.get('cards').remove(card);
      return card;
    },

    playCard: function(card, table){
      table.placeCard(this.takeCard(card));
    },

    sortCards: function(){
      this.trigger('sort')
    }
  });

  return {
    Player: Player
  }
});
