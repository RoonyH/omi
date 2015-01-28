define(['jquery', 'backbone'], function($, Backbone){
  var CardCollection = Backbone.Collection.extend({
    comparator: function(card){
      var v= card.get('value');
      if(v==1)
        v=14
      return [card.get('kind'), v+10];
    }
  });

  return {
    CardCollection: CardCollection
  }
});
