requirejs.config({
    paths: {
        'jquery': './thirdparty/jquery.min',
        'underscore': './thirdparty/underscore',
        'backbone': './thirdparty/backbone'
    }
});

require(['jquery', 'models/game'], function($, game){
  $(function(){
    var messages = {
      cant_play_kind_s: "You can't play that card there. Play a Spade which " +
        "match the first played card on the table." ,
      cant_play_kind_c: "You can't play that card there.. Play a Club which " +
        "match the first played card on the table." ,
      cant_play_kind_h: "You can't play that card there. Play a Heart which " +
        "match the first played card on the table." ,
      cant_play_kind_d: "You can't play that card there. Play a Diamond which " +
        "match the first played card on the table.",
      not_started: "You can't play a card until trumphs are picked.",
      not_turn: "It's not your turn! Please wait till you get your turn :)"
    }

    var host = window.location.hostname;
    var protocol = window.location.protocol;
    socket = io.connect(protocol + '//' + host);

    socket.on('game', function (data) {

      console.log(data);
      g = new game.Game();
      p = g.createPlayer({
        id: omiGameConf.playerId,
        name:'You',
        trumpher: (data.trumpher == omiGameConf.playerId)&&(data.status==2)
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
        console.log(player);
        if(player.id != omiGameConf.playerId)
          var p = g.createPlayer(player);
      });

      if(p.get('trumpher') && (g.get('players').length==4) && data.status==2){
        $('#trumphs-picker').css('visibility', 'visible')
      }

      // displaye score, could go to backbone view of game.
      $("#red-hand-wins").html(data.score.teamB)
      $("#black-hand-wins").html(data.score.teamA)
      $("#red-round-wins").html(data.score.roundTeamB)
      $("#black-round-wins").html(data.score.roundTeamA)

      // displaye trumphs, could go to backbone view of game.
      $('#trump-display > .trumps-dis').addClass('trumps-dis-' + data.trumphs)

      // displaye turn could go to backbone view of game.
      $('.turn-now').first().removeClass('turn-now');
      $('#player-'+data.turn+' > #border').addClass('turn-now');

      socket.on('new-round', function(data){

        p.set('trumpher', data.trumpher == omiGameConf.playerId);

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

        if(p.get('trumpher') && (g.get('players').length==4) && data.status==2){
          $('#trumphs-picker').css('visibility', 'visible')
        }
      })

      socket.on('other-player-got-first-hand', function(data){
        console.log(data);
        var pl = g.createPlayer({id: data.id, name: data.name});

        if(p.get('trumpher') && (g.get('players').length==4) && data.status==2){
          $('#trumphs-picker').css('visibility', 'visible')
        }
      });

      socket.on('played-card', function(data){
        console.log(data);
        t.placeCard(g.createCard(data.card), data.player)
        if(data.winner){
          g.set('winner', data.winner)
          var message = data.winner.name + ' Won that hand!';

          $('.turn-now').first().removeClass('turn-now');
          $('#player-'+data.winner.playerId+' > #border').addClass('turn-now');


          if(data.winner.playerId==omiGameConf.playerId){
            message = 'You Won!';
          }
          setTimeout(function(){
            $('#message > h1').html(message);
            $('#message > p').html("");
            $('#message').css('display', 'block');

            setTimeout(function(){
              $('#message').fadeOut();

              if(data.end==='game-over'){
                $('#message > h1').html('Game Over!');
                $('#message > p').html('Thank you very much for heading this way! '+
                  'Send your thoughts to amazingfun2012@gmail.com');
                $('#message').css('display', 'block')
              }

            }, 3000);

            t.clear();

            if(data.end==='round-over'){ // if all cards are over
              socket.emit('round', {gameId: omiGameConf.gameId, playerId: omiGameConf.playerId})
            }
          }, 2000)

          $("#red-hand-wins").html(data.score.teamB)
          $("#black-hand-wins").html(data.score.teamA)
          $("#red-round-wins").html(data.score.roundTeamB)
          $("#black-round-wins").html(data.score.roundTeamA)
        } else {
          $('.turn-now').first().removeClass('turn-now');
          $('#player-'+((data.player)%4+1)+' > #border').addClass('turn-now');


          if((data.player)%4+1 == omiGameConf.playerId){
            $('#message > h1').html("It's your turn!");
            $('#message > p').html("");
            $('#message').css('display', 'block');

            setTimeout(function(){
              $('#message').fadeOut();
            }, 2000);
          }
        }
      });

      socket.on('trumps-and-next-hand', function(data){
        console.log(data);
        $('#trump-display > .trumps-dis').attr('class', 
              'trumps-dis ' + 'trumps-dis-' + data.trumphs)
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
        $('#message > h1').html("Trumphs picked!");
        $('#message > p').html("Trumphs are displayed in the top right coner.<br>"+
          "Here we go then.. Let the omi begin!");
        $('#message').css('display', 'block');

        setTimeout(function(){
          $('#message').fadeOut();
        }, 4000);
      });

      socket.on('cant-play-card', function(data){
        console.log(data);
        $('#message > h1').html("Can't play card!");
        $('#message > p').html(messages[data.msg]);
        $('#message').css('display', 'block');
        setTimeout(function(){$('#message').fadeOut()}, 3000)

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


    socket.on('connect', function(){
      var details = {
        sec: getCookieValue('sec'),
        name: "Player " + omiGameConf.playerId
      }

      if(typeof FB != 'undefined'){
        if(omiGameConf.fbConnected){
          socket.emit('start', details) //if socket disconnected after fb connect
        } else {
          connectFB(function(user){

            details.name = user.first_name;
            details.picUrl = user.picture.data.url;
            console.log(details);
            console.log(user);
            omiGameConf.fbConnected = true;
            socket.emit('start', details);
          })
        }
      } else {
        socket.emit('start', details);
      }
    });
  });
});

function getCookieValue(a, b) {
    b = document.cookie.match('(^|;)\\s*' + a + '\\s*=\\s*([^;]+)');
    return b ? b.pop() : '';
}