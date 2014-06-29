define(["jquery", "backbone", "models/card", "models/player", "models/table", "collections/players", "collections/tables"], 
      function($, Backbone, cardModel, playerModel, tableModel, playerCollection, tableCollection) {

  var Game = Backbone.Model.extend({
    defaults: function() {
      return {
        type: 'omi',
        players: new playerCollection.PlayerCollection(),
        tables: new tableCollection.TableCollection()
      };
    },

    getPlayerById: function(id){
    },

    createCard: function(card){
      var card = new cardModel.Card(card);
      return card;
    },

    createPlayer: function(player){
      var player = new playerModel.Player(player);
      this.get('players').add(player);
      return player;
    },

    createTable: function(table){
      var table = new tableModel.Table(table);
      this.get('tables').add(table);
      return table;
    }  
  });
  
  return {
    Game: Game
  };
});

