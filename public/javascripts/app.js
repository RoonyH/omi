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
      g = new game.Game();
      p = g.createPlayer({id: omiGameConf.playerId, name:'Alex'});
      t = g.createTable({id: 1});

      console.log(data.hand)

      data.hand.forEach(function(card){
        var c = g.createCard(card);
        p.giveCard(c);
      });

      socket.on('other-player-got-first-hand', function(data){
        console.log(data);
        var pl = g.createPlayer({id:data.id, name:'Alex'});
        var c = g.createCard();
        pl.giveCard(c);
      });
    });

    socket.emit('start', {gameId: omiGameConf.gameId, playerId: omiGameConf.playerId})
  });
});
