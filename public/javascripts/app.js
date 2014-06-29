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
    c1 = g.createCard({kind:'h', value:11});
    c2 = g.createCard({kind:'h', value:1});


    
    c2.clickHandler = function(){console.log('hi hi his')}

    c3 = g.createCard({kind:'s', value:10});
    c4 = g.createCard({kind:'d', value:1});
    c5 = g.createCard({kind:'c', value:13});
    c6 = g.createCard({kind:'d', value:1});
    c7 = g.createCard({kind:'h', value:2});
    c8 = g.createCard({kind:'s', value:7});
    p.giveCard(c1);
    p.giveCard(c2);
    p.giveCard(c3);
    p.giveCard(c4);
    p.giveCard(c5);
    p.giveCard(c6);
    p.giveCard(c7);
    p.giveCard(c8);
    p.playCard(c1,t);
  });
});
