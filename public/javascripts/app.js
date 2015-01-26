requirejs.config({
    paths: {
        'jquery': './thirdparty/jquery.min',
        'underscore': './thirdparty/underscore',
        'backbone': './thirdparty/backbone'
    }
});

require(['jquery', 'models/game'], function($, game){
  $(function(){
    var host = window.location.hostname; 
    var socket = io.connect('https://' + host);

    socket.on('game', function (data) {
      g = new game.Game();
      p = g.createPlayer({
        id: omiGameConf.playerId, name:'Alex', trumpher: data.trumpher
      });
      t = g.createTable({id: 1});

      data.hand.forEach(function(card){
        var c = g.createCard(card);
        c.set('clickHandler', function(){
          p.takeCard(c);      
          socket.emit('card-played', data = {
            gameId: omiGameConf.gameId, playerId: omiGameConf.playerId,
            card: c
          });
        });
        p.giveCard(c);
      });

      data.players.forEach(function(player){
        var p = g.createPlayer(player);
      });

      socket.on('other-player-got-first-hand', function(data){
        console.log(data);
        var pl = g.createPlayer({id:data.id, name:'Alex'});

        if(p.get('trumpher') && (g.get('players').length==4)){
          $('#trumphs-pick').css('visibility', 'visible')
        }
      });

      socket.on('played-card', function(data){
        console.log(data);
        t.placeCard(g.createCard(data.card))
        if(data.winner){
          setTimeout(function(){
            $('#message').html('p' + data.winner + 'Won that hand!');
            $('#message').css('visibility', 'visible');
            setTimeout(function(){$('#message').css('visibility', 'hidden')}, 2000)
            t.clear();
          },2000)
        }
      });

      socket.on('trumps-and-next-hand', function(data){
        console.log(data);
        data.hand.forEach(function(card){
          var c = g.createCard(card);
          c.set('clickHandler', function(){            
            p.takeCard(c);      
            socket.emit('card-played', data = {
              gameId: omiGameConf.gameId, playerId: omiGameConf.playerId,
              card: c
            })
          })
          p.giveCard(c);
        });
      });

      socket.on('cant-play-card', function(data){
        console.log(data);
        $('#message').html(data.msg);
        $('#message').css('visibility', 'visible');
        setTimeout(function(){$('#message').css('visibility', 'hidden')}, 2000)

        var c = g.createCard(data.card);
        c.set('clickHandler', function(){
          p.takeCard(c);      
          socket.emit('card-played', data = {
            gameId: omiGameConf.gameId, playerId: omiGameConf.playerId,
            card: c
          });
        });

        p.giveCard(c);

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
