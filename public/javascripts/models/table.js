var Table = Backbone.Model.extend({
  defaults: function() {
    return {
      handNo: 0,
      cards: [],
      players: [],
      trump: null
    };
  }
});

