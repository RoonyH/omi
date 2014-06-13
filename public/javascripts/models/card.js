var Card = Backbone.Model.extend({
  defaults: function() {
    return {
      name: 'unknown',
      value: 0,
      kind: null
    };
  }
});

