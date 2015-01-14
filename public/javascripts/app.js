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
      p = g.createPlayer({
        id: omiGameConf.playerId, name:'Alex', trumpher: data.trumpher
      });
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
        if(p.get('trumpher') && (g.get('players').length==4)){
          $('#trumphs-pick').css('visibility', 'visible')
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

    $('.trumph-button').click(function(){
      console.log($(this).html())
      
      socket.emit('trumphs-picked', data = {
        gameId: omiGameConf.gameId, playerId: omiGameConf.playerId,
        trumphs: $(this).html()
      })
      
      $('#trumphs-pick').css('visibility', 'hidden')
    })

    socket.emit('start', {gameId: omiGameConf.gameId, playerId: omiGameConf.playerId})
  });
});
