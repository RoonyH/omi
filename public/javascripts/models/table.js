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

    placeCard: function(card) {
      this.get('cards').add(card);
      console.log('card: ' + card.get('kind') + card.get('value') +
                  ' placed on the table: ' + this.get('id'));
    },  
  });

  return {
    Table: Table
  }
});

