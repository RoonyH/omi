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
    var protocol = window.location.protocol;
    socket = io.connect(protocol + '//' + host);

    socket.on('game', function (data) {
      console.log(data)
      g = new game.Game();
      p = g.createPlayer({
        id: omiGameConf.playerId,
        name:'Alex',
        trumpher: (data.trumphs.playerId == omiGameConf.playerId) && (data.status == 2)
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
      
      setTimeout(function(){p.sortCards()}, 1000)

      if(data.table){
        data.table.forEach(function(card){
          t.placeCard(g.createCard(card), card.pid)
        })
      }

      data.players.forEach(function(player){
        console.log(player)
        if(player.id != omiGameConf.playerId)
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
        t.placeCard(g.createCard(data.card), data.player)
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
        setTimeout(function(){p.sortCards()}, 2000)
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
        p.sortCards();

      });
    });

    $('.trumph-button').click(function(){
      p.set('trumpher', false)

      socket.emit('trumphs-picked', data = {
        gameId: omiGameConf.gameId, playerId: omiGameConf.playerId,
        trumphs: $($(this).children()[0]).html()
      })
      
      $('#trumphs-pick').css('visibility', 'hidden')
    })

    socket.on('connect', function(){
      socket.emit('start', {gameId: omiGameConf.gameId, playerId: omiGameConf.playerId})
    });
  });
});

function getCookieValue(a, b) {
    b = document.cookie.match('(^|;)\\s*' + a + '\\s*=\\s*([^;]+)');
    return b ? b.pop() : '';
}