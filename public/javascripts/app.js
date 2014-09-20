requirejs.config({
    paths: {
        'jquery': './thirdparty/jquery.min',
        'underscore': './thirdparty/underscore',
        'backbone': './thirdparty/backbone'
    }
});


require(['jquery', 'models/game'], function($, game){
  $(function(){
    g = new game.Game();
    p = g.createPlayer({id:3, name:'Alex'});
    t = g.createTable({id: 1});

    $.getJSON('/game', {}, function(data){
      data.hand.forEach(function(card){
        var c = g.createCard(card);
        p.giveCard(c);
      });
    })

  });
});
