define(["jquery", "backbone", "models/card", "models/player", "models/table", "collections/cards", "collections/players",
        "collections/tables", "views/card", "views/player", "views/table"], 
      function($, Backbone, cardModel, playerModel, tableModel, cardCollection, playerCollection, tableCollection,
               cardView, playerView, tableView) {

  var Game = Backbone.Model.extend({
    defaults: function() {
      return {
        type: 'omi',
        players: new playerCollection.PlayerCollection(),
        tables: new tableCollection.TableCollection()
      };
    },

    createCard: function(card){
      var card = new cardModel.Card(card);
      return card;
    },

    createPlayer: function(player){
      var player = new playerModel.Player(player);
      var pv = new playerView.PlayerView({model: player});
      pv.render();
      this.get('players').add(player);
      return player;
    },

    createTable: function(table){
      var table = new tableModel.Table(table);
      var tv = new tableView.TableView({model: table});
      tv.render();
      this.get('tables').add(table);
      return table;
    }  
  });
  
  return {
    Game: Game
  };
});

