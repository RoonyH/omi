var url = require('url');

var gameModule = require('./game');


exports.index = function(req, res){
  var url_parts = url.parse(req.url, true);
  var query = url_parts.query;
  
  if(query.gameId){
    var gameId = parseInt(query.gameId);
  
    gameModule.registerPlayer(gameId, function(playerId){
      res.render('game', {gameId: parseInt(query.gameId), playerId: playerId});
    });
  } else {
    gameModule.registerGame(function(gameId){
      gameModule.registerPlayer(gameId, function(playerId){
        res.render('game', {gameId: gameId, playerId: playerId})
      });
    });
  }
};


exports.game = function(opt, callback){
  console.log('finding game' + JSON.stringify(opt))

  var gameId = opt.gameId;

  gameModule.getGame(gameId, function(game){
    callback(game);
  });
}


exports.trumpsPicked = function(data, callback){
  gameModule.getTrumps(data.gameId, function(t){
    if(t.playerId == data.playerId){

      trumphKind = {
        Clubs: "c",
        Hearts: "h",
        Spades: "s",
        Diamonds: "d"
      }

      opt = {
        gameId: data.gameId,
        playerId: data.playerId,
        kind: trumphKind[data.trumphs]
      }
    
      gameModule.setTrumps(data.gameId, opt, function(){
        gameModule.getGame(data.gameId, function(game){
          callback(null, game);
        });
      });
    } else {
      callback("You are not the player to pick trumps", null);
    }
  });
}
