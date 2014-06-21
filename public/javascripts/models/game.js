var Game = Backbone.Model.extend({
  defaults: function() {
    return {
      type: 'omi',
      players: new PlayerCollection(),
      tables: new TableCollection()
    };
  },

  getPlayerById: function(id){
  },

  createCard: function(card){
    var card = new Card(card);
    return card;
  },

  createPlayer: function(player){
    var player = new Player(player);
    var pv = new PlayerView({model: player});
    this.get('players').add(player);
    return player;
  },

  createTable: function(table){
    var table = new Table(table);
    var tv = new TableView({model: table});
    this.get('tables').add(table);
    return table;
  }  
});

