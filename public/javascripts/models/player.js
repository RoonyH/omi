var Player = Backbone.Model.extend({
  defaults: function() {
    return {
      id: 3,
      cards: []
    };
  },

  giveCard: function(card) {
    this.get('cards').push(card);
    this.trigger('card-given', card);
  }
});
