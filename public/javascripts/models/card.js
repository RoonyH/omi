define(["backbone"], function(Backbone) {
  var Card = Backbone.Model.extend({
    defaults: function() {
      return {
        name: 'unknown',
        value: 0,
        kind: null,
        clickHandler: function(){console.log("clicked: "+this.kind+" "+this.value)}
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
