define(["backbone", "views/table", "collections/cards"],
       function(Backbone, tableView, cardCollection) {

  var Table = Backbone.Model.extend({
    defaults: function() {
      return {
        id: 1,
        name: 'Table',
        cards: new cardCollection.CardCollection()
      };
    },

    initialize: function(){
      var tv = new tableView.TableView({model: this});
      tv.render();
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

