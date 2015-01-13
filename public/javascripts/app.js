requirejs.config({
    paths: {
        'jquery': './thirdparty/jquery.min',
        'underscore': './thirdparty/underscore',
        'backbone': './thirdparty/backbone'
    }
});


require(['jquery', 'models/game'], function($, game){
  $(function(){
    socket = io.connect('http://localhost');

    socket.on('game', function (data) {
      var g = new game.Game();
      var p = g.createPlayer({id: omiGameConf.playerId, name:'Alex'});
      var t = g.createTable({id: 1});

      data.hand.forEach(function(card){
        var c = g.createCard(card);
        c.set('clickHandler', function(){p.playCard(c, t)})
        p.giveCard(c);
      });

      data.players.forEach(function(player){
        var p = g.createPlayer(player);
        for(var i=0; i<4; i++){
          var c = g.createCard(); //create unknown cards
          p.giveCard(c);
        }
      });

      socket.on('other-player-got-first-hand', function(data){
        console.log(data);
        var pl = g.createPlayer({id:data.id, name:'Alex'});
        for(var i=0; i<4; i++){
          var c = g.createCard(); //create unknown cards
          pl.giveCard(c);
        }
      });
      
      socket.on('trumps-and-next-hand', function(data){
        console.log(data);
        data.hand.forEach(function(card){
          var c = g.createCard(card);
          c.set('clickHandler', function(){p.playCard(c, t)})
          p.giveCard(c);
        });
      });
    });

    socket.emit('start', {gameId: omiGameConf.gameId, playerId: omiGameConf.playerId})
  });
});
