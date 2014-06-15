var Player = Backbone.Model.extend({
  defaults: function() {
    return {
      id: 3,
      cards: new CardCollection()
    };
  },

  giveCard: function(card) {
    this.get('cards').add(card);
    console.log('card ' + card.get('kind') + card.get('value') +
                ' given to the player: ' + this.get('id'));
  }
});
