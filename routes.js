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

  var game = gameModule.getGame(gameId, function(game){
    callback(game);
  });
}
