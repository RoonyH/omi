requirejs.config({
    paths: {
        'jquery': './thirdparty/jquery.min',
        'underscore': './thirdparty/underscore',
        'backbone': './thirdparty/backbone'
    }
});


require(['jquery', 'models/game'], function($, game){
  $(function(){
    var socket = io.connect('http://localhost');

    socket.on('game', function (data) {
      g = new game.Game();
      p = g.createPlayer({id:1, name:'Alex'});
      t = g.createTable({id: 1});

      console.log(data.hand)

      data.hand.forEach(function(card){
        var c = g.createCard(card);
        p.giveCard(c);
      });
    });

    console.log('hey')
    socket.emit('start', {gameId:1, playerId:1})
  });
});
