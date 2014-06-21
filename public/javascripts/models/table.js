var Table = Backbone.Model.extend({
  defaults: function() {
    return {
      id: 1,
      cards: new CardCollection()
    };
  },

  placeCard: function(card) {
    this.get('cards').add(card);
    console.log('card: ' + card.get('kind') + card.get('value') +
                ' placed on the table: ' + this.get('id'));
  },  
});

