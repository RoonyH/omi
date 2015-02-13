define(["backbone", "collections/cards"],
       function(Backbone, cardCollection) {

  var Table = Backbone.Model.extend({
    defaults: function() {
      return {
        id: 1,
        name: 'Table',
        cards: new cardCollection.CardCollection()
      };
    },

    placeCard: function(card, pid) {
      this.get('cards').add(card);
      this.trigger('card-placed', {card: card, pid: pid});
    },
    
    clear: function(){
      this.get('cards').reset();
    }
  });

  return {
    Table: Table
  }
});

