define(["backbone"], function(Backbone) {
  var Card = Backbone.Model.extend({
    defaults: function() {
      return {
        name: 'unknown',
        value: 0,
        kind: null
      };
    },

    remove: function() {
      this.trigger('removed');
      console.log('removed');
    }
  });

  return {
    Card: Card
  }
});
