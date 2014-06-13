var Game = Backbone.Model.extend({
  defaults: function() {
    return {
      type: 'omi',
      players: []
    };
  }
});

